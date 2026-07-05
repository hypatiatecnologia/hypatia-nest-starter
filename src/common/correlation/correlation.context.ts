import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

// AsyncLocalStorage is Node's "thread-local": a value set at the start of a
// request (or consumed message) follows every await/callback spawned from it,
// with no need to thread a `correlationId` parameter through each function
// signature. This is how logs, outbound HTTP calls, and published events all
// carry the same id from anywhere in the call stack.
const storage = new AsyncLocalStorage<string>();

// Correlation ids come from untrusted headers/messages and are echoed into
// response headers, logs, and events. The allowlist blocks control characters
// (log injection) and the cap prevents log flooding via megabyte-sized ids.
const MAX_CORRELATION_ID_LENGTH = 128;
const CORRELATION_ID_PATTERN = /^[A-Za-z0-9._:-]+$/;

/** Returns the trimmed id when it is safe to propagate, undefined otherwise. */
export function sanitizeCorrelationId(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.length > MAX_CORRELATION_ID_LENGTH) {
    return undefined;
  }
  return CORRELATION_ID_PATTERN.test(trimmed) ? trimmed : undefined;
}

export function resolveCorrelationId(incoming?: string | string[]): string {
  const candidates = Array.isArray(incoming) ? incoming : [incoming];
  for (const candidate of candidates) {
    const valid = sanitizeCorrelationId(candidate);
    if (valid) return valid;
  }

  const current = storage.getStore();
  if (current) return current;

  return randomUUID();
}

/**
 * Request-scoped correlation id via AsyncLocalStorage.
 *
 * HTTP: set by correlationMiddleware before handlers run.
 * Workers: set by RabbitMqService around each consumer handler.
 */
export const CorrelationContext = {
  run<T>(correlationId: string, fn: () => T): T {
    return storage.run(correlationId, fn);
  },

  async runAsync<T>(correlationId: string, fn: () => Promise<T>): Promise<T> {
    return storage.run(correlationId, fn);
  },

  get(): string | undefined {
    return storage.getStore();
  },

  resolve(explicit?: string): string {
    const valid = sanitizeCorrelationId(explicit);
    if (valid) return valid;
    return resolveCorrelationId(storage.getStore());
  },
};
