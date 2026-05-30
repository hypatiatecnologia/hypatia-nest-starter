import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';
import { RabbitMqService } from './rabbitmq/rabbitmq.service';

/**
 * Liveness/readiness probe for orchestrators (Docker, Dokploy, k8s).
 *
 * Returns HTTP 503 with `degraded` when Postgres or Redis is unreachable.
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
  @ApiResponse({ status: 200, description: 'All dependencies healthy' })
  @ApiResponse({ status: 503, description: 'One or more dependencies unreachable' })
  async check(@Res({ passthrough: true }) res: Response) {
    const checks = {
      postgres: await this.checkPostgres(),
      redis: await this.checkRedis(),
      rabbitmq: this.rabbitmq.isEnabled() ? 'configured' : 'disabled',
    };

    const ok = checks.postgres === 'ok' && checks.redis === 'ok';
    if (!ok) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

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
