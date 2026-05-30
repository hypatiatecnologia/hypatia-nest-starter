import { EventEmitter } from 'events';
import { Request, Response } from 'express';
import { CORRELATION_ID_HEADER } from './correlation.constants';
import { CorrelationContext } from './correlation.context';
import { correlationMiddleware } from './correlation.middleware';

function createMockResponse(): Response {
  const res = new EventEmitter() as Response;
  res.setHeader = jest.fn();
  return res;
}

describe('correlationMiddleware', () => {
  it('propagates incoming header, echoes it on response, and sets ALS', () => {
    const req = {
      headers: { [CORRELATION_ID_HEADER]: 'incoming-id' },
    } as unknown as Request;
    const res = createMockResponse();
    const next = jest.fn(() => {
      expect(CorrelationContext.get()).toBe('incoming-id');
      expect(req.correlationId).toBe('incoming-id');
    });

    correlationMiddleware(req, res, next);

    expect(req.headers[CORRELATION_ID_HEADER]).toBe('incoming-id');
    expect(res.setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, 'incoming-id');
    expect(next).toHaveBeenCalled();
  });

  it('generates a correlation id when header is absent', () => {
    const req = { headers: {} } as Request;
    const res = createMockResponse();
    const next = jest.fn();

    correlationMiddleware(req, res, next);

    expect(req.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(res.setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, req.correlationId);
    expect(next).toHaveBeenCalled();
  });
});
