import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from './common/auth/public.decorator';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';
import { RabbitMqService } from './rabbitmq/rabbitmq.service';

/**
 * Liveness/readiness probe for orchestrators (Docker, Dokploy, k8s).
 *
 * Returns HTTP 503 with `degraded` when Postgres, Redis, or RabbitMQ (when enabled)
 * is unreachable.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitMqService,
  ) {}

  @Public()
  @Get()
  @ApiResponse({ status: 200, description: 'All dependencies healthy' })
  @ApiResponse({ status: 503, description: 'One or more dependencies unreachable' })
  async check(@Res({ passthrough: true }) res: Response) {
    const checks = {
      postgres: await this.checkPostgres(),
      redis: await this.checkRedis(),
      rabbitmq: this.checkRabbitmq(),
    };

    const ok = this.isHealthy(checks);
    if (!ok) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return {
      status: ok ? 'ok' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  private isHealthy(checks: Record<string, string>): boolean {
    const coreOk = checks.postgres === 'ok' && checks.redis === 'ok';
    const rabbitOk = checks.rabbitmq === 'ok' || checks.rabbitmq === 'disabled';
    return coreOk && rabbitOk;
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

  private checkRabbitmq(): string {
    if (!this.rabbitmq.isEnabled()) {
      return 'disabled';
    }

    return this.rabbitmq.checkConnection() ? 'ok' : 'error';
  }
}
