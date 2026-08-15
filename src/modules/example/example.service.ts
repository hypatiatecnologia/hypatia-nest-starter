import { Injectable, Logger } from '@nestjs/common';
import { CorrelationContext } from '../../common/correlation/correlation.context';
import { redactPayload } from '../../common/logging/redact-payload';
import { RabbitMqService } from '../../rabbitmq/rabbitmq.service';
import { HypatiaEvent } from '../../rabbitmq/rabbitmq.types';
import { ExampleEventPayloadDto } from './dto/publish-example-event.dto';

/**
 * Shared by api and worker archetypes.
 *
 * Api: publish after a successful use case. `published` is false when
 * RABBITMQ_MODE=off — do not report a broker write that did not happen.
 * Worker: handle consumed events here so the consumer stays a thin adapter.
 */
@Injectable()
export class ExampleService {
  private readonly logger = new Logger(ExampleService.name);

  constructor(private readonly rabbitmq: RabbitMqService) {}

  async publishEvent(type: string, payload: ExampleEventPayloadDto) {
    const published = this.rabbitmq.isEnabled();
    if (published) {
      await this.rabbitmq.publish(type, payload);
    }
    return { published, type, correlationId: CorrelationContext.get() };
  }

  async handleExampleCreated(event: HypatiaEvent): Promise<void> {
    const payload = redactEventPayload(event.payload);
    this.logger.log(
      `Received ${event.type} (${event.eventId}) correlationId=${CorrelationContext.get()} payload=${JSON.stringify(payload)}`,
    );
  }
}

function redactEventPayload(payload: unknown): Record<string, unknown> {
  if (payload !== null && typeof payload === 'object' && !Array.isArray(payload)) {
    return redactPayload(payload as Record<string, unknown>);
  }
  return {};
}
