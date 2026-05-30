import { z } from 'zod';

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

const envSchema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    NODE_ENV: z.string().default('development'),
    SERVICE_NAME: z.string().min(1, 'SERVICE_NAME is required'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    REDIS_URL: z.string().min(1, 'REDIS_URL is required').default('redis://localhost:6379'),
    RABBITMQ_URL: z.string().default('amqp://guest:guest@localhost:5672'),
    RABBITMQ_MODE: z.enum(['off', 'publisher', 'consumer']).default('off'),
    RABBITMQ_EXCHANGE: z.string().default('hypatia.events'),
    RABBITMQ_DLX_EXCHANGE: z.string().default('hypatia.events.dlx'),
    RABBITMQ_QUEUE: z.string().default('hypatia-service.events'),
  })
  .superRefine((env, ctx) => {
    if (env.RABBITMQ_MODE !== 'off' && !env.RABBITMQ_URL?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['RABBITMQ_URL'],
        message: 'RABBITMQ_URL is required when RABBITMQ_MODE is publisher or consumer',
      });
    }
  });

function mapToAppConfig(env: z.infer<typeof envSchema>): AppConfig {
  return {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    serviceName: env.SERVICE_NAME,
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,
    rabbitmqUrl: env.RABBITMQ_URL,
    rabbitmqMode: env.RABBITMQ_MODE,
    rabbitmqExchange: env.RABBITMQ_EXCHANGE,
    rabbitmqDlxExchange: env.RABBITMQ_DLX_EXCHANGE,
    rabbitmqQueue: env.RABBITMQ_QUEUE,
  };
}

/**
 * Validates raw environment variables (UPPER_SNAKE_CASE) via Zod.
 * Called by ConfigModule.forRoot({ validate }) before the app boots.
 */
export function validateConfig(rawEnv: Record<string, unknown>): AppConfig {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Configuration validation failed:\n${details}`);
  }
  return mapToAppConfig(result.data);
}

export default function loadConfiguration(): AppConfig {
  return validateConfig(process.env as Record<string, unknown>);
}
