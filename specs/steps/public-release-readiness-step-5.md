# Passo 5: contrato público e gate final

## Goal

Preparar suporte, apresentação e release local e consolidar a decisão sem publicar.

## Tarefas

1. Alinhar `SECURITY.md` às versões suportadas e ao canal de disclosure validado.
2. Documentar status, limites, quick start, contribuição e metadata proposta.
3. Preparar release notes coerentes com o changelog sem criar release.
4. Produzir social preview local.
5. Registrar gates locais e três execuções consecutivas da CI, ou manter o rollout bloqueado.

## Paths afetados (limite absoluto)

- `SECURITY.md`
- `docs/public-release.md`
- `docs/releases/v0.1.0.md`
- `assets/social-preview.png`
- `docs/audits/public-release-gate-2026-07-26.md`

## Fora de Escopo

- Mudar visibilidade, habilitar template, editar metadata remota, criar release ou alterar pins.

## Critério de Pronto

- O handoff contém evidência suficiente para uma decisão humana e nenhuma ação externa ocorreu.

## Dependências

- Passos 1 a 4.

## Checklist pré-handoff

- [ ] Sem promessa de triagem que a Hypatia não possa sustentar.
- [ ] Findings bloqueantes impedem recomendação de publicação.
- [ ] Metadata e ações externas continuam pendentes.

## Prompt de handoff

```text
Implemente APENAS o Passo 5.
Files: @SECURITY.md @docs/public-release.md @docs/releases/v0.1.0.md @assets/social-preview.png @docs/audits/public-release-gate-2026-07-26.md
Out of scope: visibility, template flag, metadata remota, release e pins.
Done criteria: contrato público e evidência final prontos para aprovação, sem ação externa.
---
@specs/steps/public-release-readiness-step-5.md
@specs/public-release-readiness.md
```
