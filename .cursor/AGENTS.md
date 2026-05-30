# Guardrails para agentes autônomos

Restrições obrigatórias ao editar repositórios Hypatia com Cursor Agent.

## Escopo e segurança

- **Proibido** commitar, push ou alterar git config sem pedido explícito do usuário.
- **Proibido** gravar segredos em código, `.env`, logs ou respostas HTTP.
- **Proibido** `rm -rf` em paths críticos; o hook `block-rm.sh` bloqueia tentativas.
- **Proibido** desabilitar hooks, lint ou testes para “passar” validação.
- Preferir alternativa **mais segura** em conflito de rules ([precedence.md](rules/_shared/precedence.md)).

## Stack deste repositório (hypatia-nest-starter)

- **NestJS 10** + **Prisma** + **PostgreSQL** + **Redis** + **RabbitMQ** + **class-validator** + **Swagger**.
- Seguir [hypatia-ecosystem](rules/hypatia-ecosystem/rule.mdc), [nestjs-patterns](rules/nestjs-patterns/rule.mdc) e [typescript-node](rules/typescript-node/rule.mdc).
- **Não** impor padrões Idea/Express ([company-patterns](rules/company-patterns/rule.mdc)) neste repo.
- Revisão de módulo: command [`/review-nest-patterns`](commands/review-nest-patterns.md).
- Onboarding humano/agente: command [`/onboard`](commands/onboard.md).

## Arquitetura

- Controllers magros: DTOs e guards na borda; regra de negócio em services.
- Prisma via `PrismaService`; transações só quando houver escrita coordenada.
- Eventos assíncronos via `RabbitMqService`; envelope `HypatiaEvent`.
- Erros HTTP com exceções Nest — sem stack/SQL na resposta.
- Logs estruturados (Pino); respeitar `redact` em `AppModule`.
- **Sem PII** neste starter — referências ao Hades quando necessário.

## Config Cursor (IDE padrão Hypatia)

- Rules: [rules/RULES.md](rules/RULES.md) · Commands: [commands/COMMANDS.md](commands/COMMANDS.md)
- Hooks: [hooks.json](hooks.json) — não remover `block-rm.sh` nem `redact-prompt.sh`
- Novos serviços recebem esta pasta via `npm run create-service` (cópia do starter)

## Commands e precedência

- Commits: `/commit` → [commands/_shared/commit-message.md](commands/_shared/commit-message.md)
- PRs: `/pr` ou `/revisao-pr` conforme tamanho do diff

## Manutenção da config Cursor

- Preservar [hooks.json](hooks.json) e scripts em [hooks/](hooks/).
- Não criar symlink `.cursor/rules` → `~/.cursor/rules`.
- Ao alterar rules, manter coerência com [examples/](examples/).
- Sincronizar melhorias de `.cursor/` aqui antes de propagar para outros repos Pantheon.
