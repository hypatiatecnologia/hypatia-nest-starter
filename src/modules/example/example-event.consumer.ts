import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMqService } from '../../rabbitmq/rabbitmq.service';
import { HypatiaEvent } from '../../rabbitmq/rabbitmq.types';

/**
 * Worker archetype sample — registers queue handlers in onModuleInit.
 *
 * Handlers MUST be registered before RabbitMqService.onApplicationBootstrap()
 * starts consuming. onModuleInit runs earlier in the Nest lifecycle — use it.
 *
 * Test the full flow:
 *   1. Terminal A: RABBITMQ_MODE=consumer npm run start:dev
 *   2. Terminal B: RABBITMQ_MODE=publisher npm run start:dev (port 3001)
 *   3. POST /example/events on terminal B → log appears in terminal A
 */
@Injectable()
export class ExampleEventConsumer implements OnModuleInit {
  private readonly logger = new Logger(ExampleEventConsumer.name);

  constructor(private readonly rabbitmq: RabbitMqService) {}

  onModuleInit(): void {
    this.rabbitmq.registerHandler('example.created', (event) => this.handleExampleCreated(event));
  }

  private async handleExampleCreated(event: HypatiaEvent): Promise<void> {
    this.logger.log(`Received ${event.type} (${event.eventId})`);
  }
}
