# Detectar gerenciador de pacotes (Node)

Inspecionar lockfiles na raiz do repositório, nesta ordem:

| Lockfile | Instalar deps | Rodar script `X` |
|----------|---------------|------------------|
| `bun.lock` | `bun install` | `bun run X` / `bun test` |
| `pnpm-lock.yaml` | `pnpm install --frozen-lockfile` | `pnpm run X` |
| `yarn.lock` | `yarn install --frozen-lockfile` | `yarn X` |
| `package-lock.json` | `npm ci` (preferir `ci` em CI/onboard) | `npm run X` |

Se nenhum lockfile: usar o gerenciador indicado no README ou `package.json` (`packageManager` field).

**Proibido** inventar scripts — ler `package.json` → `scripts` ou `Makefile` antes de executar lint/test/build.
