import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Request, Response } from 'express';
import { resolveErrorCode } from '../errors/domain.exception';
import { CorrelationContext } from '../correlation/correlation.context';

/**
 * Normalizes error responses across the API.
 *
 * HttpException → status, message, and stable `code` (snake_case).
 * Everything else → 500 with code `internal_error` (details logged server-side).
 *
 * Every error, on every route, has this shape:
 *   {
 *     "statusCode": 404, "code": "not_found", "message": "Order not found",
 *     "correlationId": "…", "path": "/orders/42", "timestamp": "…"
 *   }
 * Clients branch on `code`; `correlationId` links the response to server logs
 * (ask the caller for it when debugging). Unknown/unexpected errors stay
 * generic on purpose — internals (stack, query, driver messages) never leak
 * to the client, only to the log line emitted below.
 *
 * Registered via APP_FILTER in AppModule to allow DI (PinoLogger injection).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(AllExceptionsFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = this.resolveBody(exception);
    const code = resolveErrorCode(exception);
    const correlationId = request.correlationId ?? CorrelationContext.get();

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        {
          err: exception instanceof Error ? exception : new Error(String(exception)),
          method: request.method,
          url: request.url,
          correlationId,
        },
        `${request.method} ${request.url} — internal error`,
      );
    }

    response.status(status).json({
      statusCode: status,
      code,
      ...body,
      ...(correlationId ? { correlationId } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private resolveBody(exception: unknown): {
    message: string | string[];
    error?: string;
    details?: Record<string, unknown>;
  } {
    if (!(exception instanceof HttpException)) {
      return { message: 'Internal server error', error: 'Internal Server Error' };
    }

    const res = exception.getResponse();
    if (typeof res === 'string') {
      return { message: res };
    }

    if (typeof res === 'object' && res !== null) {
      const payload = res as Record<string, unknown>;
      return {
        message: (payload['message'] as string | string[]) ?? exception.message,
        ...(payload['error'] ? { error: String(payload['error']) } : {}),
        ...(payload['details'] && typeof payload['details'] === 'object'
          ? { details: payload['details'] as Record<string, unknown> }
          : {}),
      };
    }

    return { message: exception.message };
  }
}
