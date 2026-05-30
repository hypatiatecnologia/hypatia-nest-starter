/**
 * Typed error for HTTP client failures.
 *
 * Carries statusCode so callers can decide retry/no-retry without
 * parsing string messages. 4xx errors are not retried; 429/502/503/504 are.
 */
export class HttpClientError extends Error {
  constructor(
    public readonly statusCode: number,
    method: string,
    url: string,
  ) {
    super(`HTTP ${statusCode} for ${method} ${url}`);
    this.name = 'HttpClientError';
  }
}
