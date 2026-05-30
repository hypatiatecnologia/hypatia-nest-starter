import { Test, TestingModule } from '@nestjs/testing';
import { ExampleService } from './example.service';
import { RabbitMqService } from '../../rabbitmq/rabbitmq.service';
import { CorrelationContext } from '../../common/correlation/correlation.context';

describe('ExampleService', () => {
  let service: ExampleService;
  let rabbitmq: { publish: jest.Mock };

  beforeEach(async () => {
    rabbitmq = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ExampleService, { provide: RabbitMqService, useValue: rabbitmq }],
    }).compile();

    service = module.get(ExampleService);
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
});
