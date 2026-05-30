import { Injectable } from '@nestjs/common';
import { CORRELATION_ID_HEADER } from '../common/correlation/correlation.constants';
import { CorrelationContext } from '../common/correlation/correlation.context';

export interface HttpClientRequestOptions {
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
}

/**
 * Outbound HTTP client that propagates x-correlation-id to upstream services.
 * Uses native fetch (Node 20+) — no extra dependency.
 */
@Injectable()
export class HttpClientService {
  async get<T>(url: string, options: HttpClientRequestOptions = {}): Promise<T> {
    return this.request<T>('GET', url, options);
  }

  async post<T>(url: string, options: HttpClientRequestOptions = {}): Promise<T> {
    return this.request<T>('POST', url, options);
  }

  async put<T>(url: string, options: HttpClientRequestOptions = {}): Promise<T> {
    return this.request<T>('PUT', url, options);
  }

  async delete<T>(url: string, options: HttpClientRequestOptions = {}): Promise<T> {
    return this.request<T>('DELETE', url, options);
  }

  private async request<T>(
    method: string,
    url: string,
    options: HttpClientRequestOptions,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 10_000);

    try {
      const headers: Record<string, string> = {
        accept: 'application/json',
        ...options.headers,
      };

      const correlationId = CorrelationContext.get();
      if (correlationId) {
        headers[CORRELATION_ID_HEADER] = correlationId;
      }

      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (options.body !== undefined) {
        headers['content-type'] = 'application/json';
        init.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, init);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${method} ${url}`);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}
