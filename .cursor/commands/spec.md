---
description: Cria spec/ADR em specs/ ou docs/ sem código de produção; use Plan Mode para features grandes.
---

**Objetivo:** spec completa antes de implementar.

**Quando usar:** feature nova com incerteza de escopo.

**Não usar quando:** implementar direto — usar Plan Mode + agent normal.

**Done when:** critério de completude do final da spec atendido.

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md)

**Feature:** (nome curto ou user story inicial) — preencher com o usuário.

Agir como [architect](../rules/architect/rule.mdc): **não editar código** de produto nesta passagem — apenas criar/atualizar arquivos sob `docs/`, `specs/` ou `adr/`.

---

## Passo 0 — Verificar contexto existente antes de criar

Antes de gerar qualquer arquivo:

1. Verificar se já existe spec para esta feature em `specs/` — buscar por nome similar ou user story relacionada. Se existir, perguntar ao usuário se é atualização ou nova spec.
2. Verificar se existe ADR (`adr/`) que já decidiu a abordagem desta feature — não contrastar com decisões já registradas sem avisar.
3. Verificar se há issue, ticket ou PR aberto referenciando a mesma feature no contexto da conversa — incluir a referência no arquivo se houver.

Derivar o slug do nome da feature em kebab-case. Se colidir com arquivo existente, perguntar ao usuário antes de sobrescrever.

---

## Passo 1 — Gerar `specs/<kebab-case-slug>.md`

Produzir o arquivo com as seções abaixo. Seções marcadas como **condicional** devem ser omitidas silenciosamente quando não se aplicam ao tipo de feature — não deixar seções vazias.

### 1. Goal *(obrigatório)*
Uma frase de resultado visível pelo usuário final. Não descrever implementação — descrever o que muda no mundo real quando a feature funciona.

### 2. Non-goals *(obrigatório)*
Lista explícita do que está fora do escopo desta spec. Pelo menos dois itens — se não houver, é sinal de que o escopo não foi delimitado.

### 3. User stories *(obrigatório)*
Formato Given / When / Then. Incluir:
- Todos os happy paths relevantes
- Pelo menos um caminho de erro com impacto no usuário
- Casos de borda identificados na conversa

### 4. API contract *(condicional — apenas se há superfície HTTP ou mensageria)*
Endpoints novos ou modificados, seguindo [openapi-contracts](../rules/openapi-contracts/rule.mdc):
- Método + rota, autenticação requerida, parâmetros
- Schema de request e response (campos, tipos, obrigatoriedade)
- Códigos de erro e suas semânticas, seguindo [errors-and-logging](../rules/errors-and-logging/rule.mdc)
- Idempotência: a operação pode ser repetida com segurança?
- Paginação: se retorna lista, qual o mecanismo (cursor, offset)?

Para mensageria: nome do tópico/fila, schema do payload, garantia de entrega.

### 5. Data model *(condicional — apenas se há mudança de schema ou novas entidades)*
- Entidades novas ou modificadas com campos e tipos
- Relacionamentos e invariantes (unicidade, FK, nullable)
- Migrações necessárias — seguir as regras de `/migrate`
- Campos com PII — marcar com 🔒 e declarar política de retenção

### 6. Observabilidade *(obrigatório)*
O que será necessário para saber que esta feature está funcionando em produção:
- Métricas RED (ou throughput para workers) a adicionar
- Logs estruturados — quais eventos e quais campos
- Traces — quais operações precisam de span
- Alertas — qual condição indica que algo está errado

Se a feature não introduz nenhum sinal observável novo, declarar explicitamente por quê não é necessário.

### 7. Threat model *(obrigatório)*
- AuthN/Z: quem pode chamar esta feature? O que acontece se um ator não autorizado tentar?
- Validação de entrada: quais campos precisam de validação e contra quê?
- Secrets e PII: a feature manipula dados sensíveis? Como são protegidos?
- Vetores de abuso: rate limiting, idempotência, replay attacks
- Alinhar à rule de segurança da stack detectada

### 8. Rollout *(condicional — apenas se há risco de deploy ou dependência entre serviços)*
- Feature flag necessária? Qual o comportamento quando desabilitada?
- Migração de dados: precisa rodar antes ou depois do deploy?
- Dependência de outro serviço: qual a ordem de deploy?
- Canary: % inicial de tráfego e critério de promoção

### 9. Rollback *(condicional — apenas se rollout tiver risco não trivial)*
- Como reverter sem perda de dados
- Estado do banco após rollback: compatível com versão anterior do código?
- Comunicação necessária (outros times, clientes)

### 10. Open questions *(obrigatório)*
Lista de decisões ainda não tomadas que bloqueiam ou impactam a implementação. Pelo menos um item — se não houver, verificar se a spec está realmente completa. Cada item deve ter um responsável ou prazo se aplicável.

---

## Critério de completude

A spec está pronta para implementar quando:
- [ ] Goal é uma frase de resultado, não de implementação
- [ ] Non-goals tem pelo menos dois itens
- [ ] User stories cobrem pelo menos um caminho de erro
- [ ] Todas as seções condicionais aplicáveis estão preenchidas
- [ ] Threat model tem pelo menos autenticação e validação endereçados
- [ ] Open questions não contém bloqueadores sem responsável
