---
description: Verifica paridade entre contrato OpenAPI e implementação sem alterar código automaticamente.
---

**Objetivo:** apontar divergências entre spec OpenAPI, rotas, DTOs e testes de contrato.

**Quando usar:** mudança em endpoint público, revisão de PR de API, preparação de release versionada.

**Não usar quando:** só escrever spec/ADR → [`spec`](./spec.md); auditoria geral de segurança → [`security-review`](./security-review.md).

**Restrições:** não alterar spec nem código sem confirmação; não inventar contrato ausente; breaking change exige plano de versionamento.

**Done when:** relatório separa divergências confirmadas, hipóteses, breaking changes e testes recomendados.

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md)

---

# contract-check — OpenAPI vs implementação

## Passo 0 — Encontrar fonte de verdade

Carregar [openapi-contracts](../rules/openapi-contracts/rule.mdc) quando houver spec pública.

Procurar, nesta ordem:

1. `openapi.yaml`, `openapi.yml`, `openapi.json`, `swagger.yaml`, `swagger.json`.
2. Diretórios `docs/api/`, `spec/`, `contracts/`, `openapi/`.
3. Geradores no manifesto (`openapi-generator`, `swagger-jsdoc`, `springdoc`, `nestjs/swagger`, `zod-openapi`).
4. Rotas/handlers e DTOs públicos citados pelo usuário ou pelo diff.

Se não houver spec versionada, parar e recomendar criar/ativar o contrato antes de comparar.

## Passo 1 — Comparar superfície pública

Validar cada endpoint tocado:

- `path`, método HTTP e versão (`/v1`, header ou política do repo).
- `requestBody`, query params, path params e headers obrigatórios.
- Status codes documentados vs retornos reais.
- Shape de resposta e campos sensíveis.
- Regras de autenticação/autorização documentadas.
- `Idempotency-Key` em mutações repetíveis quando aplicável.

## Passo 2 — Classificar divergências

Use este formato:

```text
[TIPO] método path
Spec : comportamento documentado
Código: comportamento observado
Risco: compatibilidade, segurança ou DX
Ação: ajuste mínimo recomendado
```

Tipos: `breaking`, `missing_in_spec`, `missing_in_code`, `security`, `test_gap`.

## Passo 3 — Testes e validação

- Recomendar teste de contrato/schema quando suite existir.
- Se houver gerador, validar comando do projeto em vez de propor ferramenta nova.
- Para breaking change, exigir versão/deprecação e checklist de release.
- Não declarar paridade se só uma direção foi verificada.
