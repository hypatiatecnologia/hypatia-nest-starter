# Índice de rules (`~/.cursor/rules`)

Roteador para escolher a rule certa. **Precedência detalhada:** [_shared/precedence.md](./_shared/precedence.md).

**Importante:** não crie symlink `<repo>/.cursor/rules` → `~/.cursor/rules` (duplica rules no contexto).

## Sempre ativas (`alwaysApply: true`)

| Rule | Foco |
|------|------|
| [principles](./principles/rule.mdc) | KISS, YAGNI, precedência entre rules |
| [architecture](./architecture/rule.mdc) | SOLID, camadas, DIP |
| [cognitive-complexity](./cognitive-complexity/rule.mdc) | Limites de função, nesting, CC ≤15 |
| [errors-and-logging](./errors-and-logging/rule.mdc) | Erros estruturados, logs, sem catch silencioso |
| [naming-and-files](./naming-and-files/rule.mdc) | Casing, rotas kebab-case |
| [linguagem-pt-br](./linguagem-pt-br/rule.mdc) | Prosa ao usuário em pt-BR |
| [hypatia-ecosystem](./hypatia-ecosystem/rule.mdc) | Pantheon, RabbitMQ, PII só no Hades, Cursor como IDE padrão |

## Sob demanda (globs ou picker)

| Rule | Quando carrega | Não usar quando |
|------|----------------|-----------------|
| [gitflow](./gitflow/rule.mdc) | `commitlint.config.{js,cjs,mjs,ts}`, `.husky/**`, `.github/**`, `.gitlab-ci.yml` | Commits: usar `/commit` + [_shared/commit-message.md](../commands/_shared/commit-message.md) |
| [typescript](./typescript/rule.mdc) | `**/*.ts`, `**/*.tsx` | — |
| [typescript-security](./security/typescript-security.mdc) | `**/*.ts`, `**/*.tsx` | — |
| [nestjs-patterns](./nestjs-patterns/rule.mdc) | `nest-cli.json`, `src/**/*.ts`, `prisma/schema.prisma` (exceto testes) | Projetos Idea/Express |
| [company-patterns](./company-patterns/rule.mdc) | **Picker manual** (sem glob neste repo) | NestJS (use `nestjs-patterns`), Fastify greenfield, frontend, PHP |
| [node-express](./node-express/rule.mdc) | `app.ts`, `routes/**`, `middleware/**` | Nest/Fastify novo; Yup+company-patterns já cobrem validação |
| [php](./php/rule.mdc) | `**/*.php` | Projeto PHP 7.x (use `php7`) |
| [php-security](./security/php-security.mdc) | `**/*.php` | — |
| [php7](./php7/rule.mdc) | **Picker manual** | PHP 8+ (use `php`) |
| [zend-framework](./zend-framework/rule.mdc) | `module.config.php`, `Module.php` | Fora de ZF/Laminas legado |
| [go](./go/rule.mdc) | `**/*.go` | — |
| [go-security](./security/go-security.mdc) | `**/*.go` | — |
| [java-security](./security/java-security.mdc) | `**/*.java` | Kotlin Android/KMP; Kotlin backend só via picker/stack JVM |
| [java-spring](./java-spring/rule.mdc) | `pom.xml`, `build.gradle*`, `src/main/java/**`, `application.*` | Node/PHP sem JVM |
| [python](./python/rule.mdc) | `**/*.py` | — |
| [python-security](./security/python-security.mdc) | `**/*.py` | — |
| [typescript-react](./typescript-react/rule.mdc) | `next.config.*`, `vite.config.*`, `app/**/*.tsx`, `pages/**/*.tsx`, `components/**/*.tsx` | React Native |
| [laravel](./laravel/rule.mdc) | `artisan`, `app/Http/**`, `app/Models/**`, `routes/{api,web}.php` | Symfony ou PHP sem Laravel |
| [symfony](./symfony/rule.mdc) | `symfony.lock`, `config/services.yaml`, `src/Controller/**`, `src/Entity/**` | Laravel ou ZF legado |
| [tester](./tester/rule.mdc) | `*.test.*`, `*.spec.*`, `*_test.*`, `__tests__/**` | Tarefa sem teste |
| [openapi-contracts](./openapi-contracts/rule.mdc) | `openapi.*`, `swagger.*`, `*openapi*.{yaml,yml,json}` | API sem spec pública |
| [environment](./environment/rule.mdc) | Docker, compose, CI, `.tool-versions`, `mise.toml`, `.nvmrc`, `.sdkmanrc`, `Makefile` | Regra de negócio em `src/` |

## Picker manual (stack)

| Situação | Rule |
|----------|------|
| NestJS (Hypatia starter / Pantheon) | [hypatia-ecosystem](./hypatia-ecosystem/rule.mdc) + [nestjs-patterns](./nestjs-patterns/rule.mdc) + [typescript-node](./typescript-node/rule.mdc) |
| NestJS (data-vault / Hades) | [nestjs-patterns](./nestjs-patterns/rule.mdc) + [typescript-node](./typescript-node/rule.mdc) |
| Node novo (Fastify/Nest genérico, Zod) | [typescript-node](./typescript-node/rule.mdc) |
| Express + Yup legado | [company-patterns](./company-patterns/rule.mdc) + [node-express](./node-express/rule.mdc) — **não** `typescript-node` |
| React web sem arquivo coberto por glob | [typescript-react](./typescript-react/rule.mdc) |
| React Native | [typescript-react-native](./typescript-react-native/rule.mdc) |
| Kotlin backend sem `.java` | [java-spring](./java-spring/rule.mdc) + [java-security](./security/java-security.mdc) |
| Spec/ADR sem código | [architect](./architect/rule.mdc) |

## Rules vs commands

| Tarefa | Preferir |
|--------|----------|
| Mensagem de commit | Command [`/commit`](../commands/commit.md) → [_shared/commit-message.md](../commands/_shared/commit-message.md) |
| Revisão módulo NestJS (Hypatia / starter) | [`/review-nest-patterns`](../commands/review-nest-patterns.md) |
| Revisão módulo Idea/Express | Command repo `review-company-patterns` ou global `review-patterns` |
| Auditoria de dependências | [`/deps-audit`](../commands/deps-audit.md) |
| Contrato OpenAPI vs código | [`/contract-check`](../commands/contract-check.md) |
| Rascunho de PR | [`/pr`](../commands/pr.md) |
| Índice de commands | [COMMANDS.md](../commands/COMMANDS.md) |

## Fragmentos compartilhados (`rules/_shared/`)

| Arquivo | Uso |
|---------|-----|
| [precedence.md](./_shared/precedence.md) | Ordem security → architecture → company-patterns → stack |
| [company-patterns-transaction.md](./_shared/company-patterns-transaction.md) | Exemplo de transação BaseRepository |

## Exemplos (`~/.cursor/examples/`)

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

## User rule (Cursor Settings)

Texto canônico para **Rules for AI** → commits: [user-rules/committing-changes-with-git.md](../user-rules/committing-changes-with-git.md).
