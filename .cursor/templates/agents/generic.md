# Agent guide — <!-- TODO: nome do projeto -->

Referência para assistentes de IA neste repositório.

## Stack

- **Linguagem / runtime:** <!-- TODO: ex. TypeScript / Node 22 -->
- **Framework:** <!-- TODO -->
- **Banco / cache:** <!-- TODO ou N/A -->
- **Testes:** <!-- TODO: ex. Vitest, pytest, go test -->

## Where to put code

| Concern | Location |
|---------|----------|
| Entrada HTTP / CLI | <!-- TODO: ex. `src/handlers/` --> |
| Regras de negócio | <!-- TODO: ex. `src/domain/` --> |
| Persistência | <!-- TODO: ex. `src/repositories/` --> |
| Config / env | <!-- TODO: ex. `src/config/` --> |
| Testes | <!-- TODO: ex. `**/*.test.ts`, `tests/` --> |

Rotas/handlers devem permanecer magros e delegar para a camada de aplicação/domínio.

## Conventions

- Validar entradas na borda (<!-- TODO: Zod, class-validator, etc. -->).
- Commits: [Conventional Commits](https://www.conventionalcommits.org/) — `feat(scope): description`.
- <!-- TODO: lint, format, hooks (Husky, pre-commit) -->

## Useful scripts

```bash
# TODO: copiar de package.json, Makefile ou README
# npm run dev
# npm run lint
# npm run test
```

## Onboarding

<!-- TODO: link para README ou docs/onboarding -->

## Cursor

Config do agente: `.cursor/` · Portabilidade: [.cursor/PORTABILITY.md](.cursor/PORTABILITY.md)
