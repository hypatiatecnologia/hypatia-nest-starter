import { Injectable, OnModuleInit } from '@nestjs/common';
import { RabbitMqService } from '../../rabbitmq/rabbitmq.service';
import { ExampleService } from './example.service';

/**
 * Worker archetype sample — registers queue handlers in onModuleInit.
 *
 * Handlers MUST be registered before RabbitMqService.onApplicationBootstrap()
 * starts consuming. onModuleInit runs earlier in the Nest lifecycle — use it.
 *
 * Test the full flow:
 *   1. Terminal A: RABBITMQ_MODE=consumer npm run start:dev
 *   2. Terminal B: RABBITMQ_MODE=publisher PORT=3001 npm run start:dev
 *   3. POST /example/events on terminal B → log appears in terminal A
 */
@Injectable()
export class ExampleEventConsumer implements OnModuleInit {
  constructor(
    private readonly rabbitmq: RabbitMqService,
    private readonly exampleService: ExampleService,
  ) {}

  onModuleInit(): void {
    this.rabbitmq.registerHandler('example.created', (event) =>
      this.exampleService.handleExampleCreated(event),
    );
  }
}
