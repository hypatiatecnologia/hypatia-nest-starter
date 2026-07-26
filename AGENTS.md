# Agent guide — Hypatia Nest Starter

Repository guidance for assistants working on this NestJS template.

## Stack

- Node.js 22 and NestJS 11
- Prisma with PostgreSQL
- Redis through ioredis
- RabbitMQ using the `hypatia.events` exchange
- Jest for application tests and Node's test runner for shell-script contracts

## Architecture

| Concern | Location |
| --- | --- |
| Bootstrap | `src/main.ts`, `src/app.module.ts` |
| HTTP adapters | `src/**/*.controller.ts` |
| Event consumers | `src/modules/<feature>/*-event.consumer.ts` |
| Application services | `src/**/*.service.ts` |
| Shared adapters | `src/http/`, `src/redis/`, `src/rabbitmq/` |
| Persistence | `prisma/schema.prisma` |

Keep domain behavior out of controllers. Validate external input at the boundary, propagate correlation IDs, redact sensitive fields before logging, and keep example credentials unsuitable for deployment.

## Runtime modes

- `publisher`: REST API that publishes events
- `consumer`: worker with health endpoints
- `off`: REST API without RabbitMQ

Use generic names such as `gateway`, `api`, and `worker` in public examples. Do not introduce organization topology, operational details, real personal data, or secrets.

## Verification

```bash
npm run lint:ci
npm run type-check
npm test -- --runInBand
npm run test:scripts
npm run build
```

Use Conventional Commits. Do not edit accepted ADRs to retrofit a new decision; create a new ADR or spec when the contract changes.

## Onboarding

- [Onboarding](docs/onboarding/ONBOARDING.md)
- [First steps](docs/onboarding/PRIMEIROS-PASSOS.md)
- [Troubleshooting](docs/onboarding/TROUBLESHOOTING.md)
