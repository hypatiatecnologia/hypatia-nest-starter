import { Global, Module } from '@nestjs/common';
import { RabbitMqService } from './rabbitmq.service';

/**
 * Global RabbitMQ module.
 *
 * Behavior is controlled by RABBITMQ_MODE in `.env`:
 *   publisher — connect on bootstrap, expose publish()
 *   consumer  — connect + consume RABBITMQ_QUEUE (register handlers first)
 *   off       — no-op; publish() is silently skipped
 */
@Global()
@Module({
  providers: [RabbitMqService],
  exports: [RabbitMqService],
})
export class RabbitMqModule {}
