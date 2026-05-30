# Hypatia Nest Starter

Boilerplate for Hypatia microservices: **NestJS 10**, **PostgreSQL** (Prisma), **Redis**, and **RabbitMQ** (optional publisher or consumer).

Extracted from the [data-vault](https://github.com/hypatia/data-vault) (Hades) infrastructure patterns. Use this repo to bootstrap new Pantheon services — not as a fork of the LGPD vault.

## Archetypes

| Archetype | `RABBITMQ_MODE` | HTTP | Use case |
| --- | --- | --- | --- |
| **api** | `publisher` | Full REST + Swagger | Athena, Midas, Nemesis |
| **worker** | `consumer` | Health only | Hermes |
| **off** | `off` | Full REST | Services without messaging (early Hades) |

See `archetypes/api.env.example` and `archetypes/worker.env.example`.

## Codebase tour

Source files include onboarding comments — start with:

| File | What you learn |
| --- | --- |
| `src/main.ts` | Bootstrap, security, Swagger |
| `src/app.module.ts` | Module layout and infra wiring |
| `src/config/configuration.ts` | Env vars and `RABBITMQ_MODE` |
| `src/rabbitmq/rabbitmq.service.ts` | Event envelope, publish/consume, DLQ |
| `src/modules/example/` | Api vs worker patterns (delete when done) |

## Quick start

```bash
cp .env.example .env
docker compose up -d postgres redis rabbitmq
npm install
npx prisma migrate deploy
npm run start:dev
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/docs/api
- Health: http://localhost:3000/health
- RabbitMQ UI: http://localhost:15672 (guest/guest)

## Create a new service

```bash
npm run create-service -- athena-core api
# or
npm run create-service -- hermes-worker worker
```

This copies the starter to `../<service-name>`, applies the archetype env, and initializes git.

## RabbitMQ conventions

- **Exchange:** `hypatia.events` (topic)
- **DLX:** `hypatia.events.dlx` (direct) + `{queue}.dlq`
- **Envelope:**

```json
{
  "eventId": "uuid",
  "type": "order.created",
  "occurredAt": "ISO-8601",
  "correlationId": "optional",
  "payload": {}
}
```

### Publisher (api)

```typescript
await this.rabbitmq.publish('order.created', { orderId: '...' }, correlationId);
```

### Consumer (worker)

Register handlers in `onModuleInit` before the app bootstraps consumers:

```typescript
this.rabbitmq.registerHandler('order.created', async (event) => {
  // idempotent handler — dedupe via Redis eventId
});
```

## Example flow (api → worker)

**Terminal 1 — worker:**

```bash
cp archetypes/worker.env.example .env
npm run start:dev
```

**Terminal 2 — api:**

```bash
curl -X POST http://localhost:3000/example/events \
  -H 'Content-Type: application/json' \
  -d '{"type":"example.created","payload":{"message":"hello"}}'
```

## Project layout

```
src/
├── config/           # Typed env (fail-fast)
├── prisma/           # PostgreSQL
├── redis/            # Cache, locks, event dedupe
├── rabbitmq/         # Publisher + consumer + DLQ
└── modules/example/  # Sample api endpoint or worker handler
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run start:dev` | Dev server with watch |
| `npm run create-service` | Scaffold new repo from starter |
| `npm run prisma:migrate` | Create migration (dev) |
| `npm run lint:ci` | ESLint |
| `npm test` | Unit tests |

## Docker (full stack)

```bash
docker compose up --build
```

Runs postgres, redis, rabbitmq, migrate, and the API container.

## Related repos

| Pantheon service | Repo | Starter archetype |
| --- | --- | --- |
| Hades | `data-vault` / `hades-vault` | Product — not this template |
| Athena | `athena-core` | `api` |
| Midas | `midas-payment` | `api` |
| Hermes | `hermes-worker` | `worker` |
| Argus | `argus-auth` | `api` (custom auth module) |
| Nemesis | `nemesis-antifraud` | `api` |

## License

MIT
