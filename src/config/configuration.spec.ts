import configuration, { validateConfig } from './configuration';

const validEnv: Record<string, string> = {
  DATABASE_URL: 'postgresql://hypatia:hypatia@localhost:5432/hypatia',
  REDIS_URL: 'redis://localhost:6379',
  SERVICE_NAME: 'test-service',
  PORT: '3000',
  NODE_ENV: 'test',
  RABBITMQ_URL: 'amqp://hypatia:hypatia-rabbitmq-dev@localhost:5672',
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

  it('requires auth secrets in production', () => {
    expect(() =>
      validateConfig({
        ...validEnv,
        NODE_ENV: 'production',
        ARGUS_JWT_SECRET: '',
        INTERNAL_API_KEY: '',
      }),
    ).toThrow('ARGUS_JWT_SECRET or INTERNAL_API_KEY is required in production');
  });

  it('rejects unknown NODE_ENV values', () => {
    expect(() => validateConfig({ ...validEnv, NODE_ENV: 'Production' })).toThrow('NODE_ENV');
    expect(() => validateConfig({ ...validEnv, NODE_ENV: 'prod' })).toThrow('NODE_ENV');
  });

  it('rejects documented example secrets in production', () => {
    expect(() =>
      validateConfig({
        ...validEnv,
        NODE_ENV: 'production',
        INTERNAL_API_KEY: 'change-me-local-dev',
      }),
    ).toThrow('INTERNAL_API_KEY must not use a documented example placeholder in production');
  });

  it('accepts production when a non-placeholder secret is set', () => {
    const config = validateConfig({
      ...validEnv,
      NODE_ENV: 'production',
      INTERNAL_API_KEY: 'prod-internal-api-key',
    });
    expect(config.nodeEnv).toBe('production');
    expect(config.internalApiKey).toBe('prod-internal-api-key');
  });

  it('rejects the localhost dev RabbitMQ default in production with messaging enabled', () => {
    expect(() =>
      validateConfig({
        ...validEnv,
        NODE_ENV: 'production',
        RABBITMQ_MODE: 'publisher',
        RABBITMQ_URL: 'amqp://hypatia:hypatia-rabbitmq-dev@localhost:5672',
        INTERNAL_API_KEY: 'prod-internal-api-key',
      }),
    ).toThrow('RABBITMQ_URL must be set explicitly in production');
  });

  it('rejects an unset RABBITMQ_URL in production with messaging enabled', () => {
    const env: Record<string, string> = {
      ...validEnv,
      NODE_ENV: 'production',
      RABBITMQ_MODE: 'publisher',
      INTERNAL_API_KEY: 'prod-internal-api-key',
    };
    delete env.RABBITMQ_URL;

    expect(() => validateConfig(env)).toThrow('RABBITMQ_URL must be set explicitly in production');
  });

  it('accepts the dev RabbitMQ default in production when messaging is off', () => {
    const config = validateConfig({
      ...validEnv,
      NODE_ENV: 'production',
      INTERNAL_API_KEY: 'prod-internal-api-key',
    });
    expect(config.rabbitmqMode).toBe('off');
    expect(config.rabbitmqUrl).toBe('amqp://hypatia:hypatia-rabbitmq-dev@localhost:5672');
  });

  it('rejects a short ARGUS_JWT_SECRET in production', () => {
    expect(() =>
      validateConfig({
        ...validEnv,
        NODE_ENV: 'production',
        ARGUS_JWT_SECRET: 'too-short-secret',
        INTERNAL_API_KEY: '',
      }),
    ).toThrow('ARGUS_JWT_SECRET must be at least 32 characters in production');
  });

  it('accepts a 32-character ARGUS_JWT_SECRET in production', () => {
    const config = validateConfig({
      ...validEnv,
      NODE_ENV: 'production',
      ARGUS_JWT_SECRET: 'a'.repeat(32),
      INTERNAL_API_KEY: '',
    });
    expect(config.argusJwtSecret).toBe('a'.repeat(32));
  });

  it('maps optional auth secrets when provided', () => {
    const config = validateConfig({
      ...validEnv,
      ARGUS_JWT_SECRET: 'jwt-secret',
      INTERNAL_API_KEY: 'api-key',
    });
    expect(config.argusJwtSecret).toBe('jwt-secret');
    expect(config.internalApiKey).toBe('api-key');
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
