import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ExampleService } from './example.service';
import { RabbitMqService } from '../../rabbitmq/rabbitmq.service';
import { CorrelationContext } from '../../common/correlation/correlation.context';
import { HypatiaEvent } from '../../rabbitmq/rabbitmq.types';

describe('ExampleService', () => {
  let service: ExampleService;
  let rabbitmq: { publish: jest.Mock; isEnabled: jest.Mock };
  let logSpy: jest.SpyInstance;

  beforeEach(async () => {
    rabbitmq = {
      publish: jest.fn().mockResolvedValue(undefined),
      isEnabled: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ExampleService, { provide: RabbitMqService, useValue: rabbitmq }],
    }).compile();

    service = module.get(ExampleService);
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('publishes event and returns correlation id from context', async () => {
    const result = await CorrelationContext.runAsync('svc-corr-1', async () =>
      service.publishEvent('example.created', { message: 'hi' }),
    );

    expect(rabbitmq.publish).toHaveBeenCalledWith('example.created', { message: 'hi' });
    expect(result).toEqual({
      published: true,
      type: 'example.created',
      correlationId: 'svc-corr-1',
    });
  });

  it('returns published false without calling the broker when RabbitMQ is off', async () => {
    rabbitmq.isEnabled.mockReturnValue(false);

    const result = await service.publishEvent('example.created', { message: 'hi' });

    expect(result.published).toBe(false);
    expect(rabbitmq.publish).not.toHaveBeenCalled();
  });

  it('redacts sensitive fields when handling a consumed event', () => {
    const event: HypatiaEvent = {
      eventId: 'evt-1',
      type: 'example.created',
      occurredAt: new Date().toISOString(),
      correlationId: 'worker-corr',
      payload: { message: 'hello', email: 'user@example.com' },
    };

    CorrelationContext.run('worker-corr', () => {
      service.handleExampleCreated(event);
    });

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[REDACTED]'));
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('user@example.com'));
  });
});
