# Hypatia Nest Starter

Boilerplate for Hypatia microservices: **NestJS 10**, **PostgreSQL** (Prisma), **Redis**, and **RabbitMQ** (optional publisher or consumer).

Extracted from [hades-vault](https://github.com/hypatia/data-vault) (Hades) infrastructure patterns. Use this repo to bootstrap new Pantheon services — not as a fork of the LGPD vault.

## Archetypes

| Archetype | `RABBITMQ_MODE` | HTTP | Use case |
| --- | --- | --- | --- |
| **api** | `publisher` | Full REST + Swagger | Athena, Midas, Nemesis |
| **worker** | `consumer` | Health only | Hermes |
| **off** | `off` | Full REST | Services without messaging (early Hades) |

See `archetypes/api.env.example` and `archetypes/worker.env.example`.

## Deployment strategies

This starter supports two topologies without changing the application code — only configuration and the number of running processes differ.

### Microservices (default Pantheon topology)

Each bounded context lives in its own repository and process, communicating via REST (sync) or RabbitMQ (async).

```
[Cerberus Gateway]
      │
      ├─ REST ──► [Argus / api]
      ├─ REST ──► [Athena / api]  ──publish──► hypatia.events ──► [Hermes / worker]
      └─ REST ──► [Midas  / api]
```

Scaffold a new service from this starter:

```bash
npm run create-service -- <service-name> [api|worker]
```

Each service gets its own Prisma schema, Redis namespace, RabbitMQ queue, and `.cursor/` config. Set `RABBITMQ_MODE` per archetype (`publisher` for api, `consumer` for worker).

### Modular monolith

All domain modules run inside a **single NestJS process and repository**. Communication between features happens via NestJS dependency injection instead of network calls.

**Minimum changes required:**

1. Set `RABBITMQ_MODE=off` in `.env` — no AMQP connection is established.
2. Add each feature module under `src/modules/<feature>/` as usual — auto-discovery picks them up automatically.
3. For cross-module calls, import the neighboring module in your feature's `@Module({ imports: [...] })` instead of publishing events.
4. If you need loose coupling between modules without HTTP/AMQP, use [`@nestjs/event-emitter`](https://docs.nestjs.com/techniques/events) for in-process events.

**What stays exactly the same:** module structure, Prisma, Redis, Correlation ID middleware, error handling, Swagger, and all Cursor rules.

**Extracting a module to a microservice later:**

Because each `src/modules/<feature>/` is already self-contained, extraction is surgical:

1. Move the folder to a new repo scaffolded with `create-service`.
2. Replace direct service imports with `HttpClientService` calls or RabbitMQ events.
3. Set `RABBITMQ_MODE` and infrastructure env vars in the new service.

## Onboarding (novos devs)

**First time?** Start with [docs/onboarding/PRIMEIROS-PASSOS.md](docs/onboarding/PRIMEIROS-PASSOS.md) (~10 min: tests without Docker, live API, `create-service` smoke check).

Structured learning path in Portuguese:

| Doc | Content |
| --- | --- |
| [docs/onboarding/PRIMEIROS-PASSOS.md](docs/onboarding/PRIMEIROS-PASSOS.md) | Minimal setup — starter + scaffold |
| [docs/onboarding/TROUBLESHOOTING.md](docs/onboarding/TROUBLESHOOTING.md) | Common setup errors |
| [docs/onboarding/ONBOARDING.md](docs/onboarding/ONBOARDING.md) | 4-week roadmap + hands-on exercises |
| [docs/onboarding/GUIA-RAPIDO.md](docs/onboarding/GUIA-RAPIDO.md) | Daily reference — commands, new module |
| [docs/onboarding/GLOSSARIO.md](docs/onboarding/GLOSSARIO.md) | Pantheon and NestJS glossary |
| [docs/onboarding/MAPA-MENTAL.md](docs/onboarding/MAPA-MENTAL.md) | Request → event flow diagrams |

Cursor command `/onboard` automates local setup; use both for first-time contributors.

## Codebase tour

Source files include onboarding comments — start with:

| File | What you learn |
| --- | --- |
| `src/main.ts` | Bootstrap, security, Swagger |
| `src/app.module.ts` | Infra wiring + auto-discovery of feature modules |
| `src/config/configuration.ts` | Env vars and `RABBITMQ_MODE` |
| `src/common/correlation/` | `x-correlation-id` middleware + AsyncLocalStorage |
| `src/rabbitmq/rabbitmq.service.ts` | Event envelope, publish/consume, DLQ |
| `src/modules/example/` | Api vs worker patterns (delete when done) |

## Cursor (IDE padrão Hypatia)

Abra o repo no **Cursor** — a config já vem em `.cursor/`:

| Recurso | Uso |
| --- | --- |
| `.cursor/rules/` | Rules de arquitetura, NestJS, segurança, Pantheon (`hypatia-ecosystem`) |
| `.cursor/commands/` | `/onboard`, `/commit`, `/pr`, `/review-nest-patterns`, `/explain`, … |
| `.cursor/hooks/` | Bloqueio de `rm -rf` perigoso e redaction de secrets no prompt |
| `.cursorignore` | Exclui `.env` e credenciais do contexto do agente |

Guia completo: [.cursor/README.md](.cursor/README.md) · Guardrails do Agent: [.cursor/AGENTS.md](.cursor/AGENTS.md)

Novos serviços criados com `create-service` **herdam** esta pasta automaticamente.

## Correlation ID

Every HTTP request gets a trace id via header **`x-correlation-id`**:

- Send your own id to correlate with upstream (Cerberus, client apps).
- When omitted, the service generates a UUID and echoes it on the response.
- Propagates to Pino logs (`correlationId`), error JSON, and RabbitMQ events.

```bash
curl -H 'x-correlation-id: checkout-abc' http://localhost:3000/health -v
```

Implementation: `src/common/correlation/` · wired in `main.ts` and `app.module.ts`.

## Prerequisites

| Tool | Version / notes |
| --- | --- |
| Node.js | 20 LTS — `nvm use` (see [.nvmrc](.nvmrc)) |
| Docker | Docker Compose v2 — Postgres, Redis, RabbitMQ for local dev |
| Ports free | 3000 (API), 5432, 6379, 5672, 15672 |

Quick validation without Docker: `npm ci && npm test` (see [PRIMEIROS-PASSOS.md](docs/onboarding/PRIMEIROS-PASSOS.md)).

## Quick start

Pick **one** path. Which `.env` to use:

| You run the API… | Copy this to `.env` |
| --- | --- |
| On your machine (`npm run start:dev`) | `archetypes/api.env.example` (`localhost` hostnames) |
| Inside Docker (`docker compose up --build`) | `.env.example` (`postgres` / `redis` / `rabbitmq` service names) |

Or run the hybrid setup script: `npm run setup:local` then `npm run start:dev`.

### Hybrid dev (recommended)

Infra in Docker, Nest on the host — matches day-to-day Pantheon development.

```bash
nvm use
cp archetypes/api.env.example .env
docker compose up -d --wait postgres redis rabbitmq
npm ci
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

Verify:

```bash
curl -s http://localhost:3000/health | head -c 200
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/docs/api
- Health: http://localhost:3000/health
- RabbitMQ UI: http://localhost:15672 (guest/guest)

Stuck? See [docs/onboarding/TROUBLESHOOTING.md](docs/onboarding/TROUBLESHOOTING.md).

### Full stack in Docker

No `npm run start:dev` on the host — the `api` service runs in a container.

```bash
cp .env.example .env
docker compose up --build
```

Same URLs as above once containers are healthy.

Optional: set `RABBITMQ_MODE=off` in `.env` if you only need Postgres + Redis for a first smoke test (RabbitMQ health shows `disabled`).

## Create a new service

```bash
npm run create-service -- athena-core api
# or
npm run create-service -- hermes-worker worker
```

This copies the starter to `../<service-name>`, applies the archetype env (localhost hostnames in `.env`), includes `.cursor/`, and initializes git. Then follow [PRIMEIROS-PASSOS.md — Trilha C](docs/onboarding/PRIMEIROS-PASSOS.md#trilha-c--validar-um-serviço-criado-com-create-service) in the new directory.

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

## Feature modules (auto-discovery)

Feature modules under `src/modules/<feature>/` are **registered automatically** at bootstrap — no manual import in `AppModule`.

Create a module following the convention:

```
src/modules/<feature>/<feature>.module.ts
```

Example: `src/modules/orders/orders.module.ts` exports `OrdersModule` and is picked up on the next start.

Shared infrastructure (`PrismaModule`, `RedisModule`, `RabbitMqModule`, `HttpClientModule`) stays wired explicitly in `AppModule.register()`. Only domain modules under `src/modules/` use discovery.

Implementation: `src/common/module-discovery/module-discovery.ts` · wired via `AppModule.register()` in `main.ts`.

## Project layout

```
src/
├── config/           # Typed env (fail-fast)
├── prisma/           # PostgreSQL
├── redis/            # Cache, locks, event dedupe
├── rabbitmq/         # Publisher + consumer + DLQ
├── common/
│   └── module-discovery/  # Auto-loads src/modules/*/*.module.ts
└── modules/
    └── <feature>/    # One folder per domain — auto-discovered at bootstrap
        └── <feature>.module.ts
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run setup:local` | Hybrid setup: api `.env`, infra up, `npm ci`, Prisma generate + migrate |
| `npm run start:dev` | Dev server with watch |
| `npm run create-service` | Scaffold new repo from starter |
| `npm run prisma:migrate` | Create migration (dev) |
| `npm run lint:ci` | ESLint |
| `npm test` | Unit + e2e tests |
| `npm run test:ci` | Related tests only (lint-staged / CI) |
| `npm run test:cov` | Tests with coverage report |

## Related repos

| Pantheon service | Repo | Starter archetype |
| --- | --- | --- |
| Hades | `hades-vault` | Product — not this template |
| Athena | `athena-core` | `api` |
| Midas | `midas-payment` | `api` |
| Hermes | `hermes-worker` | `worker` |
| Argus | `argus-auth` | `api` (custom auth module) |
| Nemesis | `nemesis-antifraud` | `api` |

## License

MIT
