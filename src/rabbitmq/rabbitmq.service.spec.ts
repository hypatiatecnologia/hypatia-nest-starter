import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConsumeMessage } from 'amqplib';
import configuration, { validateConfig } from '../config/configuration';
import { CorrelationContext } from '../common/correlation/correlation.context';
import { RabbitMqService } from './rabbitmq.service';
import { RedisService } from '../redis/redis.service';
import { HypatiaEvent } from './rabbitmq.types';

const TEST_DATABASE_URL = 'postgresql://hypatia:hypatia@localhost:5432/hypatia';

function buildEvent(overrides: Partial<HypatiaEvent> = {}): HypatiaEvent {
  return {
    eventId: 'evt-1',
    type: 'example.created',
    occurredAt: new Date().toISOString(),
    payload: { message: 'hello' },
    ...overrides,
  };
}

function buildMessage(event: HypatiaEvent): ConsumeMessage {
  return {
    content: Buffer.from(JSON.stringify(event)),
  } as ConsumeMessage;
}

function buildRawMessage(payload: unknown): ConsumeMessage {
  return {
    content: Buffer.from(JSON.stringify(payload)),
  } as ConsumeMessage;
}

describe('RabbitMqService', () => {
  let service: RabbitMqService;
  let redis: { setNx: jest.Mock; del: jest.Mock };

  async function createModule(rabbitmqMode: string) {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    process.env.RABBITMQ_MODE = rabbitmqMode;

    redis = {
      setNx: jest.fn().mockResolvedValue(true),
      del: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [configuration], validate: validateConfig })],
      providers: [RabbitMqService, { provide: RedisService, useValue: redis }],
    }).compile();

    service = module.get(RabbitMqService);
    return service;
  }

  describe('when RabbitMQ is disabled', () => {
    beforeEach(async () => {
      service = await createModule('off');
      await service.onApplicationBootstrap();
    });

    it('skips publish when RabbitMQ is disabled', async () => {
      await expect(service.publish('example.created', { ok: true })).resolves.toBeUndefined();
      expect(service.isEnabled()).toBe(false);
      expect(service.checkConnection()).toBe(false);
    });
  });

  describe('when RabbitMQ is publisher', () => {
    let publish: jest.Mock;

    beforeEach(async () => {
      service = await createModule('publisher');
      publish = jest.fn().mockResolvedValue(true);
      (service as unknown as { channel: ChannelWrapper }).channel = {
        publish,
      } as unknown as ChannelWrapper;
    });

    it('publishes events to the configured exchange', async () => {
      await service.publish('example.created', { orderId: '42' }, 'corr-1');

      expect(publish).toHaveBeenCalledWith(
        'hypatia.events',
        'example.created',
        expect.any(Buffer),
        expect.objectContaining({
          persistent: true,
          contentType: 'application/json',
          correlationId: 'corr-1',
        }),
      );

      const body = JSON.parse(publish.mock.calls[0][2].toString()) as HypatiaEvent;
      expect(body.type).toBe('example.created');
      expect(body.payload).toEqual({ orderId: '42' });
      expect(body.eventId).toEqual(expect.any(String));
    });

    it('rejects publish after the timeout when the channel buffers indefinitely', async () => {
      jest.useFakeTimers();
      try {
        // Simulates a disconnected broker: ChannelWrapper buffers and never settles.
        publish.mockReturnValue(new Promise(() => undefined));

        const promise = service.publish('example.created', { orderId: '42' });
        const assertion = expect(promise).rejects.toThrow('RabbitMQ publish');
        await jest.runAllTimersAsync();

        await assertion;
      } finally {
        jest.useRealTimers();
      }
    });

    it('uses CorrelationContext when correlationId is omitted', async () => {
      await CorrelationContext.runAsync('ctx-from-http', async () => {
        await service.publish('example.created', { orderId: '42' });
      });

      expect(publish).toHaveBeenCalledWith(
        'hypatia.events',
        'example.created',
        expect.any(Buffer),
        expect.objectContaining({ correlationId: 'ctx-from-http' }),
      );
    });
  });

  describe('message handling', () => {
    let ack: jest.Mock;
    let nack: jest.Mock;
    let handler: jest.Mock;

    beforeEach(async () => {
      service = await createModule('consumer');
      ack = jest.fn();
      nack = jest.fn();
      handler = jest.fn().mockResolvedValue(undefined);

      (service as unknown as { channel: { ack: jest.Mock; nack: jest.Mock } }).channel = {
        ack,
        nack,
      };

      service.registerHandler('example.created', handler);
    });

    async function handle(event: HypatiaEvent) {
      await (
        service as unknown as { handleMessage: (message: ConsumeMessage | null) => Promise<void> }
      ).handleMessage(buildMessage(event));
    }

    it('claims the dedupe key before the handler and acks the message', async () => {
      const event = buildEvent();
      await handle(event);

      expect(redis.setNx).toHaveBeenCalledWith('event:processed:evt-1', '1', 86400);
      expect(handler).toHaveBeenCalledWith(event);
      expect(ack).toHaveBeenCalled();
      expect(nack).not.toHaveBeenCalled();
    });

    it('runs the handler inside CorrelationContext from the event', async () => {
      const event = buildEvent({ correlationId: 'event-corr-99' });
      handler.mockImplementation(async () => {
        expect(CorrelationContext.get()).toBe('event-corr-99');
      });

      await handle(event);
    });

    it('skips duplicate events (claim lost) and acks without invoking the handler', async () => {
      redis.setNx.mockResolvedValue(false);

      await handle(buildEvent());

      expect(handler).not.toHaveBeenCalled();
      expect(ack).toHaveBeenCalled();
    });

    it('nacks and releases the claim when the handler throws', async () => {
      handler.mockRejectedValue(new Error('handler failed'));

      await handle(buildEvent());

      expect(nack).toHaveBeenCalledWith(expect.anything(), false, false);
      expect(ack).not.toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalledWith('event:processed:evt-1');
    });

    it('still dead-letters when releasing the claim fails', async () => {
      handler.mockRejectedValue(new Error('handler failed'));
      redis.del.mockRejectedValue(new Error('redis unavailable'));

      await handle(buildEvent());

      expect(redis.del).toHaveBeenCalledWith('event:processed:evt-1');
      expect(nack).toHaveBeenCalledWith(expect.anything(), false, false);
      expect(ack).not.toHaveBeenCalled();
    });

    it('nacks malformed event envelopes before dedupe', async () => {
      await (
        service as unknown as { handleMessage: (message: ConsumeMessage | null) => Promise<void> }
      ).handleMessage(buildRawMessage({ type: 'example.created', payload: { message: 'hello' } }));

      expect(handler).not.toHaveBeenCalled();
      expect(redis.setNx).not.toHaveBeenCalled();
      expect(nack).toHaveBeenCalledWith(expect.anything(), false, false);
      expect(ack).not.toHaveBeenCalled();
    });

    it('acks messages with no registered handler', async () => {
      await handle(buildEvent({ type: 'unknown.event' }));

      expect(handler).not.toHaveBeenCalled();
      expect(ack).toHaveBeenCalled();
    });
  });
});
