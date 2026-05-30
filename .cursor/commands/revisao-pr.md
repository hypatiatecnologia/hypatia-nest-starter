---
description: Lint, testes, riscos e mensagem de commit para diff ≤150 linhas; não faz git commit. Use /pr para PR completo.
---

**Objetivo:** validar diff pequeno e sugerir mensagem de commit.

**Quando usar:** antes do PR, diff enxuto (≤150 linhas), sem migration/env obrigatória nova.

**Não usar quando:** diff >150 linhas, API pública, migration, env nova, webhook → [`pr`](./pr.md).

**Done when:** linter e testes reportados, riscos listados, mensagem de commit validada com commitlint (se existir).

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md)

---

Para rascunho completo com plano de testes e rollback, usar [`pr`](./pr.md).

---

## Passo 0 — Escopo deste command

Seguir [_shared/git-diff-base.md](./_shared/git-diff-base.md) e medir o diff.

Se **qualquer** condição abaixo for verdadeira, **parar** e indicar [`pr`](./pr.md):

- Diff total acima de **150 linhas** (limite deste command; diffs 150–500 usam `/pr`)
- Alteração em assinatura exportada ou endpoint público
- Migration de banco presente
- Nova variável de ambiente obrigatória
- Mudança em contrato de fila/tópico ou webhook
- `git status` com arquivos modificados não commitados

```
Este diff excede o escopo do /revisao-pr.
Use /pr. Motivo: {condição}
```

---

## Passo 1 — Linter e testes

Scripts reais: [_shared/detect-package-manager.md](./_shared/detect-package-manager.md) + `package.json` / `Makefile`.

```
Linter : {comando} → {passou / N erros}
Testes : {comando} → {N pass · N fail · N skip}
```

Baseline já quebrado: reportar e aguardar instrução. Falhas do diff: `path:linha` + descrição.

---

## Passo 2 — Riscos e breaking changes

[_shared/breaking-changes-checklist.md](./_shared/breaking-changes-checklist.md). Se vazio: declarar explicitamente que não há breaking change nem risco.

---

## Passo 3 — Mensagem de commit

[_shared/commit-message.md](./_shared/commit-message.md) + mesmo fluxo que [`commit`](./commit.md).

**Proibido** `git commit`.
