import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { config as loadDotenv } from 'dotenv';
import loadConfiguration, { validateConfig } from './config/configuration';
import { CORRELATION_ID_HEADER } from './common/correlation/correlation.constants';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { discoverFeatureModules } from './common/module-discovery/module-discovery';
import { HttpClientModule } from './http/http-client.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
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
 */
@Module({})
export class AppModule {
  static async register(): Promise<DynamicModule> {
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
              process.env.NODE_ENV !== 'production'
                ? { target: 'pino-pretty', options: { singleLine: true } }
                : undefined,
            genReqId: (req) => {
              const header = req.headers[CORRELATION_ID_HEADER];
              const value = Array.isArray(header) ? header[0] : header;
              return value ?? randomUUID();
            },
            customProps: (req) => ({ correlationId: req.id }),
            redact: {
              paths: [
                'req.headers.authorization',
                'req.body.password',
                'req.body.cpf',
                'req.body.token',
                'req.body.accessToken',
                'req.body.refreshToken',
                'req.body.creditCard',
                'req.body.apiKey',
              ],
              censor: '[REDACTED]',
            },
          },
        }),
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
        HttpClientModule,
        PrismaModule,
        RedisModule,
        RabbitMqModule,
        ...featureModules,
      ],
      controllers: [HealthController],
      providers: [
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_FILTER, useClass: AllExceptionsFilter },
      ],
    };
  }
}
