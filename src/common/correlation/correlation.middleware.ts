import { NextFunction, Request, Response } from 'express';
import { CORRELATION_ID_HEADER } from './correlation.constants';
import { CorrelationContext, resolveCorrelationId } from './correlation.context';

/**
 * Express middleware — register in main.ts before nestjs-pino so logs
 * and handlers share the same correlation id for the request lifecycle.
 *
 * Per request:
 *   1. Reuse the caller's x-correlation-id when valid; otherwise generate a UUID
 *   2. Write it back onto req (pino and handlers read it) and onto the response
 *      header, so callers can quote the id when reporting an issue
 *   3. Run the rest of the pipeline inside CorrelationContext, making the id
 *      readable anywhere downstream without passing it around
 */
export function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId = resolveCorrelationId(req.headers[CORRELATION_ID_HEADER]);

  req.headers[CORRELATION_ID_HEADER] = correlationId;
  req.correlationId = correlationId;
  res.setHeader(CORRELATION_ID_HEADER, correlationId);

  CorrelationContext.run(correlationId, () => next());
}
