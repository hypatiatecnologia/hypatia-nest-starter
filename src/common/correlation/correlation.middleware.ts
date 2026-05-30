import { NextFunction, Request, Response } from 'express';
import { CORRELATION_ID_HEADER } from './correlation.constants';
import { CorrelationContext, resolveCorrelationId } from './correlation.context';

/**
 * Express middleware — register in main.ts before nestjs-pino so logs
 * and handlers share the same correlation id for the request lifecycle.
 */
export function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId = resolveCorrelationId(req.headers[CORRELATION_ID_HEADER]);

  req.headers[CORRELATION_ID_HEADER] = correlationId;
  req.correlationId = correlationId;
  res.setHeader(CORRELATION_ID_HEADER, correlationId);

  CorrelationContext.run(correlationId, () => next());
}
