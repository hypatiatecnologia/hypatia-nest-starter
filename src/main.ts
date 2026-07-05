import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
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
  // bufferLogs holds early log lines in memory until useLogger() below swaps in
  // pino — so even the very first startup logs come out as structured JSON.
  const app = await NestFactory.create(await AppModule.register(), { bufferLogs: true });

  // Graceful shutdown on SIGTERM/SIGINT (Docker, k8s rolling deploys).
  app.enableShutdownHooks();

  // Correlation middleware, helmet, and validation — shared with e2e tests.
  configureApp(app);

  // Structured JSON logs via pino; sensitive fields are redacted in AppModule.
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService<AppConfig, true>);
  const serviceName = config.get('serviceName', { infer: true });
  const nodeEnv = config.get('nodeEnv', { infer: true });

  // Behind Cerberus/reverse proxy: trust X-Forwarded-* so req.ip (throttling,
  // logs) reflects the real client. See TRUST_PROXY in configuration.ts.
  const trustProxy = config.get('trustProxy', { infer: true });
  if (trustProxy !== undefined) {
    app.getHttpAdapter().getInstance().set('trust proxy', trustProxy);
  }

  // Swagger only outside production: the docs endpoint exposes the full API
  // surface (routes, DTOs, auth schemes) — useful for devs, a gift to attackers.
  if (nodeEnv !== 'production') {
    const swagger = new DocumentBuilder()
      .setTitle(`${serviceName} API`)
      .setDescription('Hypatia NestJS microservice')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swagger);
    SwaggerModule.setup('docs/api', app, document);
  }

  const port = config.get('port', { infer: true });
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

bootstrap().catch((error: unknown) => {
  // DI (and the pino logger) may not exist when bootstrap fails — plain stderr.
  console.error('Fatal error during bootstrap:', error);
  process.exit(1);
});
