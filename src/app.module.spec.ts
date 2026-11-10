import { IncomingMessage, ServerResponse } from 'http';
import { EventEmitter } from 'events';
import { LoggerModule } from 'nestjs-pino';
import pinoHttp, { Options } from 'pino-http';
import { AppModule } from './app.module';
import { HttpClientError } from './http/http-client.error';

describe('AppModule HTTP logging', () => {
  it('keeps correlation and status while excluding query strings, cookies, and arbitrary headers', async () => {
    const spy = jest.spyOn(LoggerModule, 'forRoot');
    let options: Options;
    try {
      await AppModule.register();
      options = spy.mock.calls[0][0]?.pinoHttp as Options;
    } finally {
      spy.mockRestore();
    }

    const lines: string[] = [];
    const middleware = pinoHttp(
      { ...options, transport: undefined },
      {
        write: (line: string) => {
          lines.push(line);
        },
      },
    );
    const req = Object.assign(new EventEmitter(), {
      method: 'GET',
      url: '/health?token=private-query',
      headers: {
        'x-correlation-id': 'logging-trace',
        cookie: 'session=private-cookie',
        'x-custom': 'private-header',
      },
      query: { token: 'private-query' },
      socket: {},
    }) as unknown as IncomingMessage;
    const res = Object.assign(new EventEmitter(), {
      statusCode: 200,
      headersSent: true,
      getHeaders: () => ({ 'set-cookie': 'session=private-response-cookie' }),
    }) as ServerResponse;
    middleware(req, res);
    res.emit('finish');

    expect(lines).toHaveLength(1);
    const entry = JSON.parse(lines[0]) as Record<string, unknown>;
    expect(entry).toMatchObject({
      correlationId: 'logging-trace',
      req: { id: 'logging-trace', method: 'GET', url: '/health' },
      res: { statusCode: 200 },
    });
    expect(lines[0]).not.toContain('private-');

    const cause = new SyntaxError('Invalid JSON near private-upstream-body');
    const error = new HttpClientError(
      200,
      'GET',
      'https://api.example.com/data',
      'response body is not valid JSON',
      cause,
    );
    middleware.logger.error({ err: error }, 'upstream failed');
    expect(error.cause).toBe(cause);
    expect(lines[1]).not.toContain('private-upstream-body');
    expect(JSON.parse(lines[1]).err).toMatchObject({
      type: 'HttpClientError',
      statusCode: 200,
      message: error.message,
    });
  });
});
