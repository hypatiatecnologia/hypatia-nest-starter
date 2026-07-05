import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { withTimeout } from './common/async/with-timeout';
import { Public } from './common/auth/public.decorator';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';
import { RabbitMqService } from './rabbitmq/rabbitmq.service';

/**
 * Health probes for orchestrators (Docker, Dokploy, k8s).
 *
 * GET /health/live  — liveness: process is up. Never checks dependencies —
 *                     restarting the container does not fix Postgres/Redis.
 * GET /health/ready — readiness: dependencies reachable; 503 removes the
 *                     instance from load balancing until they recover.
 * GET /health       — alias of /health/ready (backwards compatibility).
 *
 * All three are @Public — probes run before any credential exists. RabbitMQ
 * being "error" makes readiness fail on purpose: a publisher that cannot
 * publish or a worker that cannot consume is not ready, even if HTTP works.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  // A hung dependency must yield a fast 503, not block the probe until the
  // orchestrator's own timeout kills it.
  private static readonly CHECK_TIMEOUT_MS = 2_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitMqService,
  ) {}

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe — process is up, no dependency checks' })
  @ApiResponse({ status: 200, description: 'Process alive' })
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe — Postgres, Redis, RabbitMQ (when enabled)' })
  @ApiResponse({ status: 200, description: 'All dependencies healthy' })
  @ApiResponse({ status: 503, description: 'One or more dependencies unreachable' })
  async ready(@Res({ passthrough: true }) res: Response) {
    return this.checkReadiness(res);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Alias of /health/ready' })
  @ApiResponse({ status: 200, description: 'All dependencies healthy' })
  @ApiResponse({ status: 503, description: 'One or more dependencies unreachable' })
  async check(@Res({ passthrough: true }) res: Response) {
    return this.checkReadiness(res);
  }

  private async checkReadiness(res: Response) {
    const [postgres, redis] = await Promise.all([this.checkPostgres(), this.checkRedis()]);
    const checks = { postgres, redis, rabbitmq: this.checkRabbitmq() };

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
      await withTimeout(
        Promise.resolve(this.prisma.$queryRaw`SELECT 1`),
        HealthController.CHECK_TIMEOUT_MS,
        'Postgres readiness check',
      );
      return 'ok';
    } catch {
      return 'error';
    }
  }

  private async checkRedis(): Promise<string> {
    try {
      await withTimeout(
        this.redis.ping(),
        HealthController.CHECK_TIMEOUT_MS,
        'Redis readiness check',
      );
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
