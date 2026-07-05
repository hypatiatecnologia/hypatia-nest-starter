/**
 * Rejects after `ms` if the promise has not settled.
 *
 * The underlying operation is NOT cancelled — callers own any cleanup.
 * Used to fail fast on infra calls that would otherwise hang forever
 * (RabbitMQ buffered publishes/connects, dependency probes in readiness).
 */
export async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
