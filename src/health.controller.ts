import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';
import { RabbitMqService } from './rabbitmq/rabbitmq.service';

/**
 * Liveness/readiness probe for orchestrators (Docker, Dokploy, k8s).
 *
 * Returns `degraded` when Postgres or Redis is unreachable.
 * RabbitMQ reports `configured` vs `disabled` — extend with an active
 * connectivity check if your deployment requires it.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitMqService,
  ) {}

  @Get()
  async check() {
    const checks = {
      postgres: await this.checkPostgres(),
      redis: await this.checkRedis(),
      rabbitmq: this.rabbitmq.isEnabled() ? 'configured' : 'disabled',
    };

    const ok = checks.postgres === 'ok' && checks.redis === 'ok';
    return {
      status: ok ? 'ok' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  private async checkPostgres(): Promise<string> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'ok';
    } catch {
      return 'error';
    }
  }

  private async checkRedis(): Promise<string> {
    try {
      const pong = await this.redis.get('health:ping');
      if (pong === null) {
        await this.redis.set('health:ping', '1', 30);
      }
      return 'ok';
    } catch {
      return 'error';
    }
  }
}
