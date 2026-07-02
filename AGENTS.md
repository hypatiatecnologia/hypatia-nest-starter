# Agent guide — hypatia-nest-starter

Referência para assistentes de IA — microserviço NestJS (ecossistema Pantheon/Hypatia).

## Stack

- **Framework:** NestJS (starter `hypatia-nest-starter` ou derivado)
- **ORM:** Prisma
- **Mensageria:** RabbitMQ (exchange `hypatia.events`)
- **Cache / locks:** Redis (ioredis)
- **Tests:** Jest

## Where to put code

| Concern | Location |
|---------|----------|
| Bootstrap | `src/main.ts`, `src/app.module.ts` |
| HTTP API | `src/**/**.controller.ts` |
| Consumers / workers | `src/modules/<feature>/*-event.consumer.ts` (infra em `src/rabbitmq/`) |
| Domain services | `src/**/**.service.ts` |
| Prisma | `prisma/schema.prisma` |

**PII:** apenas no Hades — outros serviços referenciam IDs/vault, não armazenam dados sensíveis em claro.

## Conventions

- REST síncrono entre serviços; eventos assíncronos via RabbitMQ.
- Ativar rule `hypatia-ecosystem` no picker quando relevante.
- Conventional Commits.

## Useful scripts

```bash
npm run start:dev
npm run setup:local      # se existir no starter
npx prisma generate && npx prisma migrate deploy
docker compose up -d --wait postgres redis rabbitmq   # infra híbrida
```

## Onboarding

- [Onboarding](docs/onboarding/ONBOARDING.md)
- [Primeiros Passos](docs/onboarding/PRIMEIROS-PASSOS.md)
- [Troubleshooting](docs/onboarding/TROUBLESHOOTING.md)

## Cursor

Rules: `nestjs-patterns`, `hypatia-ecosystem` (picker) · `/review-nest-patterns`, `/onboard` · [.cursor/PORTABILITY.md](.cursor/PORTABILITY.md)
