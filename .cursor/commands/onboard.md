---
description: Onboard de repositório — diagnóstico, setup local e rules; confirma antes de executar comandos.
---

**Objetivo:** deixar ambiente local funcional e mapear o repo.

**Quando usar:** novo dev ou primeiro clone.

**Não usar quando:** doc técnica profunda → [`readme`](./readme.md) + [`create-doc`](./create-doc.md).

**Done when:** Fase 3 concluída ou gaps documentados; usuário confirmou comandos executados.

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md)

# Onboard — novo dev ou novo repositório

Use este comando quando:
- Um desenvolvedor novo está configurando o ambiente local pela primeira vez.
- Você está integrando um repositório externo ao ecossistema de rules deste projeto.
- O objetivo é mapear rapidamente um projeto desconhecido e configurá-lo corretamente.

**Copiar `.cursor/` para outro repo:** ver [PORTABILITY.md](../PORTABILITY.md) (checklists por stack).

## Atalho — repos Remix / React Router v7

Se o repo tem `react-router.config.ts` ou `app/routes/`:

1. Abrir o projeto no **Cursor** (`.cursor/` já incluído).
2. Seguir [docs/onboarding/PRIMEIROS-PASSOS.md](../../docs/onboarding/PRIMEIROS-PASSOS.md) na raiz do repo.
3. `cp .env.example .env` e preencher variáveis Supabase/Drizzle.
4. `nvm use && npm ci && npm run dev`.
5. Migrações Drizzle (se `drizzle.config.*` existir): `npm run db:generate` conforme scripts do `package.json`.
6. Rules: [remix-fsd](../rules/remix-fsd/rule.mdc), [typescript-react](../rules/typescript-react/rule.mdc), [tester](../rules/tester/rule.mdc).
7. Commands úteis: `/explain`, `/commit`, `/pr`.

---

## Atalho — repos Hypatia (hypatia-nest-starter)

Se o repo foi criado via `npm run create-service` ou tem `nest-cli.json`:

1. Abrir o projeto no **Cursor** (`.cursor/` já incluído).
2. Seguir [docs/onboarding/PRIMEIROS-PASSOS.md](../../docs/onboarding/PRIMEIROS-PASSOS.md) (Trilha A → B no starter; Trilha C após scaffold).
3. Ler comentários em `src/main.ts`, `src/app.module.ts`, `src/rabbitmq/rabbitmq.service.ts`.
4. **API no host (`npm run start:dev`):** `cp archetypes/api.env.example .env` — **não** use `.env.example` da raiz (hostnames Docker).
5. **Stack só Docker:** `cp .env.example .env` + `docker compose up --build` (sem `start:dev` no host).
6. Infra híbrida: `docker compose up -d --wait postgres redis rabbitmq`.
7. `nvm use && npm ci && npx prisma generate && npx prisma migrate deploy && npm run start:dev` — ou `npm run setup:local` + `npm run start:dev`.
8. Commands úteis: `/explain`, `/review-nest-patterns`, `/commit`, `/pr`.
9. Erros comuns: consultar `docs/onboarding/TROUBLESHOOTING.md` quando o repo tiver esse arquivo.
10. Rule Pantheon: [hypatia-ecosystem](../rules/hypatia-ecosystem/rule.mdc) (picker manual).

---

Seguir [environment/rule.mdc](../rules/environment/rule.mdc) para setup de ferramentas; [architecture/rule.mdc](../rules/architecture/rule.mdc) para mapeamento de camadas; [principles/rule.mdc](../rules/principles/rule.mdc) para precedência de rules.

---

## Fase 1 — Reconhecimento do projeto (ler antes de qualquer ação)

Inspecionar nesta ordem:

1. **Manifesto de pacotes / módulos:**
   - `package.json` → Node/TypeScript (checar `scripts`, `dependencies`, `engines.node`).
   - `react-router.config.ts` ou `app/routes/` → Remix / React Router v7.
   - `nest-cli.json` → NestJS / Hypatia Pantheon.
   - `next.config.*` → Next.js App Router.
   - `pom.xml` / `build.gradle` → Java/Kotlin Spring.
   - `go.mod` → Go (checar versão do runtime).
   - `pyproject.toml` / `setup.cfg` / `requirements.txt` → Python.
   - `composer.json` → PHP (checar `require.php` para versão; presença de `laravel/framework`, `zendframework/*`, `laminas/*`, `symfony/*` indica o framework).

2. **Versões de runtime:**
   - `.tool-versions`, `mise.toml`, `.nvmrc`, `.python-version`, `.sdkmanrc`, `.php-version`.
   - Se ausente: reportar como gap e sugerir criação.

3. **Estrutura de diretórios:** mapear `src/`, `cmd/`, `app/`, `internal/`, `domain/`, `infra/`, `tests/` — identificar se segue camadas (Ports & Adapters, MVC, flat).

4. **Configuração de qualidade:** checar presença de ESLint/Prettier, ruff, golangci-lint, mypy/pyright, pre-commit hooks.

5. **CI/CD:** checar `.github/workflows/` ou `.gitlab-ci.yml` — identificar stages (lint, test, build, deploy).

6. **Docker:** `Dockerfile`, `docker-compose.yml` — checar multi-stage, USER não-root, HEALTHCHECK.

---

## Fase 2 — Diagnóstico de gaps

Reportar em formato de tabela:

| Área | Status | Gap encontrado | Ação sugerida |
|------|--------|---------------|---------------|
| Runtime declarado | ✅/❌ | ... | ... |
| README presente | ✅/❌ | ... | Se ausente: rodar `/readme` |
| `.env.example` presente | ✅/❌ | ... | Se ausente: criar a partir das variáveis detectadas no código |
| Linter configurado | ✅/❌ | ... | ... |
| Type check em CI | ✅/❌ | ... | ... |
| Testes automatizados | ✅/❌ | ... | ... |
| Dockerfile seguro | ✅/❌ | ... | ... |
| Secrets no código | ✅/❌ | ... | Usar `gitleaks detect` ou buscar padrões hardcoded |

---

## Fase 3 — Setup local (executar apenas após confirmação do usuário)

Descobrir e apresentar **apenas os comandos relevantes para a stack detectada na Fase 1** — não listar comandos de stacks não presentes no projeto.

```bash
# 1. Instalar versão de runtime declarada
mise install        # se .tool-versions ou mise.toml existir
# ou: nvm use       # se .nvmrc existir
# ou: pyenv local   # se .python-version existir

# 2. Instalar dependências (usar o comando da stack detectada; ordem de detecção Node)
bun install         # se bun.lock existir
pnpm install --frozen-lockfile   # se pnpm-lock.yaml
yarn install --frozen-lockfile   # se yarn.lock
npm ci              # se package-lock.json — preferir ci sobre install em onboard
./mvnw install -DskipTests   # Java Maven
go mod download              # Go
uv sync                      # Python (uv)
pip install -e ".[dev]"      # Python (pip)
composer install             # PHP

# 3. Configurar variáveis de ambiente
cp .env.example .env
# → Instruir o usuário a preencher os valores obrigatórios antes de continuar

# 4. Subir infraestrutura local (se docker-compose.yml existir)
docker compose up -d

# 5. Executar migrações (se o projeto tiver banco)
# → Prisma: npx prisma migrate deploy
# → Drizzle: npm run db:generate (ou script equivalente no package.json)
# → Outros: Alembic, Flyway, etc. conforme stack detectada na Fase 1

# 6. Verificar que o ambiente está funcional
bun run lint && bun test     # se bun.lock; senão npm/yarn/pnpm — usar scripts reais do package.json
```

Perguntar ao usuário antes de executar qualquer comando. Se `.env.example` não existir, alertar: gap registrado na Fase 2 deve ser resolvido antes do setup.

---

## Fase 4 — Integração com as rules do ecossistema

Com base na stack identificada, indicar quais rules ativar:

| Stack detectada | Rule de stack | Rule de segurança | Overlay de testes |
|---|---|---|---|
| Remix / React Router v7 | `remix-fsd` + `typescript-react` | `typescript-security` | `tester` |
| TypeScript + Fastify/Express/Nest | `typescript-node` | `typescript-security` | `tester` |
| TypeScript + React (Next/SPA) | `typescript-react` | `typescript-security` | `tester` |
| React Native + Expo | `typescript-react-native` | `typescript-security` | `tester` |
| Java/Kotlin + Spring | `java-spring` | `java-security` | `tester` |
| Go | `go` (auto via globs) | `go-security` (auto via globs) | `tester` |
| Python | `python` (auto via globs) | `python-security` (auto via globs) | `tester` |
| PHP 8.3+ (sem framework) | `php` (auto via globs) | `php-security` (auto via globs) | `tester` |
| PHP 8.3+ + Laravel | `php` + `laravel` | `php-security` (auto via globs) | `tester` |
| PHP 8.3+ + Symfony | `php` + `symfony` | `php-security` (auto via globs) | `tester` |
| PHP 7.x + Zend Framework | `php7` + `zend-framework` | `php-security` (auto via globs) | `tester` |

Entregável: lista das rules a ativar manualmente via picker + quais já são automáticas (alwaysApply/globs).

---

## Fase 5 — Checklist de onboard completo

- [ ] Runtime declarado em arquivo versionado (`.tool-versions`, `.nvmrc`, etc.).
- [ ] README presente e com Quick Start funcionando.
- [ ] `.env.example` presente com todas as variáveis obrigatórias documentadas.
- [ ] Dependências instalam sem erro em ambiente limpo.
- [ ] Linter passa sem warnings críticos.
- [ ] Suite de testes executa e passa.
- [ ] Nenhum secret hardcoded encontrado (`gitleaks detect` ou equivalente).
- [ ] CI/CD pipeline presente e funcional.
- [ ] Rules corretas identificadas e ativadas para a stack.
