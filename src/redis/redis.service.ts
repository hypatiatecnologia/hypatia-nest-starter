import { Injectable, OnModuleDestroy } from '@nestjs/common';
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
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(config: ConfigService<AppConfig, true>) {
    this.client = new Redis(config.get('redisUrl', { infer: true }));
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
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
