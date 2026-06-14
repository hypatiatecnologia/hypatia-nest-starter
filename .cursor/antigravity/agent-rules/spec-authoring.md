# Checklist — autor de spec (Modo A)

Use antes de encerrar uma spec em `specs/<kebab-slug>.md`. Alinhar a [GEMINI.md](../GEMINI.md) e, no Cursor, a [spec.md](../../commands/spec.md).

## Contexto

- [ ] Já existe spec para esta feature? Se sim, confirmou **atualização** vs **arquivo novo**?
- [ ] ADRs **Accepted** em `adr/` foram lidos e não contraditos sem aviso?
- [ ] Paths e estrutura do repo conferidos no disco (não inventar pastas)?
- [ ] Seção citada pelo usuário: leu **só** essa seção (não a spec inteira por padrão)?

## Conteúdo obrigatório

- [ ] **Goal** — resultado de negócio em uma frase (sem implementação)
- [ ] **Non-goals** — mínimo dois itens fora de escopo
- [ ] **User stories** — Given/When/Then; ≥1 feliz e ≥1 erro
- [ ] **Observabilidade** — logs/métricas/traces ou justificativa de ausência
- [ ] **Threat model** — auth, validação, secrets/PII, abuso
- [ ] **Open questions** — bloqueadores têm responsável ou prazo
- [ ] **Implementation plan** — passos numerados (cada um ≤5 arquivos alterados/criados)

## Condicionais (omitir se não aplicável)

- [ ] **API contract** — HTTP/mensageria com auth, schemas, erros, idempotência
- [ ] **Data model** — entidades, invariantes; PII marcada 🔒
- [ ] **Rollout / Rollback** — flags, ordem de migração, reversão

## Legado sem cobertura

- [ ] Refatoração de fluxo crítico antigo → Passo 1 do plano = testes do comportamento atual

## Encerramento Modo A

- [ ] Migration de schema isolada em passo exclusivo (antes de serviços que consomem)
- [ ] Open questions sem bloqueador órfão
- [ ] Perguntou ao usuário: _"Gero o passo 1 (Modo B)?"_
