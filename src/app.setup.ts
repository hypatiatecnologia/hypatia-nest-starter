import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { correlationMiddleware } from './common/correlation/correlation.middleware';

/**
 * HTTP pipeline shared by main.ts and e2e tests.
 *
 * Keeping it in one place prevents test apps from drifting from production
 * wiring (middleware order, validation flags, security headers).
 */
export function configureApp<T extends INestApplication>(app: T): T {
  // Correlation id before everything so access logs share the request id.
  app.use(correlationMiddleware);

  // Security headers (CSP, HSTS, X-Powered-By removal, etc.).
  app.use(helmet());

  // Global validation: strips unknown fields, coerces types, rejects extra properties.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  return app;
}
