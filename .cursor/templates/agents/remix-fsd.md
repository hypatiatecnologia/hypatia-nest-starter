# Agent guide — <!-- TODO: nome do projeto -->

Referência para assistentes de IA — React Router v7 / Remix + Feature-Sliced Design.

## Stack

- **Framework:** React Router v7 / Remix (Vite)
- **Auth / DB:** <!-- TODO: ex. Supabase SSR + Drizzle ORM -->
- **Validation:** Zod
- **UI:** <!-- TODO: ex. shadcn/ui + Tailwind CSS -->
- **Tests:** <!-- TODO: ex. Vitest + Testing Library -->

## Where to put code

| Concern | Location |
|---------|----------|
| Routes (loaders, actions) | `app/routes/` |
| Domain logic | `src/features/[domain]/` |
| Zod schemas | `src/features/[domain]/schemas.ts` |
| Mutations / side effects | `src/features/[domain]/actions.ts` |
| Read queries | `src/features/[domain]/queries.ts` |
| Feature UI | `src/features/[domain]/components/` |
| Shared UI | <!-- TODO: ex. `app/components/ui/` --> |
| DB schema & client | <!-- TODO: ex. `src/db/` --> |
| Env validation | <!-- TODO: ex. `src/env.ts` --> |
| API errors (RFC 7807) | <!-- TODO: ex. `src/lib/errors/` --> |

Rotas magras: validar, delegar para `src/features/`, retornar `data` ou `redirect`. Autodiscovery via `flatRoutes()` em `app/routes.ts` — novos arquivos em `app/routes/`, sem registro manual.

**Não usar** Server Actions do Next.js (`"use server"`, `next/*`).

## Conventions

- Zod no cliente e no servidor.
- Remix `<Form>`, loaders e actions — não `fetch` manual no submit quando `<Form>` bastar.
- Conventional Commits; <!-- TODO: Husky/commitlint se aplicável -->

## Useful scripts

```bash
npm run dev          # TODO: ajustar ao package.json
npm run lint
npm run typecheck
npm run test:run
# npm run db:generate   # se Drizzle/Prisma
```

## Onboarding

<!-- TODO: docs/onboarding/PRIMEIROS-PASSOS.md ou README -->

## Cursor

Rules: `remix-fsd`, `typescript-react` · Commands: `/create-component`, `/migrate`, `/onboard` · [.cursor/PORTABILITY.md](.cursor/PORTABILITY.md)
