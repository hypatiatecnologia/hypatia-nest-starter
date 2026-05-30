# Guia rápido — Hypatia Nest Starter

Referência diária para quem já configurou o ambiente. Setup inicial: [README](../../README.md).

## Comandos essenciais

```bash
# Desenvolvimento
npm run start:dev          # servidor com watch
npm run build              # compilar TypeScript
npm run start:prod         # produção (dist/main.js)

# Banco
npx prisma migrate deploy  # aplicar migrações (prod/CI)
npm run prisma:migrate     # criar migração (dev)

# Qualidade
npm run lint               # ESLint com fix
npm run lint:ci            # ESLint sem fix (CI)
npm run type-check         # tsc --noEmit
npm test                   # Jest
npm run test:cov           # cobertura
npm run test:ci            # testes relacionados aos arquivos alterados

# Infra local
docker compose up -d postgres redis rabbitmq
docker compose up --build  # stack completa + API

# Novo serviço Pantheon
npm run create-service -- athena-core api
npm run create-service -- hermes-worker worker
```

## URLs locais

| Recurso | URL |
| --- | --- |
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/docs/api |
| Health | http://localhost:3000/health |
| RabbitMQ UI | http://localhost:15672 (guest/guest) |

## Archetypes

| Modo | Env | HTTP | RabbitMQ |
| --- | --- | --- | --- |
| API | `RABBITMQ_MODE=publisher` | REST + Swagger | publica eventos |
| Worker | `RABBITMQ_MODE=consumer` | só `/health` | consome fila |
| Off | `RABBITMQ_MODE=off` | REST | desligado |

Copie preset: `cp archetypes/api.env.example .env`

## Criar um novo módulo de feature

```text
src/modules/orders/
├── orders.module.ts
├── orders.controller.ts      # api only
├── orders.service.ts
├── orders-event.consumer.ts  # worker only
└── dto/
    └── create-order.dto.ts
```

### 1. Service

```typescript
@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitmq: RabbitMqService,
  ) {}

  async create(dto: CreateOrderDto) {
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({ data: dto });
      await this.rabbitmq.publish('order.created', { orderId: created.id });
      return created;
    });
    return order;
  }
}
```

### 2. Controller (api)

```typescript
@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto);
  }
}
```

### 3. Consumer (worker)

```typescript
@Injectable()
export class OrdersEventConsumer implements OnModuleInit {
  constructor(private readonly rabbitmq: RabbitMqService) {}

  onModuleInit() {
    this.rabbitmq.registerHandler('order.created', (event) => this.handle(event));
  }

  private async handle(event: HypatiaEvent<{ orderId: string }>) {
    // idempotente — dedupe por eventId no RabbitMqService
  }
}
```

### 4. Module

```typescript
@Module({
  imports: [RabbitMqModule],
  controllers: process.env.RABBITMQ_MODE === 'consumer' ? [] : [OrdersController],
  providers: [
    OrdersService,
    ...(process.env.RABBITMQ_MODE === 'consumer' ? [OrdersEventConsumer] : []),
  ],
})
export class OrdersModule {}
```

Registre em `AppModule` e remova `ExampleModule` quando pronto.

## Publicar evento de teste

```bash
curl -X POST http://localhost:3000/example/events \
  -H 'Content-Type: application/json' \
  -H 'x-correlation-id: guia-rapido-1' \
  -d '{"type":"example.created","payload":{"message":"hello"}}'
```

## Integração HTTP outbound

Use `HttpClientService` para chamar APIs externas (Midas, Hades, Argus) com `x-correlation-id` automático:

```typescript
constructor(private readonly http: HttpClientService) {}

await this.http.get<{ id: string }>('https://api.example/v1/resource');
```

Ver `src/http/http-client.service.ts`.

## Cursor commands úteis

| Command | Uso |
| --- | --- |
| `/onboard` | setup e diagnóstico |
| `/review-nest-patterns` | revisão de módulo |
| `/commit` | mensagem de commit |
| `/pr` | abrir pull request |
