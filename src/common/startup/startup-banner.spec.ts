import { buildStartupBanner, formatStartupLogMessage, printStartupBanner } from './startup-banner';

describe('startup-banner', () => {
  const input = {
    serviceName: 'hypatia-service',
    baseUrl: 'http://localhost:3000',
    rabbitmqMode: 'publisher' as const,
    nodeEnv: 'development',
  };

  it('buildStartupBanner includes service endpoints and mode', () => {
    const banner = buildStartupBanner(input);

    expect(banner).toContain('HYPATIA — hypatia-service');
    expect(banner).toContain('http://localhost:3000/docs/api');
    expect(banner).toContain('RabbitMQ publisher');
    expect(banner).toMatch(/^╔═+/);
    expect(banner).toMatch(/╝$/);
  });

  it('formatStartupLogMessage summarizes runtime URLs', () => {
    expect(formatStartupLogMessage(input)).toBe(
      'hypatia-service running at http://localhost:3000 — Swagger: http://localhost:3000/docs/api — Health: http://localhost:3000/health — RabbitMQ: publisher',
    );
  });

  it('printStartupBanner skips production', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    printStartupBanner({ ...input, nodeEnv: 'production' });

    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('printStartupBanner renders banner in development', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    printStartupBanner(input);

    expect(logSpy).toHaveBeenCalledWith(`\n${buildStartupBanner(input)}\n`);
    logSpy.mockRestore();
  });
});
