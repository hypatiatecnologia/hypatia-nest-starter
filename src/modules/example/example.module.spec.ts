import { AppConfig } from '../../config/configuration';
import { ExampleController } from './example.controller';
import { ExampleEventConsumer } from './example-event.consumer';
import { ExampleModule } from './example.module';
import { ExampleService } from './example.service';

const baseConfig: AppConfig = {
  port: 3000,
  nodeEnv: 'test',
  serviceName: 'hypatia-test',
  databaseUrl: 'postgresql://hypatia:hypatia@localhost:5432/hypatia',
  redisUrl: 'redis://localhost:6379',
  rabbitmqUrl: 'amqp://guest:guest@localhost:5672',
  rabbitmqMode: 'off',
  rabbitmqExchange: 'hypatia.events',
  rabbitmqDlxExchange: 'hypatia.events.dlx',
  rabbitmqQueue: 'hypatia-test.events',
};

describe('ExampleModule', () => {
  it('registers api providers outside consumer mode', () => {
    const module = ExampleModule.register({ ...baseConfig, rabbitmqMode: 'publisher' });

    expect(module.controllers).toEqual([ExampleController]);
    expect(module.providers).toEqual([ExampleService]);
  });

  it('registers only queue handlers in consumer mode', () => {
    const module = ExampleModule.register({ ...baseConfig, rabbitmqMode: 'consumer' });

    expect(module.controllers).toEqual([]);
    expect(module.providers).toEqual([ExampleEventConsumer]);
  });
});
