# Guardrails para agentes autônomos

Restrições obrigatórias ao editar repositórios com Cursor Agent.

## Escopo e segurança

- **Proibido** commitar, push ou alterar git config sem pedido explícito do usuário.
- **Proibido** gravar segredos em código, `.env`, logs ou respostas HTTP.
- **Proibido** `rm -rf` em paths críticos; o hook `block-rm.sh` bloqueia tentativas.
- **Proibido** desabilitar hooks, lint ou testes para “passar” validação.
- **Obrigatório** ler o arquivo completo antes de qualquer edição; nunca editar com base apenas em contexto parcial ou snippet.
- Preferir alternativa **mais segura** em conflito de rules ([precedence.md](rules/_shared/precedence.md)).

## Stack do repositório

Consulte o `AGENTS.md` na raiz do repo para o stack específico.

| Sinal no repo | Rules a seguir |
| --- | --- |
| `nest-cli.json` | [nestjs-patterns](rules/nestjs-patterns/rule.mdc), [typescript-node](rules/typescript-node/rule.mdc) |
| `react-router.config.ts` ou `app/routes/` | [remix-fsd](rules/remix-fsd/rule.mdc), [typescript-react](rules/typescript-react/rule.mdc) |
| Repos Pantheon/Hypatia | [hypatia-ecosystem](rules/hypatia-ecosystem/rule.mdc) (picker manual) |
| `next.config.*` | [typescript-react](rules/typescript-react/rule.mdc) |

- **Não** misturar padrões de stacks diferentes (ex.: NestJS em repo Remix, ou Server Actions do Next em Remix).
- Revisão NestJS: command [`/review-nest-patterns`](commands/review-nest-patterns.md).
- Onboarding: command [`/onboard`](commands/onboard.md).

## Antigravity ↔ Cursor

| Ferramenta | Papel | Onde |
|------------|-------|------|
| Antigravity + [antigravity/GEMINI.md](antigravity/GEMINI.md) | Specs, ADRs, passos | Modo Planning |
| Cursor Agent | Código, testes | `/handoff` + `specs/steps/*-passo-N.md` |

Um passo = um chat Agent novo. Rules: [model-routing](rules/model-routing/rule.mdc), [token-budget](rules/token-budget/rule.mdc). Instalação: [antigravity/README.md](antigravity/README.md).

## Config Cursor

- Portabilidade para outros repos: [PORTABILITY.md](PORTABILITY.md)
- Config global (`~/.cursor`): [GLOBAL-SETUP.md](GLOBAL-SETUP.md)
- Rules: [rules/RULES.md](rules/RULES.md) · Commands: [commands/COMMANDS.md](commands/COMMANDS.md)
- Hooks: [hooks.json](hooks.json) — não remover `block-rm.sh` nem `redact-prompt.sh`
  - `block-rm.sh`: **fail-closed** (`failClosed: true`) — se o hook falhar, o comando é bloqueado (remoção destrutiva é alto risco). Nega `rm` recursivo em paths críticos e remoções em `.git/`; `rm` recursivo em outros paths exige confirmação do usuário (`ask`).
  - `redact-prompt.sh`: **fail-open** (sem `failClosed`) — se Python não estiver disponível, o prompt prossegue. Trade-off: DX em ambientes sem Python > risco de vazamento no prompt.
  - `format-on-edit.sh`: **informativo** (`afterFileEdit`, sem output) — `prettier --write` em `.ts`/`.tsx` editados pelo agente; nunca bloqueia.

## Commands e precedência

- Commits: `/commit` → [commands/_shared/commit-message.md](commands/_shared/commit-message.md)
- PRs: `/pr` ou `/revisao-pr` conforme tamanho do diff

## Skills disponíveis

| Skill | Uso |
|-------|-----|
| `canvas` | Visualizações analíticas, tabelas, comparações |
| `babysit` | PR merge-ready — CI, comentários, conflitos |
| `split-to-prs` | Dividir trabalho em PRs menores |
| `create-rule` | Criar ou atualizar rules do Cursor |
| `create-skill` | Criar novas skills |
| `create-hook` | Criar hooks de segurança |
| `automate` | Criar Cursor Automations |
| `loop` | Prompt recorrente em intervalo (`/loop`) |
| `review` | Revisão genérica de código |
| `review-bugbot` | Revisão de código com Bugbot |
| `review-security` | Auditoria de segurança do diff |
| `review-design-system` | Auditar design system (tokens, hierarquia, trust signals) |
| `sdk` | Integrar ou scriptar o Cursor SDK |

## Manutenção da config Cursor

- Preservar [hooks.json](hooks.json) e scripts em [hooks/](hooks/).
- Não criar symlink `.cursor/rules` → `~/.cursor/rules`.
- Ao alterar rules, manter coerência com [examples/](examples/).
- Sincronizar melhorias de `.cursor/` aqui antes de propagar para outros repos Pantheon.

## Checklist antes de finalizar uma tarefa autônoma

- [ ] Todos os arquivos modificados foram lidos por completo antes da edição?
- [ ] Nenhuma credencial, token ou PII foi incluído em nenhum arquivo?
- [ ] As alterações respeitam a hierarquia de rules (security > architecture > stack)?
- [ ] Lint e testes foram rodados quando aplicável (`npm run lint`, `npm run test:run`)?
- [ ] O resumo do que foi feito foi entregue ao usuário com a lista de arquivos alterados?
