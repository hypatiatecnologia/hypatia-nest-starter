import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

const storage = new AsyncLocalStorage<string>();

export function resolveCorrelationId(incoming?: string | string[]): string {
  if (typeof incoming === 'string' && incoming.trim()) {
    return incoming.trim();
  }

  if (Array.isArray(incoming)) {
    const first = incoming.find((value) => value.trim());
    if (first) return first.trim();
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
    if (explicit?.trim()) return explicit.trim();
    return resolveCorrelationId(storage.getStore());
  },
};
