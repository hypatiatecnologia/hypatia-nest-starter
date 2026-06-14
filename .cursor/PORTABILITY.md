# Portabilidade — reutilizar `.cursor/` em outros projetos

Guia prático para copiar este pack para outro repositório ou para `~/.cursor` (global). O pack é **multi-stack**: rules de stack específica só entram no contexto quando o projeto tem os arquivos que disparam os globs.

## Passos comuns (qualquer projeto)

### Script (recomendado)

Na raiz **deste** repositório (fonte canônica do pack):

```bash
# Repo destino + template AGENTS.md + ignores
./scripts/sync-cursor-config.sh ../outro-repo --agents nextjs --with-ignore

# Só o pack .cursor (sem sobrescrever AGENTS.md do destino)
./scripts/sync-cursor-config.sh ../outro-repo --force

# Simular sem gravar
./scripts/sync-cursor-config.sh ../outro-repo --agents go --dry-run

# Convenções globais no Mac (~/.cursor; hooks.json ajustado automaticamente)
./scripts/sync-cursor-config.sh --global --force

# Antigravity global (~/.gemini/) — só GEMINI.md + AGENTS.md
./scripts/sync-cursor-config.sh --gemini --force

# Cursor + Antigravity de uma vez
./scripts/sync-cursor-config.sh --global --force --gemini
```

Modo global e **repo remoto** (várias máquinas): [GLOBAL-SETUP.md](GLOBAL-SETUP.md#repositório-remoto-time--várias-máquinas).

Stacks para `--agents`: `generic`, `remix-fsd`, `nextjs`, `nestjs`, `nestjs-hypatia`, `express-idea`, `go`, `java-spring`, `kotlin-spring`, `kotlin-android`, `python`, `laravel`, `symfony`, `react-native`. Índice: [templates/agents/README.md](templates/agents/README.md).

### Manual

1. **Copiar** a pasta `.cursor/` inteira para a raiz do repo destino (ou para `~/.cursor` para uso global).
2. **Copiar** (opcional mas recomendado) `.cursorignore` e `.cursorindexingignore` da raiz — padrão de segredos e build.
3. **Criar** `AGENTS.md` na raiz — copie de [templates/agents/](templates/agents/) ou use `--agents` no script. Não copie o `AGENTS.md` do Hephaestus Forge para um projeto Nest ou Go.
4. **Não** criar symlink `<repo>/.cursor/rules` → `~/.cursor/rules` — duplica rules `alwaysApply`.
5. **Cursor Settings → Rules for AI** (opcional): colar o texto de [user-rules/committing-changes-with-git.md](user-rules/committing-changes-with-git.md) se quiser o mesmo protocolo de commit em todos os projetos.
6. **Revisar plugins** (Cloudflare/PostHog/Sentry/Supabase/Vercel) na UI do Cursor (marketplace) — não há arquivo de config de plugins em `.cursor/`; habilite só o que o projeto usa.
7. Rodar `/onboard` no novo repo ou seguir o checklist da stack abaixo.

### O que vem “de graça” em todo projeto

| Componente | Comportamento |
|------------|---------------|
| Rules `alwaysApply` | principles, architecture, cognitive-complexity, errors-and-logging, naming-and-files, linguagem-pt-br |
| Hooks | `block-rm.sh`, `redact-prompt.sh` |
| Commands genéricos | `/commit`, `/pr`, `/test`, `/debug`, `/refactor`, `/explain`, `/security-review`, etc. |
| Skills | `babysit`, `split-to-prs`, `canvas`, `review-security`, … |
| Antigravity | `antigravity/GEMINI.md`, templates de passo — ver [antigravity/README.md](antigravity/README.md) |

---

## Checklist por tipo de projeto

Marque **Manter** (já dispara por glob ou é útil), **Opcional remover** (não atrapalha, mas ocupa índice se quiser enxugar) e **Adaptar** (editar conteúdo para o layout do seu repo).

### Remix / React Router v7 + FSD (como este boilerplate)

| Item | Ação |
|------|------|
| `rules/remix-fsd` | **Adaptar** se pastas diferirem de `app/routes/`, `src/features/`, `src/db/` |
| `rules/typescript-react`, `typescript`, `typescript-security` | Manter |
| `rules/shadcn-ui`, `tailwind-css`, `design-system`, `frontend-architecture` | Manter se usar Tailwind/shadcn |
| `rules/hypatia-ecosystem`, `nestjs-patterns`, `company-patterns` | Opcional remover |
| `rules/php*`, `laravel`, `symfony`, `go`, `java-spring`, `python` | Opcional remover |
| `commands/onboard.md` | **Adaptar** atalho Remix (paths `docs/onboarding/`, scripts do `package.json`) |
| `AGENTS.md` raiz | **Adaptar** (stack Supabase/Drizzle/Vitest deste repo é só referência) |
| Commands úteis | `/create-component`, `/migrate`, `/audit-ui`, `/ux-flow` |
| Example | `examples/11-remix-fsd.example.md` |

### Next.js (App Router ou Pages)

| Item | Ação |
|------|------|
| `rules/remix-fsd` | Opcional remover (globs não disparam sem `react-router.config.ts` / `app/routes/` no estilo Remix) |
| `rules/typescript-react`, `typescript`, `typescript-security` | Manter |
| `rules/frontend-architecture`, `tailwind-css`, `shadcn-ui`, `design-system` | Manter se aplicável |
| `rules/typescript-node` | Manter se houver API routes / server code em TS |
| `AGENTS.md` raiz | **Criar** — rotas `app/` ou `pages/`, Server Actions se usar, sem misturar com loaders Remix |
| Commands úteis | `/create-component`, `/review-design-consistency`, `/contract-check` (se API) |
| Example | `02-security-ts`, `04-errors-and-logging` |

### NestJS (greenfield ou Hypatia starter)

| Item | Ação |
|------|------|
| `rules/nestjs-patterns`, `typescript-node`, `typescript`, `typescript-security` | Manter |
| `rules/hypatia-ecosystem` | Manter só em repos Pantheon; **picker manual** no chat se necessário |
| `rules/company-patterns`, `node-express` | Opcional remover (legado Idea/Express) |
| `rules/remix-fsd`, `typescript-react` | Opcional remover se API pura |
| `commands/onboard.md`, `review-nest-patterns.md` | **Adaptar** paths de onboarding do starter |
| `AGENTS.md` raiz | **Criar** — módulos, Prisma, RabbitMQ se Hypatia |
| Commands úteis | `/review-nest-patterns`, `/migrate`, `/contract-check`, `/add-telemetry` |
| Example | `10-nestjs-patterns.example.md` |

### Node Express + Yup (legado Idea)

| Item | Ação |
|------|------|
| `rules/company-patterns` | Manter — **ativar via picker** (`@company-patterns`) |
| `rules/node-express`, `typescript-node` | Manter (não misturar `typescript-node` Zod como substituto de Yup sem decisão explícita) |
| `rules/nestjs-patterns`, `remix-fsd` | Opcional remover |
| Commands úteis | `/review-patterns` (não `review-nest-patterns`) |
| Example | `02-security-ts`, `04-errors-and-logging` |

### Go

| Item | Ação |
|------|------|
| `rules/go`, `security/go-security` | Manter |
| Toda pasta `rules/` TS/PHP/Java front | Opcional remover para enxugar |
| `AGENTS.md` raiz | **Criar** — layout `cmd/`, `internal/`, ferramentas (`golangci-lint`, `go test`) |
| Commands úteis | `/test`, `/refactor`, `/security-review`, `/pr` |
| Example | `07-go.example.md` |

### Java / Spring Boot

| Item | Ação |
|------|------|
| `rules/java-spring`, `security/java-security` | Manter |
| `rules/typescript*`, `nestjs-patterns` | Opcional remover |
| `AGENTS.md` raiz | **Criar** — template `java-spring` ou `--agents java-spring` |
| Commands úteis | `/test`, `/contract-check`, `/migrate` |
| Example | `08-java-spring.example.md` |

### Kotlin + Spring Boot (JVM backend)

| Item | Ação |
|------|------|
| `rules/java-spring` | Manter — inclui secção Kotlin (`data class`, coroutines, `sealed`) |
| `rules/java-security` | Manter — dispara com `**/*.java` e `src/main/kotlin/**/*.kt` (módulo raiz); submódulos Gradle só `.kt` → editar `build.gradle.kts` do módulo ou picker |
| `AGENTS.md` raiz | Template `kotlin-spring` · `--agents kotlin-spring` |
| Commands úteis | `/test`, `/contract-check` |
| Example | `08-java-spring.example.md` (mesmo foco JVM/Spring) |

```bash
./scripts/sync-cursor-config.sh ../api-kotlin --agents kotlin-spring --with-ignore
```

### Kotlin — Android / Compose / KMP

| Item | Ação |
|------|------|
| `rules/java-spring` | Opcional remover ou ignorar (conteúdo é Spring, não Android) |
| `rules/java-security` | **Picker manual** — globs JVM evitam auto-attach em Android/KMP |
| `AGENTS.md` raiz | Template `kotlin-android` · `--agents kotlin-android` |
| Commands úteis | `/test`, `/review-mobile-ui` (screenshots) |

### Python

| Item | Ação |
|------|------|
| `rules/python`, `security/python-security` | Manter |
| Demais stacks | Opcional remover |
| `AGENTS.md` raiz | **Criar** — venv/poetry/uv, pytest, layout do projeto |
| Commands úteis | `/test`, `/debug`, `/security-review` |

### PHP Laravel

| Item | Ação |
|------|------|
| `rules/laravel`, `php`, `security/php-security` | Manter |
| `rules/symfony`, `zend-framework`, `php7` | Opcional remover |
| Example | `09-php.example.md` |

### PHP Symfony

| Item | Ação |
|------|------|
| `rules/symfony`, `php`, `security/php-security` | Manter |
| `rules/laravel`, `zend-framework` | Opcional remover |

### React Native / Expo

| Item | Ação |
|------|------|
| `rules/typescript-react-native` | Manter — **picker** se globs não cobrirem |
| `rules/typescript-react`, `remix-fsd` | Opcional remover ou ignorar (não disparam em `.tsx` mobile sem paths web) |
| Commands úteis | `/review-mobile-ui`, `/test` |

### API com OpenAPI público

| Item | Ação |
|------|------|
| `rules/openapi-contracts` | Manter (dispara com `openapi.yaml`, etc.) |
| Commands | `/contract-check` |

### Só documentação / specs (sem `src/`)

| Item | Ação |
|------|------|
| `rules/architect` | Manter — picker ou globs em `docs/` |
| Commands | `/spec`, `/create-doc`, `/explain` |
| Rules de código | Opcional remover |

---

## Enxugar o pack (modo minimal)

Se o time usa **uma stack só** e quer menos ruído no índice:

1. Manter sempre: `principles`, `architecture`, `cognitive-complexity`, `errors-and-logging`, `naming-and-files`, `linguagem-pt-br`, `hooks/`, `commands/`. (Skills built-in vêm do Cursor automaticamente; só portar `skills/` próprias.)
2. Manter a stack alvo + `security/*` correspondente + `tester` + `gitflow` (se usar commitlint).
3. Remover pastas em `rules/` de stacks que o time não mantém (ex.: apagar `zend-framework`, `php7`, `hypatia-ecosystem` se não for Pantheon).
4. Remover `examples/` não relacionados ou manter só 1–2 de referência.
5. Atualizar [RULES.md](rules/RULES.md) e este arquivo se remover rules (evita links quebrados na doc).

> **Nota:** remover rules não usadas é opcional. Com globs corretos, rules de outras stacks **não entram no contexto** — só ocupam espaço no disco e no índice do Cursor.

---

## Global (`~/.cursor`) vs por projeto

| Modo | Prós | Contras |
|------|------|---------|
| **Por projeto** (`.cursor/` no repo) | Versionado com o time; `AGENTS.md` e rules adaptadas por produto | Atualizar vários repos ao evoluir o pack |
| **Global** (`~/.cursor`) | Uma cópia para todos os IDEs | Sem versionamento com o time; commands globais não substituem os do repo |

**Guia passo a passo (global no Mac):** [GLOBAL-SETUP.md](GLOBAL-SETUP.md) — inclui ajuste automático de `hooks.json` via `./scripts/sync-cursor-config.sh --global`.

**Recomendação:** pack canônico em um repo (este ou template); novos projetos copiam `.cursor/` e customizam `AGENTS.md` + 1–2 rules — ou use só global e mantenha `AGENTS.md` por projeto. Sincronizar melhorias periodicamente (ver [AGENTS.md](AGENTS.md) — “propagar para outros repos”).

---

## Verificação rápida após portar

- [ ] `AGENTS.md` na raiz descreve **este** projeto, não o Hephaestus Forge
- [ ] `/onboard` ou README local aponta para scripts reais do `package.json` / `Makefile`
- [ ] Nenhum symlink `.cursor/rules` → `~/.cursor/rules`
- [ ] Hooks respondem: tentar `rm -rf /` no agent deve ser bloqueado
- [ ] Abrir um arquivo da stack (ex.: `.go`, `nest-cli.json`) e confirmar que a rule certa aparece no contexto (perguntar ao agent: “quais rules de stack estão ativas?”)
- [ ] `linguagem-pt-br`: desabilitar só se o time preferir inglês nas respostas (editar `alwaysApply` ou remover a rule)

---

## Referências

- Índice de rules: [rules/RULES.md](rules/RULES.md)
- Precedência: [rules/_shared/precedence.md](rules/_shared/precedence.md)
- Índice de commands: [commands/COMMANDS.md](commands/COMMANDS.md)
- Visão geral: [README.md](README.md)
