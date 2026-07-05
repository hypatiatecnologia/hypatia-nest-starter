import { HttpClientService } from './http-client.service';
import { HttpClientError } from './http-client.error';
import { CORRELATION_ID_HEADER } from '../common/correlation/correlation.constants';
import { CorrelationContext } from '../common/correlation/correlation.context';

describe('HttpClientService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('propagates x-correlation-id from CorrelationContext', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    global.fetch = fetchMock;

    const service = new HttpClientService();

    await CorrelationContext.runAsync('trace-123', async () => {
      await service.get('https://api.example.com/resource');
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/resource',
      expect.objectContaining({
        headers: expect.objectContaining({
          [CORRELATION_ID_HEADER]: 'trace-123',
        }),
      }),
    );
  });

  it('sends JSON body on POST', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: '1' }),
    });
    global.fetch = fetchMock;

    const service = new HttpClientService();
    await service.post('https://api.example.com/items', { body: { name: 'test' } });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/items',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
      }),
    );
  });

  it('throws HttpClientError with statusCode on non-ok response (non-retryable)', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 400 });

    const service = new HttpClientService();
    await expect(service.get('https://api.example.com/fail')).rejects.toThrow(HttpClientError);
    await expect(service.get('https://api.example.com/fail')).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(global.fetch).toHaveBeenCalledTimes(2); // no retries on 400
  });

  it('omits query parameters from HttpClientError messages', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 400 });

    const service = new HttpClientService();

    await expect(service.get('https://api.example.com/fail?token=secret-value')).rejects.toThrow(
      'HTTP 400 for GET https://api.example.com/fail',
    );
  });

  it('wraps a non-JSON success body in HttpClientError (no raw SyntaxError)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token < in JSON');
      },
    });

    const service = new HttpClientService();

    await expect(service.get('https://api.example.com/html')).rejects.toMatchObject({
      name: 'HttpClientError',
      statusCode: 200,
    });
    expect(global.fetch).toHaveBeenCalledTimes(1); // 200 is not retryable
  });

  describe('retry behavior', () => {
    beforeEach(() => jest.useFakeTimers());

    it('retries on 502 up to MAX_ATTEMPTS and then throws', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 502 });
      const service = new HttpClientService();

      const promise = service.get('https://api.example.com/fail');
      // Attach rejection handler immediately to prevent unhandled rejection before timers fire.
      promise.catch(() => undefined);
      await jest.runAllTimersAsync();

      await expect(promise).rejects.toBeInstanceOf(HttpClientError);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('retries on 429 (rate limited) and eventually throws', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 429 });
      const service = new HttpClientService();

      const promise = service.get('https://api.example.com/rate-limited');
      promise.catch(() => undefined);
      await jest.runAllTimersAsync();

      await expect(promise).rejects.toMatchObject({ statusCode: 429 });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('succeeds on retry after transient 503', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 503 })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ recovered: true }) });
      global.fetch = fetchMock;

      const service = new HttpClientService();
      const promise = service.get<{ recovered: boolean }>('https://api.example.com/flaky');
      await jest.runAllTimersAsync();

      await expect(promise).resolves.toEqual({ recovered: true });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('retries network failures (TypeError) on idempotent methods', async () => {
      global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed'));
      const service = new HttpClientService();

      const promise = service.get('https://api.example.com/unreachable');
      promise.catch(() => undefined);
      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow('fetch failed');
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('retries timeouts (AbortError) on idempotent methods', async () => {
      const abortError = Object.assign(new Error('This operation was aborted'), {
        name: 'AbortError',
      });
      global.fetch = jest.fn().mockRejectedValue(abortError);
      const service = new HttpClientService();

      const promise = service.get('https://api.example.com/slow');
      promise.catch(() => undefined);
      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow('aborted');
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('does NOT retry network failures on POST by default', async () => {
      global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed'));
      const service = new HttpClientService();

      const promise = service.post('https://api.example.com/orders', { body: { id: 1 } });
      promise.catch(() => undefined);
      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow('fetch failed');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('does NOT retry POST by default (non-idempotent — effect may have applied)', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 502 });
      const service = new HttpClientService();

      const promise = service.post('https://api.example.com/orders', { body: { id: 1 } });
      promise.catch(() => undefined);
      await jest.runAllTimersAsync();

      await expect(promise).rejects.toBeInstanceOf(HttpClientError);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('retries POST when explicitly opted in via retry: true', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 502 });
      const service = new HttpClientService();

      const promise = service.post('https://api.example.com/orders', {
        body: { id: 1 },
        retry: true,
      });
      promise.catch(() => undefined);
      await jest.runAllTimersAsync();

      await expect(promise).rejects.toBeInstanceOf(HttpClientError);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });
});
