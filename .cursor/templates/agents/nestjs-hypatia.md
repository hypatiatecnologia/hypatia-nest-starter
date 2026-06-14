# Agent guide — <!-- TODO: nome do serviço Hypatia -->

Referência para assistentes de IA — microserviço NestJS (ecossistema Pantheon/Hypatia).

## Stack

- **Framework:** NestJS (starter `hypatia-nest-starter` ou derivado)
- **ORM:** Prisma
- **Mensageria:** RabbitMQ (exchange `hypatia.events`)
- **Cache / locks:** <!-- TODO: Redis se Athena/Midas -->
- **Tests:** Jest

## Where to put code

| Concern | Location |
|---------|----------|
| Bootstrap | `src/main.ts`, `src/app.module.ts` |
| HTTP API | `src/**/**.controller.ts` |
| Consumers / workers | <!-- TODO: `src/rabbitmq/`, módulos worker --> |
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

<!-- TODO: docs/onboarding/PRIMEIROS-PASSOS.md, TROUBLESHOOTING.md -->

## Cursor

Rules: `nestjs-patterns`, `hypatia-ecosystem` (picker) · `/review-nest-patterns`, `/onboard` · [.cursor/PORTABILITY.md](.cursor/PORTABILITY.md)
