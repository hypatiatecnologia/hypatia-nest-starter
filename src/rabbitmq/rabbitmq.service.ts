import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqpConnectionManager, {
  AmqpConnectionManager,
  ChannelWrapper,
} from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { randomUUID } from 'crypto';
import { AppConfig } from '../config/configuration';
import { CorrelationContext } from '../common/correlation/correlation.context';
import { RedisService } from '../redis/redis.service';
import { HypatiaEvent, EventHandler } from './rabbitmq.types';

/**
 * RabbitMQ client for the Hypatia ecosystem.
 *
 * Topology (created automatically on connect):
 *   hypatia.events          — topic exchange (routing key = event type)
 *   hypatia.events.dlx      — dead-letter exchange
 *   {RABBITMQ_QUEUE}        — service queue, bound to `#`
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
 * Management UI (local dev): http://localhost:15672 (guest/guest)
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

    await this.channel.publish(exchange, type, body, {
      persistent: true,
      contentType: 'application/json',
      messageId: event.eventId,
      correlationId: event.correlationId,
    });
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

    await channel.waitForConnect();
  }

  private async setupTopology(channel: ConfirmChannel): Promise<void> {
    const exchange = this.config.get('rabbitmqExchange', { infer: true });
    const dlx = this.config.get('rabbitmqDlxExchange', { infer: true });
    const queue = this.config.get('rabbitmqQueue', { infer: true });
    const dlq = `${queue}.dlq`;

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
    // `#` binds all event types; filter by handler map in handleMessage.
    await channel.bindQueue(queue, exchange, '#');
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
    const { consumerTag } = await channel.consume(
      queue,
      (message) => this.handleMessage(message),
      { noAck: false },
    );
    this.consumerTag = consumerTag;
    this.logger.log(`Consuming queue ${queue} (${this.handlers.size} handler(s))`);
  }

  private async handleMessage(message: ConsumeMessage | null): Promise<void> {
    if (!message || !this.channel) return;

    try {
      const event = JSON.parse(message.content.toString()) as HypatiaEvent;
      const handler = this.handlers.get(event.type);
      if (!handler) {
        this.logger.warn(`No handler for event type ${event.type}`);
        this.channel.ack(message);
        return;
      }

      // Idempotency: skip if this eventId was already processed (24h TTL).
      const dedupeKey = `event:processed:${event.eventId}`;
      const alreadyProcessed = await this.redis.exists(dedupeKey);
      if (alreadyProcessed) {
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
      await this.redis.set(dedupeKey, '1', 86400);
      this.channel.ack(message);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown';
      this.logger.error(`Failed to process message: ${reason}`);
      // nack without requeue → message goes to DLQ via x-dead-letter-exchange.
      this.channel.nack(message, false, false);
    }
  }
}
