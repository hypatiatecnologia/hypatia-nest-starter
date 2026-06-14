# Agent guide — <!-- TODO: nome do projeto -->

Referência para assistentes de IA — Next.js.

## Stack

- **Framework:** Next.js <!-- TODO: App Router | Pages Router -->
- **Runtime:** <!-- TODO: Node / Edge onde aplicável -->
- **Data:** <!-- TODO: fetch, tRPC, Prisma, etc. -->
- **Validation:** <!-- TODO: Zod -->
- **UI:** <!-- TODO: Tailwind, shadcn, etc. -->
- **Tests:** <!-- TODO: Vitest, Jest, Playwright -->

## Where to put code

| Concern | Location |
|---------|----------|
| Routes / pages | <!-- TODO: `app/` (App Router) ou `pages/` --> |
| Route handlers / API | <!-- TODO: `app/api/` --> |
| Server Actions | <!-- TODO: colocated ou `src/actions/` --> |
| Domain / services | <!-- TODO: `src/features/` ou `src/server/` --> |
| Shared UI | <!-- TODO: `components/` --> |
| Client components | <!-- TODO: sufixo ou pasta `components/client/` --> |
| DB / ORM | <!-- TODO: `prisma/`, `src/db/` --> |

**Não misturar** padrões Remix (loaders/actions em `app/routes/`) neste repo.

## Conventions

- Validar body/query com Zod (ou equivalente) na borda da rota/action.
- Preferir Server Components; `"use client"` só quando necessário.
- Conventional Commits.

## Useful scripts

```bash
npm run dev
npm run build
npm run lint
npm run test
```

## Onboarding

<!-- TODO: README ou docs de setup -->

## Cursor

Rules: `typescript-react`, `typescript` · Commands: `/create-component`, `/audit-ui` · [.cursor/PORTABILITY.md](.cursor/PORTABILITY.md)
