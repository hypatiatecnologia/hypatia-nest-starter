# Índice de commands (`~/.cursor/commands`)

Roteador para escolher o `/` certo. **Precedência:** command em [`.cursor/commands/` do repo aberto](.) sobrescreve o global com o mesmo nome.

## Fluxo Git / PR

| Situação                                           | Command                         | Não usar quando                                 |
| -------------------------------------------------- | ------------------------------- | ----------------------------------------------- |
| Mensagem de commit (só stage)                      | [`commit`](./commit.md)         | PR completo → [`pr`](./pr.md)                   |
| Lint + testes + riscos + commit (diff ≤150 linhas) | [`revisao-pr`](./revisao-pr.md) | Diff grande / migration → [`pr`](./pr.md)       |
| Rascunho de PR (título, testes, rollback)          | [`pr`](./pr.md)                 | Só mensagem de commit → [`commit`](./commit.md) |
| Dividir trabalho em **vários PRs**                 | Skill `split-to-prs`            | Um único PR → [`pr`](./pr.md)                   |
| PR merge-ready (CI, comentários)                   | Skill `babysit`                 | Rascunho inicial → [`pr`](./pr.md)              |

Commits: [\_shared/commit-message.md](./_shared/commit-message.md) · Diff git: [\_shared/git-diff-base.md](./_shared/git-diff-base.md) · Rules: [RULES.md](../rules/RULES.md)

## Qualidade de código

| Situação                           | Command                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| Testes (escrever + rodar)          | [`test`](./test.md)                                                                               |
| Bug / stack trace                  | [`debug`](./debug.md)                                                                             |
| Refactor preservando comportamento | [`refactor`](./refactor.md)                                                                       |
| Padrões NestJS (data-vault)        | [`review-nest-patterns`](./review-nest-patterns.md)                                               |
| Padrões Idea/Express (outros repos) | [`review-patterns`](./review-patterns.md) — preferir command específico do repo se existir        |
| Auditoria segurança (read-only)    | [`security-review`](./security-review.md)                                                         |
| Dependências e supply chain        | [`deps-audit`](./deps-audit.md)                                                                   |

## Documentação

| Situação                         | Command                                                       |
| -------------------------------- | ------------------------------------------------------------- |
| README raiz (onboarding rápido)  | [`readme`](./readme.md) (`create-readme` é alias compatível)  |
| Doc técnica profunda (local)     | [`create-doc`](./create-doc.md)                               |
| Diagnóstico + issues/ROI/sprint  | [`diagnostico`](./diagnostico.md) — não duplicar `create-doc` |
| Doc no engineering handbook + PR | [`create-playbook-doc`](./create-playbook-doc.md)             |

## Aprendizado

| Situação                                         | Command                   | Não usar quando                          |
| ------------------------------------------------ | ------------------------- | ---------------------------------------- |
| Ensinar conceito ou código (didático, read-only) | [`ensinar`](./ensinar.md) | Auditoria técnica → [`explain`](./explain.md) |

## Planejamento e infra

| Situação                          | Command                                 | Não usar quando                          |
| --------------------------------- | --------------------------------------- | ---------------------------------------- |
| Spec / ADR (sem código)           | [`spec`](./spec.md)                     |                                          |
| Migration de banco                | [`migrate`](./migrate.md)               |                                          |
| Onboard dev / setup               | [`onboard`](./onboard.md)               |                                          |
| Telemetria (traces/métricas)      | [`add-telemetry`](./add-telemetry.md)   |                                          |
| Explicar código (read-only)       | [`explain`](./explain.md)               | Ensino didático → [`ensinar`](./ensinar.md) |
| Contrato OpenAPI vs implementação | [`contract-check`](./contract-check.md) |                                          |

## Shared (`_shared/`)

| Arquivo                                                                  | Uso                                |
| ------------------------------------------------------------------------ | ---------------------------------- |
| [command-skeleton.md](./_shared/command-skeleton.md)                     | Objetivo / quando usar / done when |
| [commit-message.md](./_shared/commit-message.md)                         | commitlint                         |
| [git-diff-base.md](./_shared/git-diff-base.md)                           | `BASE` + `git diff`                |
| [breaking-changes-checklist.md](./_shared/breaking-changes-checklist.md) | PR e revisão                       |
| [detect-package-manager.md](./_shared/detect-package-manager.md)         | bun/npm/pnpm/yarn                  |
| [playbook-mkdocs-templates.md](./_shared/playbook-mkdocs-templates.md)   | Templates MkDocs                   |

## Capacidades Cursor

- **Plan Mode** (`Shift+Tab`): specs, refactors grandes, playbook, migrations.
- **Debug Mode**: bugs reproduzíveis com causa opaca — ver [`debug`](./debug.md).
- **@Branch**: contexto da branch atual nos commands de PR.
