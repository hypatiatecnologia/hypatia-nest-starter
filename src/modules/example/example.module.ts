import { DynamicModule, Module } from '@nestjs/common';
import { AppConfig } from '../../config/configuration';
import { ExampleController } from './example.controller';
import { ExampleService } from './example.service';
import { ExampleEventConsumer } from './example-event.consumer';

/**
 * Sample feature module — demonstrates api vs worker archetypes.
 *
 * DELETE this module when bootstrapping a real service:
 *   1. Delete src/modules/example/
 *   2. Create your module: src/modules/<feature>/<feature>.module.ts
 *      (auto-discovered at bootstrap — no AppModule edit needed)
 *
 * Module shape convention:
 *   <feature>.module.ts
 *   <feature>.controller.ts   (api only)
 *   <feature>.service.ts
 *   dto/*.dto.ts
 */
@Module({ providers: [] })
export class ExampleModule {
  static register(config: AppConfig): DynamicModule {
    const isConsumer = config.rabbitmqMode === 'consumer';

    return {
      module: ExampleModule,
      // Worker archetype: no HTTP controllers — only queue handlers + /health.
      controllers: isConsumer ? [] : [ExampleController],
      providers: isConsumer ? [ExampleEventConsumer] : [ExampleService],
    };
  }
}
