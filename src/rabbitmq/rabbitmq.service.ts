import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqpConnectionManager, {
  AmqpConnectionManager,
  ChannelWrapper,
} from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { AppConfig } from '../config/configuration';
import { withTimeout } from '../common/async/with-timeout';
import { CorrelationContext } from '../common/correlation/correlation.context';
import { RedisService } from '../redis/redis.service';
import { HypatiaEvent, EventHandler } from './rabbitmq.types';

// amqp-connection-manager retries forever; without these bounds a RabbitMQ
// outage hangs bootstrap (connect) or HTTP requests (buffered publish).
const CONNECT_TIMEOUT_MS = 30_000;
const PUBLISH_TIMEOUT_MS = 10_000;

const hypatiaEventSchema = z
  .object({
    eventId: z.string().min(1),
    type: z.string().min(1),
    occurredAt: z.string().min(1),
    correlationId: z.string().min(1).optional(),
    payload: z.unknown(),
  })
  .passthrough();

/**
 * RabbitMQ client for the Hypatia ecosystem.
 *
 * Topology (created automatically on connect):
 *   hypatia.events          — topic exchange (routing key = event type)
 *   hypatia.events.dlx      — dead-letter exchange
 *   {RABBITMQ_QUEUE}        — service queue, bound to the routing keys of the
 *                             registered handlers (only receives what it consumes)
 *   {RABBITMQ_QUEUE}.dlq    — dead-letter queue for failed messages
 *
 * Publisher usage (api archetype):
 *   await this.rabbitmq.publish('order.created', { orderId });
 *   // correlationId is taken from CorrelationContext when omitted
 *
 * Consumer usage (worker archetype):
 *   // In onModuleInit — BEFORE onApplicationBootstrap starts consuming:
 *   this.rabbitmq.registerHandler('order.created', (event) => this.handle(event));
 *
 * Why two lifecycle hooks: feature modules register handlers in onModuleInit;
 * this service connects and starts consuming in onApplicationBootstrap, which
 * Nest guarantees to run after ALL modules' onModuleInit. The handler map thus
 * drives the queue bindings in setupTopology(). Registering a handler after
 * bootstrap is a silent no-op — its binding never gets created.
 *
 * Message lifecycle on the consumer side (handleMessage):
 *   parse + validate envelope → claim eventId in Redis (skip duplicates) →
 *   run handler → ack. Any failure → release claim + nack without requeue →
 *   the broker dead-letters the message to {queue}.dlq for inspection/replay
 *   (Management UI → Queues → {queue}.dlq).
 *
 * Management UI (local dev): http://localhost:15672 (RABBITMQ_USER / RABBITMQ_PASSWORD do .env)
 */
@Injectable()
export class RabbitMqService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqService.name);
  private connection?: AmqpConnectionManager;
  private channel?: ChannelWrapper;
  private consumerTag?: string;
  private readonly handlers = new Map<string, EventHandler>();

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly redis: RedisService,
  ) {}

  /** Register a handler per event type. Call from consumer classes in onModuleInit. */
  registerHandler(eventType: string, handler: EventHandler): void {
    this.handlers.set(eventType, handler);
  }

  // Consumer starts here (after all modules finished onModuleInit and registered handlers).
  async onApplicationBootstrap(): Promise<void> {
    const mode = this.config.get('rabbitmqMode', { infer: true });
    if (mode === 'off') {
      this.logger.log('RabbitMQ disabled (RABBITMQ_MODE=off)');
      return;
    }

    await this.connect();
    if (mode === 'consumer') {
      await this.startConsumer();
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.consumerTag && this.channel) {
      await this.channel.cancel(this.consumerTag).catch(() => undefined);
    }
    await this.channel?.close();
    await this.connection?.close();
  }

  isEnabled(): boolean {
    return this.config.get('rabbitmqMode', { infer: true }) !== 'off';
  }

  /** Active connectivity probe for health checks when messaging is enabled. */
  checkConnection(): boolean {
    if (!this.isEnabled()) {
      return false;
    }

    return Boolean(this.connection?.isConnected());
  }

  async publish<T>(type: string, payload: T, correlationId?: string): Promise<void> {
    if (!this.isEnabled()) {
      this.logger.debug(`Skipped publish for ${type} (RabbitMQ off)`);
      return;
    }

    const event: HypatiaEvent<T> = {
      eventId: randomUUID(),
      type,
      occurredAt: new Date().toISOString(),
      correlationId: CorrelationContext.resolve(correlationId),
      payload,
    };

    const exchange = this.config.get('rabbitmqExchange', { infer: true });
    const body = Buffer.from(JSON.stringify(event));

    if (!this.channel) {
      throw new Error('RabbitMQ channel is not available');
    }

    // ChannelWrapper buffers while disconnected — without a timeout the caller
    // (usually an HTTP request) hangs for the whole outage. On timeout the
    // buffered message may still go out after reconnect; consumers dedupe by
    // eventId, so a caller retry does not double-process.
    await withTimeout(
      this.channel.publish(exchange, type, body, {
        persistent: true,
        contentType: 'application/json',
        messageId: event.eventId,
        correlationId: event.correlationId,
      }),
      PUBLISH_TIMEOUT_MS,
      `RabbitMQ publish (${type})`,
    );
  }

  private async connect(): Promise<void> {
    const url = this.config.get('rabbitmqUrl', { infer: true });
    // amqp-connection-manager reconnects automatically after network blips.
    this.connection = amqpConnectionManager.connect([url]);

    this.connection.on('connect', () => this.logger.log('RabbitMQ connected'));
    this.connection.on('disconnect', ({ err }) =>
      this.logger.warn(`RabbitMQ disconnected: ${err?.message ?? 'unknown'}`),
    );

    this.channel = this.connection.createChannel({
      setup: async (channel: ConfirmChannel) => {
        await this.setupTopology(channel);
      },
    });

    const channel = this.channel;
    if (!channel) {
      throw new Error('RabbitMQ channel is not available');
    }

    // Fail fast: a broker that is down at boot should abort bootstrap (and be
    // caught by main.ts) instead of hanging forever without exposing /health.
    await withTimeout(channel.waitForConnect(), CONNECT_TIMEOUT_MS, 'RabbitMQ connect');
  }

  private async setupTopology(channel: ConfirmChannel): Promise<void> {
    const exchange = this.config.get('rabbitmqExchange', { infer: true });
    const dlx = this.config.get('rabbitmqDlxExchange', { infer: true });
    const queue = this.config.get('rabbitmqQueue', { infer: true });
    const dlq = `${queue}.dlq`;

    // Topic exchange: the routing key is the event type, and bindings act as
    // subscriptions — publishers never know who consumes. durable = topology
    // survives a broker restart (messages too, via `persistent` on publish).
    await channel.assertExchange(exchange, 'topic', { durable: true });
    await channel.assertExchange(dlx, 'direct', { durable: true });
    await channel.assertQueue(dlq, { durable: true });
    await channel.bindQueue(dlq, dlx, queue);
    await channel.assertQueue(queue, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': dlx,
        'x-dead-letter-routing-key': queue,
      },
    });
    // Bind only the event types this service handles — a `#` binding would
    // deliver every event in the ecosystem just to be acked and dropped.
    // Handlers are registered in onModuleInit, before connect() runs.
    for (const eventType of this.handlers.keys()) {
      await channel.bindQueue(queue, exchange, eventType);
    }
    // prefetch(1): the broker sends one unacked message at a time per consumer.
    // Slower than batching, but a crash loses at most one in-flight message and
    // work spreads evenly across replicas. Raise it if throughput demands.
    await channel.prefetch(1);
  }

  private async startConsumer(): Promise<void> {
    if (this.handlers.size === 0) {
      this.logger.warn('Consumer mode enabled but no handlers registered');
      return;
    }

    const channel = this.channel;
    if (!channel) {
      throw new Error('RabbitMQ channel is not available');
    }

    const queue = this.config.get('rabbitmqQueue', { infer: true });
    const { consumerTag } = await channel.consume(queue, (message) => this.handleMessage(message), {
      noAck: false,
    });
    this.consumerTag = consumerTag;
    this.logger.log(`Consuming queue ${queue} (${this.handlers.size} handler(s))`);
  }

  private async handleMessage(message: ConsumeMessage | null): Promise<void> {
    if (!message || !this.channel) return;

    let dedupeKey: string | undefined;
    try {
      const event = this.parseEvent(message);
      const handler = this.handlers.get(event.type);
      if (!handler) {
        this.logger.warn(`No handler for event type ${event.type}`);
        this.channel.ack(message);
        return;
      }

      // Idempotency: RabbitMQ delivers *at least once* — redeliveries happen on
      // consumer crash, network blips, or manual DLQ replays. Atomically claim
      // this eventId BEFORE running the handler (SET NX, 24h TTL) so processing
      // happens at most once; concurrent replicas cannot both win the claim.
      dedupeKey = `event:processed:${event.eventId}`;
      const claimed = await this.redis.setNx(dedupeKey, '1', 86400);
      if (!claimed) {
        this.logger.debug(`Skipping duplicate event ${event.eventId}`);
        this.channel.ack(message);
        return;
      }

      await CorrelationContext.runAsync(
        CorrelationContext.resolve(
          event.correlationId ?? message.properties?.correlationId?.toString(),
        ),
        async () => {
          await handler(event);
        },
      );
      this.channel.ack(message);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to process message: ${err.message}`, err.stack);
      // Release the claim so a redelivery/manual DLQ replay can process it.
      if (dedupeKey) {
        await this.redis.del(dedupeKey).catch(() => undefined);
      }
      // nack without requeue → message goes to DLQ via x-dead-letter-exchange.
      this.channel.nack(message, false, false);
    }
  }

  private parseEvent(message: ConsumeMessage): HypatiaEvent {
    const result = hypatiaEventSchema.safeParse(JSON.parse(message.content.toString()));
    if (!result.success) {
      throw new Error('Invalid HypatiaEvent envelope');
    }

    return result.data as HypatiaEvent;
  }
}
