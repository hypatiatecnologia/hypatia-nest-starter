process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://hypatia:hypatia@localhost:5432/hypatia';
process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
process.env.RABBITMQ_MODE = process.env.RABBITMQ_MODE ?? 'off';
process.env.SERVICE_NAME = process.env.SERVICE_NAME ?? 'hypatia-test';
process.env.PORT = process.env.PORT ?? '3000';
process.env.INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? 'test-internal-api-key';
