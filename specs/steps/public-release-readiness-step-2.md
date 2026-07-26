# Passo 2: narrativa pública genérica

## Goal

Preservar a marca Hypatia sem publicar topologia interna ou roadmap desnecessário.

## Tarefas

1. Substituir diagramas e exemplos de serviços reais por `gateway`, `api` e `worker`.
2. Remover roadmap e detalhes operacionais que não ensinam o starter.
3. Manter conceitos arquiteturais, decisões aceitas e identidade da Hypatia.
4. Alinhar o guia de agentes e o onboarding à mesma linguagem pública.

## Paths afetados (limite absoluto)

- `README.md`
- `AGENTS.md`
- `docs/onboarding/GLOSSARIO.md`
- `docs/onboarding/MAPA-MENTAL.md`
- `docs/onboarding/ONBOARDING.md`

## Fora de Escopo

- Reescrever ADRs aceitos, renomear exchange/runtime, mudar código ou apagar a marca Hypatia.

## Critério de Pronto

- A documentação explica os padrões com exemplos genéricos e sem depender da topologia interna.

## Dependências

- Passo 1.

## Checklist pré-handoff

- [ ] ADRs aceitos permanecem imutáveis.
- [ ] Marca Hypatia preservada.
- [ ] Nenhum claim novo de segurança ou produção.

## Prompt de handoff

```text
Implemente APENAS o Passo 2.
Files: @README.md @AGENTS.md @docs/onboarding/GLOSSARIO.md @docs/onboarding/MAPA-MENTAL.md @docs/onboarding/ONBOARDING.md
Out of scope: ADRs, código, exchange names, roadmap novo e remoção da marca.
Done criteria: narrativa pública usa exemplos genéricos sem perder valor arquitetural.
---
@specs/steps/public-release-readiness-step-2.md
@specs/public-release-readiness.md
```
