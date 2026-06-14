# Agent guide — <!-- TODO: nome do projeto -->

Referência para assistentes de IA — NestJS.

## Stack

- **Framework:** NestJS
- **ORM:** <!-- TODO: Prisma | TypeORM | Drizzle -->
- **Validation:** class-validator + class-transformer (DTOs)
- **Tests:** <!-- TODO: Jest | Vitest -->

## Where to put code

| Concern | Location |
|---------|----------|
| HTTP controllers | `src/**/**.controller.ts` |
| DTOs | junto ao módulo ou `dto/` |
| Business logic | `src/**/**.service.ts` |
| Modules | `src/**/**.module.ts` |
| Prisma / DB | <!-- TODO: `prisma/schema.prisma`, `src/prisma/` --> |
| Cross-cutting | `src/common/` (filters, guards, pipes) |

Controllers magros: validação via DTO, delegar ao service. Sem regra de negócio pesada no controller.

## Conventions

- Um módulo por bounded context quando possível.
- Erros de domínio com código estável; mapear HTTP no exception filter global.
- Conventional Commits.

## Useful scripts

```bash
npm run start:dev
npm run build
npm run lint
npm run test
npx prisma migrate dev    # se Prisma
```

## Onboarding

<!-- TODO: README ou docs/onboarding -->

## Cursor

Rules: `nestjs-patterns`, `typescript-node` · Command: `/review-nest-patterns` · [.cursor/PORTABILITY.md](.cursor/PORTABILITY.md)
