import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AppConfig } from '../config/configuration';

/**
 * Thin wrapper over ioredis.
 *
 * Common uses in Hypatia services:
 * - Athena: Redlock / inventory locks during checkout
 * - Consumers: idempotency keys (`event:processed:{eventId}`)
 * - General: short-lived cache, rate-limit counters
 *
 * Keep the wrapper thin: expose the specific commands services need instead of
 * leaking the whole ioredis surface — it keeps usage greppable and mockable in
 * tests. Add methods here as real use cases appear.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(config: ConfigService<AppConfig, true>) {
    this.client = new Redis(config.get('redisUrl', { infer: true }), {
      // Fail fast while Redis is down: without these bounds ioredis buffers
      // commands and retries for a long time, hanging readiness probes and
      // idempotency claims instead of surfacing an error.
      maxRetriesPerRequest: 3,
      commandTimeout: 5_000,
    });

    // ioredis emits 'error' on connection failures; without a listener Node
    // treats it as an unhandled EventEmitter error and can crash the process.
    this.client.on('error', (error: Error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });
  }

  /**
   * Underlying ioredis connection — for libraries that accept a client
   * (e.g. throttler storage). Sharing it keeps a single connection whose
   * lifecycle ends in onModuleDestroy.
   */
  getClient(): Redis {
    return this.client;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * Atomic set-if-absent (SET NX EX). Returns true when this caller acquired
   * the key — the primitive behind idempotency claims and simple locks.
   */
  async setNx(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.set(key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  /** Connectivity probe for readiness checks. */
  async ping(): Promise<void> {
    await this.client.ping();
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  onModuleDestroy(): void {
    this.client.disconnect();
  }
}
