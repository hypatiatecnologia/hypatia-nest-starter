import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AmqpConnectionManagerClass, ChannelWrapper } from 'amqp-connection-manager';
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

    it('removes timed-out messages from the real disconnected channel buffer', async () => {
      jest.useFakeTimers();
      const connection = new AmqpConnectionManagerClass(['amqp://localhost']);
      const channel = connection.createChannel({});
      (service as unknown as { channel: ChannelWrapper }).channel = channel;
      try {
        const promise = service.publish('example.created', { message: 'hello' });
        const assertion = expect(promise).rejects.toThrow(/timeout|timed out/);
        expect(channel.queueLength()).toBe(1);
        await jest.advanceTimersByTimeAsync(10_000);
        await assertion;
        expect(channel.queueLength()).toBe(0);
      } finally {
        await channel.close();
        jest.useRealTimers();
      }
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

      expect(redis.setNx).toHaveBeenCalledWith(
        `event:processed:${encodeURIComponent(process.env.RABBITMQ_QUEUE ?? 'hypatia-service.events')}:evt-1`,
        '1',
        86400,
      );
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

    it('deduplicates replicas of a queue without suppressing another subscription', async () => {
      const claimed = new Set<string>();
      redis.setNx.mockImplementation(async (key: string) => {
        if (claimed.has(key)) return false;
        claimed.add(key);
        return true;
      });
      const otherHandler = jest.fn().mockResolvedValue(undefined);
      const other = new RabbitMqService(
        new ConfigService({ rabbitmqQueue: 'another-worker.events' }),
        redis as unknown as RedisService,
      );
      (other as unknown as { channel: { ack: jest.Mock; nack: jest.Mock } }).channel = {
        ack,
        nack,
      };
      other.registerHandler('example.created', otherHandler);

      await handle(buildEvent());
      await handle(buildEvent());
      await (
        other as unknown as { handleMessage: (message: ConsumeMessage) => Promise<void> }
      ).handleMessage(buildMessage(buildEvent()));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(otherHandler).toHaveBeenCalledTimes(1);
      expect(ack).toHaveBeenCalledTimes(3);
    });

    it('skips duplicate events (claim lost) and acks without invoking the handler', async () => {
      redis.setNx.mockResolvedValue(false);

      await handle(buildEvent());

      expect(handler).not.toHaveBeenCalled();
      expect(ack).toHaveBeenCalled();
    });

    it('requeues the message when the Redis claim fails (infra outage)', async () => {
      jest.useFakeTimers();
      try {
        redis.setNx.mockRejectedValue(new Error('redis unavailable'));

        const assertion = expect(handle(buildEvent())).resolves.toBeUndefined();
        await jest.runAllTimersAsync();
        await assertion;

        expect(handler).not.toHaveBeenCalled();
        expect(redis.del).not.toHaveBeenCalled();
        expect(ack).not.toHaveBeenCalled();
        expect(nack).toHaveBeenCalledWith(expect.anything(), false, true);
      } finally {
        jest.useRealTimers();
      }
    });

    it('nacks and releases the claim when the handler throws', async () => {
      handler.mockRejectedValue(new Error('handler failed'));

      await handle(buildEvent());

      expect(nack).toHaveBeenCalledWith(expect.anything(), false, false);
      expect(ack).not.toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalledWith(
        `event:processed:${encodeURIComponent(process.env.RABBITMQ_QUEUE ?? 'hypatia-service.events')}:evt-1`,
      );
    });

    it('still dead-letters when releasing the claim fails', async () => {
      handler.mockRejectedValue(new Error('handler failed'));
      redis.del.mockRejectedValue(new Error('redis unavailable'));

      await handle(buildEvent());

      expect(redis.del).toHaveBeenCalledWith(
        `event:processed:${encodeURIComponent(process.env.RABBITMQ_QUEUE ?? 'hypatia-service.events')}:evt-1`,
      );
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
