import { Injectable } from '@nestjs/common';
import { CORRELATION_ID_HEADER } from '../common/correlation/correlation.constants';
import { CorrelationContext } from '../common/correlation/correlation.context';
import { HttpClientError } from './http-client.error';

export interface HttpClientRequestOptions {
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
}

/**
 * Outbound HTTP client that propagates x-correlation-id to upstream services.
 * Uses native fetch (Node 20+) — no extra dependency.
 *
 * Retries up to MAX_ATTEMPTS times on transient server errors (429, 502, 503, 504)
 * with exponential backoff starting at 200ms.
 */
@Injectable()
export class HttpClientService {
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

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
      const shouldRetry =
        error instanceof HttpClientError &&
        HttpClientService.RETRYABLE_STATUSES.has(error.statusCode) &&
        attempt < HttpClientService.MAX_ATTEMPTS;

      if (!shouldRetry) throw error;

      await this.delay(100 * 2 ** attempt);
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

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
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
