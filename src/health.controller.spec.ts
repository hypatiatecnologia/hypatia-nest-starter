import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';
import { RabbitMqService } from './rabbitmq/rabbitmq.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: { $queryRaw: jest.Mock };
  let redis: { ping: jest.Mock };
  let rabbitmq: { isEnabled: jest.Mock; checkConnection: jest.Mock };

  beforeEach(async () => {
    prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    redis = { ping: jest.fn().mockResolvedValue(undefined) };
    rabbitmq = {
      isEnabled: jest.fn().mockReturnValue(true),
      checkConnection: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: RabbitMqService, useValue: rabbitmq },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  it('returns ok with HTTP 200 when dependencies are healthy', async () => {
    const res = { status: jest.fn().mockReturnThis() } as unknown as Response;

    const body = await controller.check(res);

    expect(body.status).toBe('ok');
    expect(body.checks.postgres).toBe('ok');
    expect(body.checks.redis).toBe('ok');
    expect(body.checks.rabbitmq).toBe('ok');
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns degraded with HTTP 503 when postgres is unreachable', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));
    const res = { status: jest.fn().mockReturnThis() } as unknown as Response;

    const body = await controller.check(res);

    expect(body.status).toBe('degraded');
    expect(body.checks.postgres).toBe('error');
    expect(res.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
  });

  it('returns degraded with HTTP 503 when redis is unreachable', async () => {
    redis.ping.mockRejectedValue(new Error('connection refused'));
    const res = { status: jest.fn().mockReturnThis() } as unknown as Response;

    const body = await controller.check(res);

    expect(body.status).toBe('degraded');
    expect(body.checks.redis).toBe('error');
    expect(res.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
  });

  it('returns degraded when rabbitmq is enabled but disconnected', async () => {
    rabbitmq.checkConnection.mockReturnValue(false);
    const res = { status: jest.fn().mockReturnThis() } as unknown as Response;

    const body = await controller.check(res);

    expect(body.status).toBe('degraded');
    expect(body.checks.rabbitmq).toBe('error');
    expect(res.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
  });

  it('reports rabbitmq as disabled when messaging is off', async () => {
    rabbitmq.isEnabled.mockReturnValue(false);
    const res = { status: jest.fn().mockReturnThis() } as unknown as Response;

    const body = await controller.check(res);

    expect(body.status).toBe('ok');
    expect(body.checks.rabbitmq).toBe('disabled');
  });

  it('marks a hung dependency as error after the check timeout', async () => {
    jest.useFakeTimers();
    try {
      prisma.$queryRaw.mockReturnValue(new Promise(() => undefined));
      const res = { status: jest.fn().mockReturnThis() } as unknown as Response;

      const promise = controller.check(res);
      await jest.runAllTimersAsync();
      const body = await promise;

      expect(body.checks.postgres).toBe('error');
      expect(body.status).toBe('degraded');
      expect(res.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    } finally {
      jest.useRealTimers();
    }
  });

  it('liveness never touches dependencies', () => {
    prisma.$queryRaw.mockRejectedValue(new Error('down'));
    redis.ping.mockRejectedValue(new Error('down'));
    rabbitmq.checkConnection.mockReturnValue(false);

    const body = controller.live();

    expect(body.status).toBe('ok');
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(redis.ping).not.toHaveBeenCalled();
  });

  it('readiness endpoint mirrors /health', async () => {
    const res = { status: jest.fn().mockReturnThis() } as unknown as Response;

    const body = await controller.ready(res);

    expect(body.status).toBe('ok');
    expect(body.checks).toEqual({ postgres: 'ok', redis: 'ok', rabbitmq: 'ok' });
  });
});
