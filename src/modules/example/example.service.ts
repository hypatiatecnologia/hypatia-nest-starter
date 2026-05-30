import { Injectable } from '@nestjs/common';
import { RabbitMqService } from '../../rabbitmq/rabbitmq.service';

/**
 * Api archetype sample — business logic publishes domain events.
 *
 * Keep HTTP thin: controller validates input, service owns the use case.
 * Inject RabbitMqService to emit events after a successful transaction.
 */
@Injectable()
export class ExampleService {
  constructor(private readonly rabbitmq: RabbitMqService) {}

  async publishEvent(type: string, payload: Record<string, unknown>, correlationId?: string) {
    await this.rabbitmq.publish(type, payload, correlationId);
    return { published: true, type };
  }
}
