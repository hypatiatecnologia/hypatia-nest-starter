import configuration, { AppConfig, validateAppConfig } from './configuration';

const validConfig: AppConfig = {
  port: 3000,
  nodeEnv: 'test',
  serviceName: 'test-service',
  databaseUrl: 'postgresql://hypatia:hypatia@localhost:5432/hypatia',
  redisUrl: 'redis://localhost:6379',
  rabbitmqUrl: 'amqp://guest:guest@localhost:5672',
  rabbitmqMode: 'off',
  rabbitmqExchange: 'hypatia.events',
  rabbitmqDlxExchange: 'hypatia.events.dlx',
  rabbitmqQueue: 'test-service.events',
};

describe('validateAppConfig', () => {
  it('accepts a valid configuration', () => {
    expect(validateAppConfig(validConfig)).toEqual(validConfig);
  });

  it('throws when DATABASE_URL is missing', () => {
    expect(() => validateAppConfig({ ...validConfig, databaseUrl: '' })).toThrow(
      'DATABASE_URL is required',
    );
  });

  it('throws when REDIS_URL is missing', () => {
    expect(() => validateAppConfig({ ...validConfig, redisUrl: '  ' })).toThrow('REDIS_URL is required');
  });

  it('throws when PORT is invalid', () => {
    expect(() => validateAppConfig({ ...validConfig, port: 0 })).toThrow(
      'PORT must be an integer between 1 and 65535',
    );
  });

  it('requires RabbitMQ settings when messaging is enabled', () => {
    expect(() =>
      validateAppConfig({
        ...validConfig,
        rabbitmqMode: 'publisher',
        rabbitmqUrl: '',
      }),
    ).toThrow('RABBITMQ_URL is required when RABBITMQ_MODE is publisher or consumer');
  });
});

describe('configuration loader', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env, DATABASE_URL: 'postgresql://hypatia:hypatia@localhost:5432/hypatia' };
  });

  afterEach(() => {
    process.env = env;
  });

  it('loads DATABASE_URL from environment', () => {
    expect(configuration().databaseUrl).toBe('postgresql://hypatia:hypatia@localhost:5432/hypatia');
  });
});
