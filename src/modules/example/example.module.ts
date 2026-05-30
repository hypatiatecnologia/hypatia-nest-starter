import { Module } from '@nestjs/common';
import { ExampleController } from './example.controller';
import { ExampleService } from './example.service';
import { ExampleEventConsumer } from './example-event.consumer';

/**
 * Sample feature module — demonstrates api vs worker archetypes.
 *
 * DELETE this module when bootstrapping a real service:
 *   1. Remove ExampleModule from app.module.ts
 *   2. Delete src/modules/example/
 *   3. Create your module: src/modules/<feature>/
 *
 * Module shape convention:
 *   <feature>.module.ts
 *   <feature>.controller.ts   (api only)
 *   <feature>.service.ts
 *   dto/*.dto.ts
 */
const isConsumer = process.env.RABBITMQ_MODE === 'consumer';

@Module({
  // Worker archetype: no HTTP controllers — only queue handlers + /health.
  controllers: isConsumer ? [] : [ExampleController],
  providers: isConsumer ? [ExampleEventConsumer] : [ExampleService],
})
export class ExampleModule {}
