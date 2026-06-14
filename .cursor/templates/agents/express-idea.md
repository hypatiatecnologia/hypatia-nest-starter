# Agent guide — <!-- TODO: nome do projeto -->

Referência para assistentes de IA — Node Express (padrões Idea / company-patterns).

## Stack

- **Runtime:** Node.js + TypeScript
- **HTTP:** Express
- **Validation:** Yup (não substituir por Zod sem decisão explícita)
- **Patterns:** `IController`, `adaptRoute`, `validateRequest`

## Where to put code

| Concern | Location |
|---------|----------|
| Routes / handlers | <!-- TODO: `src/routes/`, `routes/handlers` --> |
| Controllers | adapters finos — delegar ao service |
| Services / use cases | `src/` por feature |
| HTTP infra | `infra/http/errors`, middleware global |
| Ports / providers | `ports/`, `providers/` |

Localizar equivalentes em `src/` antes de criar handler, cliente HTTP ou tipo de erro novo.

## Conventions

- Ativar rule `company-patterns` via picker no Cursor.
- Módulos sem banco (proxy/orquestração) não forçar esqueleto de repositório completo.
- Conventional Commits.

## Useful scripts

```bash
npm run dev
npm run lint
npm run test
```

## Onboarding

<!-- TODO: README do serviço -->

## Cursor

Rules: `company-patterns` (picker), `node-express`, `typescript-node` · `/review-patterns` · [.cursor/PORTABILITY.md](.cursor/PORTABILITY.md)
