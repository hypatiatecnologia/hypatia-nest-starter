import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CorrelationContext } from '../correlation/correlation.context';

/**
 * Normalizes error responses across the API.
 *
 * HttpException → status and message from the exception.
 * Everything else → 500 with a generic message (details logged server-side).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = this.resolveBody(exception);
    const correlationId = request.correlationId ?? CorrelationContext.get();

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const detail = exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(
        `${request.method} ${request.url}${correlationId ? ` [${correlationId}]` : ''} — ${detail}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      ...body,
      ...(correlationId ? { correlationId } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private resolveBody(exception: unknown): { message: string | string[]; error?: string } {
    if (!(exception instanceof HttpException)) {
      return { message: 'Internal server error', error: 'Internal Server Error' };
    }

    const response = exception.getResponse();
    if (typeof response === 'string') {
      return { message: response };
    }

    if (typeof response === 'object' && response !== null) {
      const payload = response as Record<string, unknown>;
      return {
        message: (payload.message as string | string[]) ?? exception.message,
        ...(payload.error ? { error: String(payload.error) } : {}),
      };
    }

    return { message: exception.message };
  }
}
