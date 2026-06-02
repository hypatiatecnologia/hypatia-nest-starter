import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { correlationMiddleware } from './common/correlation/correlation.middleware';
import { formatStartupLogMessage, printStartupBanner } from './common/startup/startup-banner';
import { AppConfig } from './config/configuration';

/**
 * Application entry point.
 *
 * Onboarding checklist:
 * 1. Copy `.env.example` (or an archetype from `archetypes/`) to `.env`
 * 2. Start infra: `docker compose up -d postgres redis rabbitmq`
 * 3. Run migrations: `npx prisma migrate deploy`
 * 4. Start dev server: `npm run start:dev`
 *
 * Swagger UI: http://localhost:3000/docs/api
 * Health probe: http://localhost:3000/health
 */
async function bootstrap() {
  const app = await NestFactory.create(await AppModule.register(), { bufferLogs: true });

  // Graceful shutdown on SIGTERM/SIGINT (Docker, k8s rolling deploys).
  app.enableShutdownHooks();

  // Correlation id before pino so access logs include the same id as handlers.
  app.use(correlationMiddleware);

  // Structured JSON logs via pino; sensitive fields are redacted in AppModule.
  app.useLogger(app.get(Logger));

  // Security headers (CSP, HSTS, etc.).
  app.use(helmet());

  // Global validation: strips unknown fields, coerces types, rejects extra properties.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  const config = app.get(ConfigService<AppConfig, true>);
  const serviceName = config.get('serviceName', { infer: true });

  const swagger = new DocumentBuilder()
    .setTitle(`${serviceName} API`)
    .setDescription('Hypatia NestJS microservice')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('docs/api', app, document);

  const port = config.get('port', { infer: true });
  const nodeEnv = config.get('nodeEnv', { infer: true });
  const rabbitmqMode = config.get('rabbitmqMode', { infer: true });
  const logger = app.get(Logger);
  await app.listen(port, '0.0.0.0');

  const baseUrl = `http://localhost:${port}`;
  const startupInfo = { serviceName, baseUrl, rabbitmqMode, nodeEnv };

  printStartupBanner(startupInfo);
  if (nodeEnv === 'production') {
    logger.log(formatStartupLogMessage(startupInfo));
  }
}

bootstrap();
