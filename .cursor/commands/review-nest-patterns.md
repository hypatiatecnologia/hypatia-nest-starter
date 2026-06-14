---
description: Revisa módulo NestJS (controller, service, DTO, Prisma, RabbitMQ) em repos Nest/hypatia-nest-starter. Preferir sobre review-patterns.
---

**Objetivo:** relatório Conforme/Avisos/Violações frente aos padrões NestJS do hypatia-nest-starter.

**Quando usar:** antes do merge em `src/modules/<feature>/`.

**Não usar quando:** repo sem NestJS (ex.: este boilerplate Remix); stack Idea/Express → [`review-patterns`](./review-patterns.md); auditoria OWASP → [`security-review`](./security-review.md).

**Done when:** lint/build ok no escopo; resumo Passo 4 gerado.

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md)

**Alvo:** path do módulo — ex.: `src/modules/orders/`.

Ativar: [hypatia-ecosystem](../rules/hypatia-ecosystem/rule.mdc), [nestjs-patterns](../rules/nestjs-patterns/rule.mdc), [typescript-node](../rules/typescript-node/rule.mdc), [architecture](../rules/architecture/rule.mdc).

**Não** aplicar [company-patterns](../rules/company-patterns/rule.mdc) em repos NestJS. Scripts citados nos passos (`lint:ci`, `test`) são os do repo Nest alvo — confirmar no `package.json` dele.

---

## Passo 1 — Análise

1. **Estrutura** — `*.module.ts`, `*.service.ts`, `dto/`; controller (api) ou `*-event.consumer.ts` (worker)?
2. **Controller** — DTOs tipados, `@ApiTags`; sem regra de negócio pesada; `x-correlation-id` repassado?
3. **Service** — injeção via construtor; exceções Nest; **sem PII bruto** (delegar ao Hades)?
4. **RabbitMQ** — publish após transação (api)? `registerHandler` em `onModuleInit` (worker)? handlers idempotentes?
5. **DTOs** — `class-validator` + `@ApiProperty`; alinhados ao `ValidationPipe` global?
6. **Prisma** — queries parametrizadas; transações quando necessário?
7. **Logs** — Pino estruturado; sem PII/tokens em claro?

Relatório: **Conforme** · **Avisos** · **Violações**

---

## Passo 2 — Correções (quando aplicável)

Lotes pequenos; após cada lote: `npm run lint:ci` e `npm run build` no escopo.

- Extrair lógica do controller para o service.
- Criar/ajustar DTOs faltantes na borda HTTP.
- Registrar providers no módulo; importar infra compartilhada.
- Mapear erros de domínio para exceções HTTP adequadas.
- **Não** introduzir Yup, `IController`, `adaptRoute` ou `BaseRepository`.

---

## Passo 3 — Validação

Scripts reais deste repo ([_shared/detect-package-manager.md](./_shared/detect-package-manager.md)):

```bash
npm run lint:ci
npm run build
npm test
```

**Proibido** inventar scripts ausentes.

### Checklist manual

- [ ] Módulo exporta controller/service/consumer conforme archetype
- [ ] Rotas sensíveis com guards quando autenticação Argus estiver integrada
- [ ] DTOs validam entrada; sem `Record<string, unknown>` desnecessário na borda
- [ ] Eventos seguem envelope `HypatiaEvent`; routing key = `type`
- [ ] Swagger decorators nos endpoints públicos da API

---

## Passo 4 — Resumo

```markdown
## Revisão NestJS — Hypatia

**Módulo:** …
**Status:** Conforme / Avisos / Violações

### Ajustes feitos
- …

### Avisos restantes
- …
```

---

## Proibições

- Não impor padrões Idea/Express/Yup.
- Não persistir PII bruto fora do Hades.
- Não desligar lint para passar revisão.
- Não commitar com violações classificadas como erro sem justificativa.
