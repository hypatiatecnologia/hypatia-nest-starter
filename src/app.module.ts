import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import configuration, { validateConfig } from './config/configuration';
import { CORRELATION_ID_HEADER } from './common/correlation/correlation.constants';
import { HttpClientModule } from './http/http-client.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { RabbitMqModule } from './rabbitmq/rabbitmq.module';
import { ExampleModule } from './modules/example/example.module';
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
 *   └── modules/         Feature modules (controller + service + dto/)
 *
 * Replace ExampleModule with your feature modules after scaffolding.
 * Remove ExampleModule entirely once you no longer need the sample flow.
 */
@Module({
  imports: [
    // Loads typed env vars globally — inject ConfigService<AppConfig> anywhere.
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate: validateConfig }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        // Reads x-correlation-id set by correlationMiddleware in main.ts.
        genReqId: (req) => {
          const header = req.headers[CORRELATION_ID_HEADER];
          const value = Array.isArray(header) ? header[0] : header;
          return value ?? randomUUID();
        },
        customProps: (req) => ({ correlationId: req.id }),
        // Never log bearer tokens or other credentials.
        redact: ['req.headers.authorization'],
      },
    }),
    // Global rate limit: 100 requests per 60s per IP (tune for your service).
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    HttpClientModule,
    PrismaModule,
    RedisModule,
    RabbitMqModule,
    ExampleModule, // DELETE: sample module — see modules/example/ for api vs worker patterns
  ],
  controllers: [HealthController],
  providers: [
    // Applies ThrottlerGuard to every route automatically.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
