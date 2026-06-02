import { mkdtemp, rm, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { DynamicModule, Module } from '@nestjs/common';
import { AppConfig } from '../../config/configuration';
import { discoverFeatureModules } from './module-discovery';

const appConfig: AppConfig = {
  port: 3000,
  nodeEnv: 'test',
  serviceName: 'hypatia-test',
  databaseUrl: 'postgresql://hypatia:hypatia@localhost:5432/hypatia',
  redisUrl: 'redis://localhost:6379',
  rabbitmqUrl: 'amqp://guest:guest@localhost:5672',
  rabbitmqMode: 'consumer',
  rabbitmqExchange: 'hypatia.events',
  rabbitmqDlxExchange: 'hypatia.events.dlx',
  rabbitmqQueue: 'hypatia-test.events',
};

describe('discoverFeatureModules', () => {
  let rootDir: string;

  beforeEach(async () => {
    rootDir = await mkdtemp(join(tmpdir(), 'hypatia-module-discovery-'));
  });

  afterEach(async () => {
    await rm(rootDir, { recursive: true, force: true });
  });

  async function writeFeatureModule(feature: string): Promise<void> {
    const featureDir = join(rootDir, 'modules', feature);
    await mkdir(featureDir, { recursive: true });
    await writeFile(join(featureDir, `${feature}.module.js`), '');
  }

  it('loads modules by the expected PascalCase export name', async () => {
    @Module({ providers: [] })
    class OrdersModule {}

    await writeFeatureModule('orders');

    const modules = await discoverFeatureModules({
      rootDir,
      requireFromPath: () => ({ helper: () => undefined, OrdersModule }),
    });

    expect(modules).toHaveLength(1);
    expect((modules[0] as { name: string }).name).toBe('OrdersModule');
  });

  it('passes app config to dynamic feature modules', async () => {
    @Module({ providers: [] })
    class BillingModule {
      static register(config: AppConfig): DynamicModule {
        return {
          module: BillingModule,
          providers: [{ provide: 'RABBITMQ_MODE', useValue: config.rabbitmqMode }],
        };
      }
    }

    await writeFeatureModule('billing');

    const modules = await discoverFeatureModules({
      rootDir,
      appConfig,
      requireFromPath: () => ({ BillingModule }),
    });
    const [billingModule] = modules as DynamicModule[];

    expect(billingModule.providers).toEqual([{ provide: 'RABBITMQ_MODE', useValue: 'consumer' }]);
  });

  it('rejects files without the expected Nest module export', async () => {
    class NotOrdersModule {}

    await writeFeatureModule('orders');

    await expect(
      discoverFeatureModules({
        rootDir,
        requireFromPath: () => ({ NotOrdersModule }),
      }),
    ).rejects.toThrow('must export a NestJS module named OrdersModule');
  });
});
