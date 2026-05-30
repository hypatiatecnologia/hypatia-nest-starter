import { HttpClientService } from './http-client.service';
import { CORRELATION_ID_HEADER } from '../common/correlation/correlation.constants';
import { CorrelationContext } from '../common/correlation/correlation.context';

describe('HttpClientService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
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

  it('throws when response is not ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 502 });

    const service = new HttpClientService();
    await expect(service.get('https://api.example.com/fail')).rejects.toThrow('HTTP 502');
  });
});
