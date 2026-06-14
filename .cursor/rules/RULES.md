# Índice de rules (`.cursor/rules`)

Roteador para escolher a rule certa. **Precedência detalhada:** [_shared/precedence.md](./_shared/precedence.md).

**Importante:** não crie symlink `<repo>/.cursor/rules` → `~/.cursor/rules` (duplica rules no contexto).

**Reutilizar em outro repo:** [PORTABILITY.md](../PORTABILITY.md).

## Sempre ativas (`alwaysApply: true`)

| Rule | Foco |
|------|------|
| [principles](./principles/rule.mdc) | KISS, YAGNI, precedência entre rules |
| [architecture](./architecture/rule.mdc) | SOLID, camadas, DIP |
| [cognitive-complexity](./cognitive-complexity/rule.mdc) | Limites de função, nesting, CC ≤15 |
| [errors-and-logging](./errors-and-logging/rule.mdc) | Erros estruturados, logs, sem catch silencioso |
| [naming-and-files](./naming-and-files/rule.mdc) | Casing, rotas kebab-case |
| [linguagem-pt-br](./linguagem-pt-br/rule.mdc) | Prosa ao usuário em pt-BR |
| [handoff](./handoff/rule.mdc) | Resumo de sessão e reset de chat no Cursor |

## Sob demanda (globs ou picker)

| Rule | Quando carrega | Não usar quando |
|------|----------------|-----------------|
| [gitflow](./gitflow/rule.mdc) | `commitlint.config.{js,cjs,mjs,ts}`, `.husky/**`, `.github/**`, `.gitlab-ci.yml` | Commits: usar `/commit` + [_shared/commit-message.md](../commands/_shared/commit-message.md) |
| [typescript](./typescript/rule.mdc) | `**/*.ts`, `**/*.tsx` | — |
| [typescript-security](./security/typescript-security.mdc) | `**/*.ts`, `**/*.tsx` | — |
| [frontend-architecture](./frontend-architecture/rule.mdc) | `components/**`, `app/**`, `pages/**` | Backend API / Node |
| [tailwind-css](./tailwind-css/rule.mdc) | `**/*.tsx`, `tailwind.config.*`, `**/*.css` | Projetos sem Tailwind |
| [shadcn-ui](./shadcn-ui/rule.mdc) | `app/components/ui/**`, `components/ui/**`, `src/components/ui/**`, `components.json` | Projetos sem Shadcn |
| [design-system](./design-system/rule.mdc) | `app/**/*.tsx`, `src/features/**/*.tsx`, `src/components/**/*.tsx` | Rotas sem UI de marketing/landing |
| [remix-fsd](./remix-fsd/rule.mdc) | `react-router.config.ts`, `app/routes/**`, `src/features/**`, `src/lib/supabase/**`, `src/db/**` | Next.js App Router, NestJS |
| [nestjs-patterns](./nestjs-patterns/rule.mdc) | `nest-cli.json`, `prisma/schema.prisma` | Repos sem NestJS |
| [company-patterns](./company-patterns/rule.mdc) | **Picker manual** (sem globs no `.mdc`) | Fastify greenfield, frontend, PHP |
| [node-express](./node-express/rule.mdc) | `app.ts`, `server.ts`, `**/express/**`, `**/middleware/**` | Nest/Fastify novo; Yup+company-patterns já cobrem validação |
| [php](./php/rule.mdc) | `**/*.php` | Projeto PHP 7.x (use `php7`) |
| [php-security](./security/php-security.mdc) | `**/*.php` | — |
| [php7](./php7/rule.mdc) | **Picker manual** | PHP 8+ (use `php`) |
| [zend-framework](./zend-framework/rule.mdc) | `module.config.php`, `Module.php` | Fora de ZF/Laminas legado |
| [go](./go/rule.mdc) | `**/*.go` | — |
| [go-security](./security/go-security.mdc) | `**/*.go` | — |
| [java-security](./security/java-security.mdc) | `**/*.java`, `src/main/kotlin/**/*.kt` | Android (`app/src/main/kotlin`), KMP — picker |
| [java-spring](./java-spring/rule.mdc) | `pom.xml`, `build.gradle*`, `src/main/java/**`, `application.*` | Node/PHP sem JVM |
| [python](./python/rule.mdc) | `**/*.py` | — |
| [python-security](./security/python-security.mdc) | `**/*.py` | — |
| [typescript-react](./typescript-react/rule.mdc) | `next.config.*`, `vite.config.*`, `app/**/*.tsx`, `pages/**/*.tsx`, `components/**/*.tsx`, `src/features/**/*.tsx` | React Native |
| [laravel](./laravel/rule.mdc) | `artisan`, `app/Http/**`, `app/Models/**`, `routes/{api,web}.php` | Symfony ou PHP sem Laravel |
| [symfony](./symfony/rule.mdc) | `symfony.lock`, `config/services.yaml`, `src/Controller/**`, `src/Entity/**` | Laravel ou ZF legado |
| [tester](./tester/rule.mdc) | `*.test.*`, `*.spec.*`, `*_test.*`, `__tests__/**` | Tarefa sem teste |
| [openapi-contracts](./openapi-contracts/rule.mdc) | `openapi.*`, `swagger.*`, `*openapi*.{yaml,yml,json}` | API sem spec pública |
| [environment](./environment/rule.mdc) | Docker, compose, CI, `.tool-versions`, `mise.toml`, `.nvmrc`, `.sdkmanrc`, `Makefile` | Regra de negócio em `src/` |

## Picker manual (stack)

| Situação | Rule |
|----------|------|
| Repos Pantheon/Hypatia | [hypatia-ecosystem](./hypatia-ecosystem/rule.mdc) |
| Remix / React Router v7 + FSD | [remix-fsd](./remix-fsd/rule.mdc) |
| Node novo (Fastify/Nest, Zod) | [typescript-node](./typescript-node/rule.mdc) |
| Express + Yup legado (Idea) | [company-patterns](./company-patterns/rule.mdc) + [node-express](./node-express/rule.mdc) — **não** `typescript-node` |
| React web sem arquivo coberto por glob | [typescript-react](./typescript-react/rule.mdc) |
| React Native | [typescript-react-native](./typescript-react-native/rule.mdc) |
| Kotlin + Spring (backend JVM) | [java-spring](./java-spring/rule.mdc) + [java-security](./security/java-security.mdc) — auto em `src/main/kotlin/`; template [kotlin-spring.md](../templates/agents/kotlin-spring.md) |
| Kotlin Android / Compose / KMP | `java-security` (picker) — template [kotlin-android.md](../templates/agents/kotlin-android.md) |
| Spec/ADR sem código | [architect](./architect/rule.mdc) |
| Handoff `specs/steps/*-passo-N.md` | [model-routing](./model-routing/rule.mdc) + [token-budget](./token-budget/rule.mdc) — citar com `@` no prompt |

## Rules vs commands

| Tarefa | Preferir |
|--------|----------|
| Mensagem de commit | Command [`/commit`](../commands/commit.md) → [_shared/commit-message.md](../commands/_shared/commit-message.md) |
| Revisão módulo TS backend | Command repo `review-company-patterns` ou global `review-patterns` |
| Auditoria de dependências | [`/deps-audit`](../commands/deps-audit.md) |
| Contrato OpenAPI vs código | [`/contract-check`](../commands/contract-check.md) |
| Rascunho de PR | [`/pr`](../commands/pr.md) |
| Passo de implementação (Antigravity) | [`/handoff`](../commands/handoff.md) |
| Índice de commands | [COMMANDS.md](../commands/COMMANDS.md) |

## Fragmentos compartilhados (`rules/_shared/`)

| Arquivo | Uso |
|---------|-----|
| [precedence.md](./_shared/precedence.md) | Ordem security → architecture → company-patterns → stack |
| [company-patterns-transaction.md](./_shared/company-patterns-transaction.md) | Exemplo de transação BaseRepository |

## Exemplos (`.cursor/examples/`)

| Arquivo | Rule testada | Foco |
|---------|--------------|------|
| [01-architecture.example.md](../examples/01-architecture.example.md) | architecture | Separação de camadas, DIP |
| [02-security-ts.example.md](../examples/02-security-ts.example.md) | typescript-security | Validação de entrada, IDOR |
| [03-cognitive-complexity.example.md](../examples/03-cognitive-complexity.example.md) | cognitive-complexity | Funções simples, guard clauses |
| [04-errors-and-logging.example.md](../examples/04-errors-and-logging.example.md) | errors-and-logging | DomainError, RFC 7807 |
| [05-tester.example.md](../examples/05-tester.example.md) | tester | Cenários de teste, AAA |
| [06-gitflow.example.md](../examples/06-gitflow.example.md) | gitflow | Conventional Commits |
| [07-go.example.md](../examples/07-go.example.md) | go + go-security | Error handling, queries parametrizadas |
| [08-java-spring.example.md](../examples/08-java-spring.example.md) | java-spring + java-security | Controller magro, JPA, IDOR |
| [09-php.example.md](../examples/09-php.example.md) | php + laravel + php-security | Controller magro, FormRequest, Policy |
| [10-nestjs-patterns.example.md](../examples/10-nestjs-patterns.example.md) | nestjs-patterns | Controller magro, DTO class-validator, service + Prisma |
| [11-remix-fsd.example.md](../examples/11-remix-fsd.example.md) | remix-fsd | Rota magra, action/loader, FSD, Zod, Supabase SSR |

## User rule (Cursor Settings)

Texto canônico para **Rules for AI** → commits: [user-rules/committing-changes-with-git.md](../user-rules/committing-changes-with-git.md).
