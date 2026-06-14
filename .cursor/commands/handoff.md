---
description: Implementa um passo de spec (specs/steps/*-passo-N.md) sem expandir escopo.
---

**Objetivo:** executar **um** passo de handoff gerado no Antigravity.

**Quando usar:** existe `specs/steps/<feature>-passo-N.md` com Prompt Cursor preenchido.

**Não usar quando:** ainda não há passo — gerar no Antigravity (Modo B) ou `/spec` no Cursor.

**Done when:** critério de pronto do passo atendido; escopo não expandido.

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md)

---

## Configuração

- Modo: **Agent**
- Modelo: **Composer 2.5 Standard** (Fast **OFF**)
- Rules: [model-routing](../rules/model-routing/rule.mdc), [token-budget](../rules/token-budget/rule.mdc)
- Guardrails: [AGENTS.md](../AGENTS.md)

## Passos

1. Ler o arquivo do passo citado pelo usuário (`@specs/steps/...`).
2. Implementar **somente** o escopo do passo — ≤5 arquivos alterados/criados, 1 módulo/feature.
3. **Não** reler a spec mestre inteira em `specs/*.md` salvo se o passo exigir.
4. Validar o **critério de pronto** (teste, lint ou comportamento descrito).
5. Resumir arquivos alterados e pendências para retorno ao Antigravity (passo N+1).

## Prompt base (se o passo não tiver bloco pronto)

```
@model-routing @token-budget

Implemente APENAS o passo abaixo — não expanda escopo.
Arquivos: @[módulo]
Fora de escopo: [do passo]
Critério de pronto: [do passo]
Modelo: Composer 2.5 Standard

---

@specs/steps/<feature>-passo-N.md
```

## Proibido

- Implementar vários passos no mesmo chat
- Expandir escopo além do passo
- Usar este command para escrever specs — specs ficam no Antigravity ou `/spec`
