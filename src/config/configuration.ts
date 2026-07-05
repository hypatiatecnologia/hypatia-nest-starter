import { z } from 'zod';

/**
 * Typed application configuration loaded once at startup via ConfigModule.
 *
 * All env access should go through this file — avoid scattered `process.env` calls.
 * Archetype presets live in `archetypes/api.env.example` and `archetypes/worker.env.example`.
 *
 * Adding a new variable (checklist):
 *   1. Add the UPPER_SNAKE_CASE key to `envSchema` below (default or validation)
 *   2. Add the camelCase field to `AppConfig` and map it in `mapToAppConfig`
 *   3. Document it in `.env.example` (and archetypes/ when archetype-specific)
 *   4. Read it via `config.get('field', { infer: true })` — never process.env
 *
 * Invalid or missing config aborts the boot with a readable error listing every
 * offending variable — a service with broken config must not come up half-alive.
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
  argusJwtSecret?: string;
  argusJwtIssuer?: string;
  argusJwtAudience?: string;
  internalApiKey?: string;
  /** Express `trust proxy` — set when running behind Cerberus/reverse proxy. */
  trustProxy?: number | string;
  throttleTtlMs: number;
  throttleLimit: number;
}

const envSchema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    NODE_ENV: z.string().default('development'),
    SERVICE_NAME: z.string().min(1, 'SERVICE_NAME is required'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    REDIS_URL: z.string().min(1, 'REDIS_URL is required').default('redis://localhost:6379'),
    RABBITMQ_URL: z.string().default('amqp://hypatia:hypatia-rabbitmq-dev@localhost:5672'),
    RABBITMQ_MODE: z.enum(['off', 'publisher', 'consumer']).default('off'),
    RABBITMQ_EXCHANGE: z.string().default('hypatia.events'),
    RABBITMQ_DLX_EXCHANGE: z.string().default('hypatia.events.dlx'),
    RABBITMQ_QUEUE: z.string().default('hypatia-service.events'),
    ARGUS_JWT_SECRET: z.string().optional(),
    ARGUS_JWT_ISSUER: z.string().optional(),
    ARGUS_JWT_AUDIENCE: z.string().optional(),
    INTERNAL_API_KEY: z.string().optional(),
    TRUST_PROXY: z.string().optional(),
    THROTTLE_TTL_MS: z.coerce.number().int().min(1000).default(60000),
    THROTTLE_LIMIT: z.coerce.number().int().min(1).default(100),
  })
  .superRefine((env, ctx) => {
    if (env.RABBITMQ_MODE !== 'off' && !env.RABBITMQ_URL?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['RABBITMQ_URL'],
        message: 'RABBITMQ_URL is required when RABBITMQ_MODE is publisher or consumer',
      });
    }

    const hasAuthSecret = Boolean(env.ARGUS_JWT_SECRET?.trim() || env.INTERNAL_API_KEY?.trim());
    if (env.NODE_ENV === 'production' && !hasAuthSecret) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ARGUS_JWT_SECRET'],
        message: 'ARGUS_JWT_SECRET or INTERNAL_API_KEY is required in production',
      });
    }
  });

/**
 * TRUST_PROXY accepts the same values as Express `trust proxy`:
 *   "true"      → 1 (trust the first hop only — safer than trusting all proxies)
 *   "2"         → number of hops
 *   "loopback" / CIDR list → passed through as-is
 * Unset/"false" → proxy headers are NOT trusted (direct exposure).
 */
function parseTrustProxy(raw?: string): number | string | undefined {
  const value = raw?.trim();
  if (!value || value.toLowerCase() === 'false') {
    return undefined;
  }
  if (value.toLowerCase() === 'true') {
    return 1;
  }
  return /^\d+$/.test(value) ? Number(value) : value;
}

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
    argusJwtSecret: env.ARGUS_JWT_SECRET?.trim() || undefined,
    argusJwtIssuer: env.ARGUS_JWT_ISSUER?.trim() || undefined,
    argusJwtAudience: env.ARGUS_JWT_AUDIENCE?.trim() || undefined,
    internalApiKey: env.INTERNAL_API_KEY?.trim() || undefined,
    trustProxy: parseTrustProxy(env.TRUST_PROXY),
    throttleTtlMs: env.THROTTLE_TTL_MS,
    throttleLimit: env.THROTTLE_LIMIT,
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
