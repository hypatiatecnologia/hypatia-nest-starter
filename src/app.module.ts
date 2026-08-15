import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { config as loadDotenv } from 'dotenv';
import loadConfiguration, { AppConfig, validateConfig } from './config/configuration';
import { CORRELATION_ID_HEADER } from './common/correlation/correlation.constants';
import { JwtAuthGuard } from './common/auth/jwt-auth.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { discoverFeatureModules } from './common/module-discovery/module-discovery';
import { HttpClientModule } from './http/http-client.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { RedisService } from './redis/redis.service';
import { RabbitMqModule } from './rabbitmq/rabbitmq.module';
import { HealthController } from './health.controller';

/**
 * Root module — wires shared infrastructure and feature modules.
 *
 * Layout convention (add your domain under `src/modules/<feature>/`):
 *   src/
 *   ├── config/          Typed env (see configuration.ts)
 *   ├── prisma/          PostgreSQL via Prisma
 *   ├── redis/           Cache, locks, event dedupe
 *   ├── rabbitmq/        Async messaging (optional per RABBITMQ_MODE)
 *   └── modules/         Feature modules (auto-discovered at bootstrap)
 *
 * Feature modules under `src/modules/<feature>/<feature>.module.ts` are
 * registered automatically — no manual import in this file.
 *
 * Why a dynamic `register()` instead of a plain static `@Module()`? Feature
 * modules are discovered on disk at bootstrap, and that discovery is async —
 * decorators cannot await. main.ts and the e2e tests both call
 * `AppModule.register()`, so tests always boot the exact production wiring.
 */
@Module({})
export class AppModule {
  static async register(): Promise<DynamicModule> {
    // Order matters: hydrate process.env from .env, validate it (fail fast on
    // bad config), then discover feature modules — some need the typed config
    // (e.g. ExampleModule switches controllers/consumers on rabbitmqMode).
    loadDotenv({ quiet: true });
    const appConfig = loadConfiguration();
    const featureModules = await discoverFeatureModules({ appConfig });

    return {
      module: AppModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [loadConfiguration],
          validate: validateConfig,
        }),
        LoggerModule.forRoot({
          pinoHttp: {
            transport:
              appConfig.nodeEnv !== 'production'
                ? { target: 'pino-pretty', options: { singleLine: true } }
                : undefined,
            // Reuse the caller's correlation id as pino's request id: one grep
            // then finds gateway, API, and worker logs for the same request.
            genReqId: (req) => {
              const header = req.headers[CORRELATION_ID_HEADER];
              const value = Array.isArray(header) ? header[0] : header;
              return value ?? randomUUID();
            },
            customProps: (req) => ({ correlationId: req.id }),
            redact: {
              // Covers top-level body fields and one nesting level (fast-redact
              // allows a single `*` per path). For deeper structures, redact
              // explicitly with redactPayload before logging.
              paths: [
                'req.headers.authorization',
                'req.headers["x-api-key"]',
                ...[
                  'password',
                  'cpf',
                  'token',
                  'accessToken',
                  'refreshToken',
                  'creditCard',
                  'apiKey',
                ].flatMap((field) => [`req.body.${field}`, `req.body.*.${field}`]),
              ],
              censor: '[REDACTED]',
            },
          },
        }),
        ThrottlerModule.forRootAsync({
          imports: [RedisModule],
          inject: [ConfigService, RedisService],
          useFactory: (config: ConfigService<AppConfig, true>, redis: RedisService) => ({
            throttlers: [
              {
                ttl: config.get('throttleTtlMs', { infer: true }),
                limit: config.get('throttleLimit', { infer: true }),
              },
            ],
            // Redis storage in production so the limit holds across replicas;
            // in-memory elsewhere (tests/dev must not require a live Redis).
            // Reuses the RedisService connection — closed on shutdown, no
            // second unmanaged client.
            ...(appConfig.nodeEnv === 'production'
              ? { storage: new ThrottlerStorageRedisService(redis.getClient()) }
              : {}),
          }),
        }),
        HttpClientModule,
        PrismaModule,
        RedisModule,
        RabbitMqModule,
        ...featureModules,
      ],
      controllers: [HealthController],
      providers: [
        // Order matters: global guards run in registration order. Throttler
        // MUST come first so failed auth attempts are also rate limited
        // (otherwise credential brute force bypasses throttling entirely).
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_FILTER, useClass: AllExceptionsFilter },
      ],
    };
  }
}
