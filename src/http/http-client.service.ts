import { Injectable } from '@nestjs/common';
import { CORRELATION_ID_HEADER } from '../common/correlation/correlation.constants';
import { CorrelationContext } from '../common/correlation/correlation.context';
import { HttpClientError } from './http-client.error';

export interface HttpClientRequestOptions {
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  /**
   * Opt into retries for non-idempotent requests (POST). Only safe when the
   * upstream endpoint deduplicates (e.g. accepts an idempotency key) —
   * a retried POST that DID reach the server applies its effect twice.
   */
  retry?: boolean;
}

/**
 * Outbound HTTP client that propagates x-correlation-id to upstream services.
 * Uses native fetch (Node 20+) — no extra dependency.
 *
 * Retries idempotent methods (GET, PUT, DELETE) up to MAX_ATTEMPTS times on
 * transient errors — HTTP 429/502/503/504, network failures, and timeouts —
 * with jittered exponential backoff.
 * POST is never retried unless `options.retry` is set explicitly.
 *
 * Usage (inject it — HttpClientModule is global):
 *   const order = await this.http.get<Order>(`${ordersBaseUrl}/orders/${id}`);
 *   await this.http.post(url, { body: { sku }, timeoutMs: 5_000 });
 *
 * Failures throw HttpClientError with the status code (query strings are
 * stripped from messages — they may carry tokens). Timeouts default to 10s.
 */
@Injectable()
export class HttpClientService {
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);
  private static readonly IDEMPOTENT_METHODS = new Set(['GET', 'PUT', 'DELETE']);

  async get<T>(url: string, options: HttpClientRequestOptions = {}): Promise<T> {
    return this.requestWithRetry<T>('GET', url, options);
  }

  async post<T>(url: string, options: HttpClientRequestOptions = {}): Promise<T> {
    return this.requestWithRetry<T>('POST', url, options);
  }

  async put<T>(url: string, options: HttpClientRequestOptions = {}): Promise<T> {
    return this.requestWithRetry<T>('PUT', url, options);
  }

  async delete<T>(url: string, options: HttpClientRequestOptions = {}): Promise<T> {
    return this.requestWithRetry<T>('DELETE', url, options);
  }

  private async requestWithRetry<T>(
    method: string,
    url: string,
    options: HttpClientRequestOptions,
    attempt = 1,
  ): Promise<T> {
    try {
      return await this.executeRequest<T>(method, url, options);
    } catch (error) {
      const methodIsRetryable =
        options.retry ?? HttpClientService.IDEMPOTENT_METHODS.has(method.toUpperCase());
      const shouldRetry =
        methodIsRetryable &&
        this.isTransientError(error) &&
        attempt < HttpClientService.MAX_ATTEMPTS;

      if (!shouldRetry) throw error;

      // Full jitter: spreads concurrent retries instead of synchronizing them.
      // eslint-disable-next-line sonarjs/pseudo-random -- jitter, not security
      await this.delay(Math.random() * 100 * 2 ** attempt);
      return this.requestWithRetry<T>(method, url, options, attempt + 1);
    }
  }

  private async executeRequest<T>(
    method: string,
    url: string,
    options: HttpClientRequestOptions,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 10_000);

    try {
      const headers = this.buildHeaders(options.headers);
      const init: RequestInit = { method, headers, signal: controller.signal };

      if (options.body !== undefined) {
        headers['content-type'] = 'application/json';
        init.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, init);
      if (!response.ok) {
        throw new HttpClientError(response.status, method, url);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      try {
        return (await response.json()) as T;
      } catch {
        throw new HttpClientError(response.status, method, url, 'response body is not valid JSON');
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  private isTransientError(error: unknown): boolean {
    if (error instanceof HttpClientError) {
      return HttpClientService.RETRYABLE_STATUSES.has(error.statusCode);
    }

    // fetch (undici) rejects with TypeError on network failures (DNS,
    // connection refused/reset) and with an AbortError DOMException when the
    // timeout controller fires — both are transient by nature.
    const name = (error as { name?: string } | null)?.name;
    return error instanceof TypeError || name === 'AbortError';
  }

  private buildHeaders(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = { accept: 'application/json', ...extra };
    const correlationId = CorrelationContext.get();
    if (correlationId) {
      headers[CORRELATION_ID_HEADER] = correlationId;
    }
    return headers;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
