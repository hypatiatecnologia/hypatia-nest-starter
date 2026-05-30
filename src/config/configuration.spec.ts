import configuration, { validateConfig } from './configuration';

const validEnv: Record<string, string> = {
  DATABASE_URL: 'postgresql://hypatia:hypatia@localhost:5432/hypatia',
  REDIS_URL: 'redis://localhost:6379',
  SERVICE_NAME: 'test-service',
  PORT: '3000',
  NODE_ENV: 'test',
  RABBITMQ_URL: 'amqp://guest:guest@localhost:5672',
  RABBITMQ_MODE: 'off',
  RABBITMQ_EXCHANGE: 'hypatia.events',
  RABBITMQ_DLX_EXCHANGE: 'hypatia.events.dlx',
  RABBITMQ_QUEUE: 'test-service.events',
};

describe('validateConfig', () => {
  it('accepts a valid environment and maps to AppConfig', () => {
    const config = validateConfig(validEnv);
    expect(config).toMatchObject({
      port: 3000,
      nodeEnv: 'test',
      serviceName: 'test-service',
      databaseUrl: 'postgresql://hypatia:hypatia@localhost:5432/hypatia',
      redisUrl: 'redis://localhost:6379',
      rabbitmqMode: 'off',
    });
  });

  it('throws when DATABASE_URL is missing', () => {
    expect(() => validateConfig({ ...validEnv, DATABASE_URL: '' })).toThrow('DATABASE_URL');
  });

  it('throws when REDIS_URL is missing', () => {
    expect(() => validateConfig({ ...validEnv, REDIS_URL: '' })).toThrow('REDIS_URL');
  });

  it('throws when SERVICE_NAME is missing', () => {
    expect(() => validateConfig({ ...validEnv, SERVICE_NAME: '' })).toThrow('SERVICE_NAME');
  });

  it('throws when PORT is out of range', () => {
    expect(() => validateConfig({ ...validEnv, PORT: '0' })).toThrow();
  });

  it('throws when PORT exceeds maximum', () => {
    expect(() => validateConfig({ ...validEnv, PORT: '99999' })).toThrow();
  });

  it('requires RABBITMQ_URL when messaging is enabled', () => {
    expect(() =>
      validateConfig({ ...validEnv, RABBITMQ_MODE: 'publisher', RABBITMQ_URL: '' }),
    ).toThrow('RABBITMQ_URL is required when RABBITMQ_MODE is publisher or consumer');
  });

  it('coerces PORT string to number', () => {
    const config = validateConfig({ ...validEnv, PORT: '8080' });
    expect(config.port).toBe(8080);
  });

  it('defaults RABBITMQ_MODE to "off" when not provided', () => {
    const envWithoutMode = Object.fromEntries(
      Object.entries(validEnv).filter(([key]) => key !== 'RABBITMQ_MODE'),
    );
    const config = validateConfig(envWithoutMode);
    expect(config.rabbitmqMode).toBe('off');
  });
});

describe('loadConfiguration', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = {
      ...env,
      DATABASE_URL: 'postgresql://hypatia:hypatia@localhost:5432/hypatia',
      SERVICE_NAME: 'test-service',
    };
  });

  afterEach(() => {
    process.env = env;
  });

  it('loads DATABASE_URL from environment', () => {
    expect(configuration().databaseUrl).toBe('postgresql://hypatia:hypatia@localhost:5432/hypatia');
  });
});
