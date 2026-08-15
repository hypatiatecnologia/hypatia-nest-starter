import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DomainException } from '../errors/domain.exception';
import { AllExceptionsFilter } from './all-exceptions.filter';

function createMockLogger() {
  return {
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  } as unknown as PinoLogger;
}

describe('AllExceptionsFilter', () => {
  function createFilter() {
    return new AllExceptionsFilter(createMockLogger());
  }

  function createHost(correlationId?: string) {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });

    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ method: 'GET', url: '/example', correlationId }),
      }),
    } as unknown as ArgumentsHost;

    return { host, status, json };
  }

  it('maps HttpException to its status code', () => {
    const { host, status, json } = createHost();

    createFilter().catch(new BadRequestException('invalid input'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'invalid_input',
        message: 'invalid input',
        path: '/example',
      }),
    );
  });

  it('includes stable code from DomainException', () => {
    const { host, json } = createHost();

    createFilter().catch(
      new DomainException('order_not_found', 'Order missing', HttpStatus.NOT_FOUND),
      host,
    );

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'order_not_found',
        message: 'Order missing',
        statusCode: HttpStatus.NOT_FOUND,
      }),
    );
  });

  it('includes correlationId in error responses when present', () => {
    const { host, json } = createHost('corr-abc');

    createFilter().catch(new BadRequestException('invalid input'), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: 'corr-abc',
      }),
    );
  });

  it('strips query string from path so tokens are not echoed to clients', () => {
    const { status, json } = createHost();
    const hostWithQuery = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({
          method: 'GET',
          url: '/example?token=secret-value&foo=1',
          correlationId: undefined,
        }),
      }),
    } as unknown as ArgumentsHost;

    createFilter().catch(new BadRequestException('invalid input'), hostWithQuery);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/example',
      }),
    );
    expect(json).not.toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringContaining('token='),
      }),
    );
  });

  it('includes details on 4xx DomainException', () => {
    const { host, json } = createHost();

    createFilter().catch(
      new DomainException('conflict', 'SKU already exists', HttpStatus.CONFLICT, { sku: 'ABC' }),
      host,
    );

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'conflict',
        message: 'SKU already exists',
        details: { sku: 'ABC' },
      }),
    );
  });

  it('does not leak HttpException 5xx messages to the client', () => {
    const { host, status, json } = createHost();

    createFilter().catch(
      new InternalServerErrorException('relation "orders" does not exist'),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'internal_error',
        message: 'Internal server error',
      }),
    );
    expect(json.mock.calls[0][0].message).not.toContain('orders');
    expect(json.mock.calls[0][0].details).toBeUndefined();
  });

  it('strips DomainException 5xx details from the client body', () => {
    const { host, json } = createHost();

    createFilter().catch(
      new DomainException('internal_error', 'SQL exploded', HttpStatus.INTERNAL_SERVER_ERROR, {
        sql: 'SELECT 1',
      }),
      host,
    );

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'internal_error',
        message: 'Internal server error',
      }),
    );
    expect(json.mock.calls[0][0].details).toBeUndefined();
  });

  it('maps unknown errors to 500 with internal_error code', () => {
    const { host, status, json } = createHost();

    createFilter().catch(new Error('unexpected'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'internal_error',
        message: 'Internal server error',
      }),
    );
  });

  it('logs 5xx errors via PinoLogger with structured context', () => {
    const mockLogger = createMockLogger();
    const filter = new AllExceptionsFilter(mockLogger);
    const { host } = createHost('trace-xyz');

    filter.catch(new Error('db connection lost'), host);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: 'trace-xyz', url: '/example' }),
      expect.stringContaining('internal error'),
    );
  });

  it('redacts query string from 5xx log context', () => {
    const mockLogger = createMockLogger();
    const filter = new AllExceptionsFilter(mockLogger);
    const status = jest.fn().mockReturnValue({ json: jest.fn() });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({
          method: 'GET',
          url: '/orders?accessToken=leak-me',
          correlationId: 'trace-xyz',
        }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new Error('boom'), host);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/orders' }),
      expect.stringContaining('GET /orders — internal error'),
    );
    expect(mockLogger.error).not.toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining('accessToken') }),
      expect.anything(),
    );
  });
});
