/**
 * Typed application configuration loaded once at startup via ConfigModule.
 *
 * All env access should go through this file — avoid scattered `process.env` calls.
 * Archetype presets live in `archetypes/api.env.example` and `archetypes/worker.env.example`.
 *
 * RABBITMQ_MODE:
 *   off       — no RabbitMQ connection (e.g. early Hades / services without messaging)
 *   publisher — connect and publish events (Athena, Midas, Nemesis)
 *   consumer  — connect and consume from RABBITMQ_QUEUE (Hermes)
 */
export type RabbitMqMode = 'off' | 'publisher' | 'consumer';

export interface AppConfig {
  port: number;
  nodeEnv: string;
  serviceName: string;
  databaseUrl: string;
  redisUrl: string;
  rabbitmqUrl: string;
  rabbitmqMode: RabbitMqMode;
  rabbitmqExchange: string;
  rabbitmqDlxExchange: string;
  rabbitmqQueue: string;
}

function parseRabbitMqMode(raw: string | undefined): RabbitMqMode {
  if (raw === 'publisher' || raw === 'consumer') return raw;
  return 'off';
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  serviceName: process.env.SERVICE_NAME ?? 'hypatia-service',
  databaseUrl: process.env.DATABASE_URL ?? '',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  rabbitmqUrl: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
  rabbitmqMode: parseRabbitMqMode(process.env.RABBITMQ_MODE),
  // Shared topic exchange across the Hypatia ecosystem — routing key = event type.
  rabbitmqExchange: process.env.RABBITMQ_EXCHANGE ?? 'hypatia.events',
  rabbitmqDlxExchange: process.env.RABBITMQ_DLX_EXCHANGE ?? 'hypatia.events.dlx',
  // Each service should use its own queue name (e.g. athena-core.events).
  rabbitmqQueue: process.env.RABBITMQ_QUEUE ?? 'hypatia-service.events',
});
