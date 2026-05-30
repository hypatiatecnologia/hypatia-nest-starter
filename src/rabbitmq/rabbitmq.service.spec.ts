import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { RabbitMqService } from './rabbitmq.service';
import { RedisService } from '../redis/redis.service';

describe('RabbitMqService', () => {
  let service: RabbitMqService;

  beforeEach(async () => {
    process.env.RABBITMQ_MODE = 'off';

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [configuration] })],
      providers: [
        RabbitMqService,
        {
          provide: RedisService,
          useValue: { exists: jest.fn(), set: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(RabbitMqService);
    await service.onApplicationBootstrap();
  });

  it('skips publish when RabbitMQ is disabled', async () => {
    await expect(service.publish('example.created', { ok: true })).resolves.toBeUndefined();
    expect(service.isEnabled()).toBe(false);
  });
});
