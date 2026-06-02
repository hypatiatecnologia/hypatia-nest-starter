import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { correlationMiddleware } from '../src/common/correlation/correlation.middleware';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { RabbitMqService } from '../src/rabbitmq/rabbitmq.service';

describe('App (e2e)', () => {
  let app: INestApplication;
  let rabbitmq: { publish: jest.Mock; isEnabled: jest.Mock; checkConnection: jest.Mock };

  beforeAll(async () => {
    rabbitmq = {
      publish: jest.fn().mockResolvedValue(undefined),
      isEnabled: jest.fn().mockReturnValue(false),
      checkConnection: jest.fn().mockReturnValue(false),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [await AppModule.register()],
    })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) })
      .overrideProvider(RedisService)
      .useValue({
        get: jest.fn().mockResolvedValue('1'),
        set: jest.fn().mockResolvedValue(undefined),
        exists: jest.fn().mockResolvedValue(false),
        del: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(RabbitMqService)
      .useValue({
        ...rabbitmq,
        onApplicationBootstrap: jest.fn().mockResolvedValue(undefined),
        onModuleDestroy: jest.fn().mockResolvedValue(undefined),
        registerHandler: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(correlationMiddleware);
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns ok', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body.checks.postgres).toBe('ok');
    expect(response.body.checks.redis).toBe('ok');
    expect(response.body.checks.rabbitmq).toBe('disabled');
  });

  it('GET /health echoes x-correlation-id', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .set('x-correlation-id', 'e2e-health-trace')
      .expect(200);

    expect(response.headers['x-correlation-id']).toBe('e2e-health-trace');
  });

  it('POST /example/events publishes domain event', async () => {
    rabbitmq.isEnabled.mockReturnValue(true);

    const response = await request(app.getHttpServer())
      .post('/example/events')
      .set('x-correlation-id', 'e2e-example-trace')
      .send({ type: 'example.created', payload: { message: 'hello' } })
      .expect(201);

    expect(response.body.published).toBe(true);
    expect(response.body.type).toBe('example.created');
    expect(response.body.correlationId).toBe('e2e-example-trace');
    expect(rabbitmq.publish).toHaveBeenCalledWith('example.created', { message: 'hello' });
  });

  it('POST /example/events rejects invalid payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/example/events')
      .send({ type: 'example.created', payload: 'not-an-object', extra: true })
      .expect(400);

    expect(response.body.code).toBe('invalid_input');
  });
});
