# Passo 4: auditoria de exposição

## Goal

Registrar uma auditoria bloqueante da árvore, histórico, dependências, licença e disclosure.

## Tarefas

1. Executar gitleaks na árvore e no histórico completo.
2. Revisar credenciais de exemplo, paths, e-mails, dados pessoais e topologia interna.
3. Verificar autoria, MIT, dependências, actions e imagens.
4. Avaliar se o canal de disclosure e `v0.1.0` são sustentáveis.
5. Registrar findings sanitizados e decisão publicável/bloqueada.

## Paths afetados (limite absoluto)

- `docs/audits/public-release-readiness-2026-07-26.md`

## Fora de Escopo

- Corrigir findings, reescrever histórico, mudar visibilidade ou emitir parecer jurídico.

## Critério de Pronto

- O relatório cobre todo o histórico e bloqueia o rollout diante de finding aberto.

## Dependências

- Passos 1 a 3.

## Checklist pré-handoff

- [ ] O `.claude/` não versionado não foi tocado.
- [ ] Segredos encontrados não são reproduzidos.
- [ ] Decisão final é fail-closed.

## Prompt de handoff

```text
Implemente APENAS o Passo 4.
File: @docs/audits/public-release-readiness-2026-07-26.md
Out of scope: correções, history rewrite, visibilidade e parecer jurídico.
Done criteria: auditoria completa, sanitizada e com gate explícito.
---
@specs/steps/public-release-readiness-step-4.md
@specs/public-release-readiness.md
```
