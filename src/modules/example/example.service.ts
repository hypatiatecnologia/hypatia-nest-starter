import { Injectable } from '@nestjs/common';
import { CorrelationContext } from '../../common/correlation/correlation.context';
import { RabbitMqService } from '../../rabbitmq/rabbitmq.service';

/**
 * Api archetype sample — business logic publishes domain events.
 *
 * Keep HTTP thin: controller validates input, service owns the use case.
 * Inject RabbitMqService to emit events after a successful transaction.
 * Correlation id flows automatically from CorrelationContext.
 */
@Injectable()
export class ExampleService {
  constructor(private readonly rabbitmq: RabbitMqService) {}

  async publishEvent(type: string, payload: Record<string, unknown>) {
    await this.rabbitmq.publish(type, payload);
    return { published: true, type, correlationId: CorrelationContext.get() };
  }
}
