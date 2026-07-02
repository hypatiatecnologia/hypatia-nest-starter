import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { API_KEY_HEADER } from '../src/common/auth/auth.constants';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
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
        setNx: jest.fn().mockResolvedValue(true),
        exists: jest.fn().mockResolvedValue(false),
        del: jest.fn().mockResolvedValue(undefined),
        ping: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(RabbitMqService)
      .useValue({
        ...rabbitmq,
        onApplicationBootstrap: jest.fn().mockResolvedValue(undefined),
        onModuleDestroy: jest.fn().mockResolvedValue(undefined),
        registerHandler: jest.fn(),
      })
      .compile();

    app = configureApp(moduleFixture.createNestApplication());
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

  it('GET /health/live returns ok without dependency checks', async () => {
    const response = await request(app.getHttpServer()).get('/health/live').expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body.checks).toBeUndefined();
  });

  it('GET /health/ready reports dependency status', async () => {
    const response = await request(app.getHttpServer()).get('/health/ready').expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body.checks.postgres).toBe('ok');
  });

  it('GET /health echoes x-correlation-id', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .set('x-correlation-id', 'e2e-health-trace')
      .expect(200);

    expect(response.headers['x-correlation-id']).toBe('e2e-health-trace');
  });

  it('applies security headers and hides x-powered-by (helmet)', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('POST /example/events publishes domain event', async () => {
    rabbitmq.isEnabled.mockReturnValue(true);

    const response = await request(app.getHttpServer())
      .post('/example/events')
      .set(API_KEY_HEADER, 'test-internal-api-key')
      .set('x-correlation-id', 'e2e-example-trace')
      .send({ type: 'example.created', payload: { message: 'hello' } })
      .expect(201);

    expect(response.body.published).toBe(true);
    expect(response.body.type).toBe('example.created');
    expect(response.body.correlationId).toBe('e2e-example-trace');
    expect(rabbitmq.publish).toHaveBeenCalledWith('example.created', { message: 'hello' });
  });

  it('POST /example/events rejects unauthenticated requests — and rate limits them', async () => {
    const response = await request(app.getHttpServer())
      .post('/example/events')
      .send({ type: 'example.created', payload: { message: 'hello' } })
      .expect(401);

    // Throttler runs BEFORE auth: failed attempts must consume rate-limit quota,
    // otherwise credential brute force bypasses throttling entirely.
    expect(response.headers['x-ratelimit-limit']).toBeDefined();
  });

  it('POST /example/events rejects event types outside the allowlist', async () => {
    const response = await request(app.getHttpServer())
      .post('/example/events')
      .set(API_KEY_HEADER, 'test-internal-api-key')
      .send({ type: 'order.paid', payload: { forged: true } })
      .expect(400);

    expect(response.body.code).toBe('invalid_input');
  });

  it('POST /example/events rejects invalid payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/example/events')
      .set(API_KEY_HEADER, 'test-internal-api-key')
      .send({ type: 'example.created', payload: 'not-an-object', extra: true })
      .expect(400);

    expect(response.body.code).toBe('invalid_input');
  });
});
