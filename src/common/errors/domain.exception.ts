import { HttpException, HttpStatus } from '@nestjs/common';

/** Maps stable domain error codes to HTTP status at the API boundary. */
export const DOMAIN_ERROR_STATUS: Record<string, number> = {
  validation_error: HttpStatus.BAD_REQUEST,
  invalid_input: HttpStatus.BAD_REQUEST,
  unauthorized: HttpStatus.UNAUTHORIZED,
  forbidden: HttpStatus.FORBIDDEN,
  not_found: HttpStatus.NOT_FOUND,
  conflict: HttpStatus.CONFLICT,
  internal_error: HttpStatus.INTERNAL_SERVER_ERROR,
};

export class DomainException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: number = DOMAIN_ERROR_STATUS[code] ?? HttpStatus.BAD_REQUEST,
    public readonly details?: Record<string, unknown>,
  ) {
    super({ code, message, ...(details ? { details } : {}) }, status);
  }
}

/** Resolves a stable snake_case code from any thrown value. */
export function resolveErrorCode(exception: unknown): string {
  if (exception instanceof DomainException) {
    return exception.code;
  }

  if (exception instanceof HttpException) {
    const response = exception.getResponse();
    if (typeof response === 'object' && response !== null) {
      const payload = response as Record<string, unknown>;
      if (typeof payload.code === 'string' && payload.code.trim()) {
        return payload.code;
      }
    }

    const status = exception.getStatus();
    return HTTP_STATUS_CODES[status] ?? 'http_error';
  }

  return 'internal_error';
}

const HTTP_STATUS_CODES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'invalid_input',
  [HttpStatus.UNAUTHORIZED]: 'unauthorized',
  [HttpStatus.FORBIDDEN]: 'forbidden',
  [HttpStatus.NOT_FOUND]: 'not_found',
  [HttpStatus.CONFLICT]: 'conflict',
  [HttpStatus.TOO_MANY_REQUESTS]: 'rate_limit_exceeded',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'internal_error',
};
