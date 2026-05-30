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
  let redis: { get: jest.Mock; set: jest.Mock };
  let rabbitmq: { isEnabled: jest.Mock };

  beforeEach(async () => {
    prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    redis = { get: jest.fn().mockResolvedValue('1'), set: jest.fn() };
    rabbitmq = { isEnabled: jest.fn().mockReturnValue(true) };

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
    expect(body.checks.rabbitmq).toBe('configured');
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
    redis.get.mockRejectedValue(new Error('connection refused'));
    const res = { status: jest.fn().mockReturnThis() } as unknown as Response;

    const body = await controller.check(res);

    expect(body.status).toBe('degraded');
    expect(body.checks.redis).toBe('error');
    expect(res.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
  });
});
