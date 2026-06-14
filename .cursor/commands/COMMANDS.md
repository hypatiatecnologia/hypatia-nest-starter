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
| Falha do Agent/Loop de erros (rollback seguro)     | [`rescue`](./rescue.md)         | Erro simples/pontual → [`debug`](./debug.md)    |

Commits: [\_shared/commit-message.md](./_shared/commit-message.md) · Diff git: [\_shared/git-diff-base.md](./_shared/git-diff-base.md) · Rules: [RULES.md](../rules/RULES.md)

## Qualidade de código

| Situação                           | Command                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| Testes (escrever + rodar)          | [`test`](./test.md)                                                                               |
| Bug / stack trace                  | [`debug`](./debug.md)                                                                             |
| Refactor preservando comportamento | [`refactor`](./refactor.md)                                                                       |
| Padrões de módulo TS backend       | [`review-patterns`](./review-patterns.md) — preferir `review-company-patterns` no repo se existir |
| Revisão de módulo NestJS           | [`review-nest-patterns`](./review-nest-patterns.md) — só em repos Nest                            |
| Auditoria segurança (read-only)    | [`security-review`](./security-review.md)                                                         |
| Hardening Supabase (read-only)     | [`supabase-hardening`](./supabase-hardening.md) — auditoria genérica → [`security-review`](./security-review.md) |
| Dependências e supply chain        | [`deps-audit`](./deps-audit.md)                                                                   |

## Front-end e UI

| Situação | Command | Não usar quando |
|---|---|---|
| **Pré-desenvolvimento** |||
| Mapear jornada, estados e edge cases | [`ux-flow`](./ux-flow.md) | Tela já mapeada → [`create-component`](./create-component.md) |
| **Implementação** |||
| Scaffold de novo componente React/Next | [`create-component`](./create-component.md) | Edições em componentes já existentes |
| Microcopy — CTAs, erros, tooltips, labels, placeholders | [`ux-copy`](./ux-copy.md) | Tradução i18n → editar arquivo de strings diretamente |
| **Revisão de código** |||
| Consistência de design no código (tokens, props, estados) | [`review-design-consistency`](./review-design-consistency.md) | Screenshot → [`review-mobile-ui`](./review-mobile-ui.md) |
| Diagnóstico mobile a partir de screenshots | [`review-mobile-ui`](./review-mobile-ui.md) | Sem print → [`review-design-system`](./review-design-system.md) |
| Auditoria completa de UI, a11y e UX (com código) | [`audit-ui`](./audit-ui.md) | Só tokens → [`review-design-consistency`](./review-design-consistency.md) |
| **Revisão de design system** |||
| Auditar design system (tokens, hierarquia, trust signals) | [`review-design-system`](./review-design-system.md) | Bug pontual → [`debug`](./debug.md) |
| Design review holístico (heurísticas, navegação, referências) | [`ui-developer`](./ui-developer.md) | Só refatoração de código → [`audit-ui`](./audit-ui.md) |

## Documentação

| Situação                         | Command                                                       |
| -------------------------------- | ------------------------------------------------------------- |
| README raiz (onboarding rápido)  | [`readme`](./readme.md) ([`create-readme`](./create-readme.md) é alias compatível) |
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
| Spec / ADR (sem código)           | [`spec`](./spec.md)                     | Passo pronto → [`handoff`](./handoff.md) |
| Passo de implementação (handoff)  | [`handoff`](./handoff.md)               | Sem passo → Antigravity ou [`spec`](./spec.md) |
| Migration de banco                | [`migrate`](./migrate.md)               |                                          |
| Onboard dev / setup               | [`onboard`](./onboard.md)               |                                          |
| Telemetria (traces/métricas)      | [`add-telemetry`](./add-telemetry.md)   |                                          |
| Explicar código (read-only)       | [`explain`](./explain.md)               | Ensino didático → [`ensinar`](./ensinar.md) |
| Validar integridade das regras MDC  | [`lint-rules`](./lint-rules.md)         |                                          |
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
