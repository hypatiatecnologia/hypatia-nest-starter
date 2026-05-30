---
description: Rascunho completo de PR vs branch base; não executa gh pr create. Use /revisao-pr para lint+testes em diffs ≤150 linhas.
---

**Objetivo:** produzir título e descrição de PR prontos para colar (texto only).

**Quando usar:** diff relevante, plano de testes, rollback ou breaking changes.

**Não usar quando:** só mensagem de commit do stage → [`commit`](./commit.md); diff pequeno + lint → [`revisao-pr`](./revisao-pr.md).

**Done when:** saída segue o template abaixo, título alinhado a commitlint (se existir), sem inventar mudanças fora do diff.

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md)

---

Para só **linter + testes + riscos rápidos**, usar [`revisao-pr`](./revisao-pr.md). Diffs entre 150 e 500 linhas cabem aqui; acima de 150 linhas o `/revisao-pr` encaminha para cá.

Contexto extra do usuário (opcional): preencher aqui ou no mesmo chat. Opcional: **`@Branch`** no chat como complemento ao git diff.

---

## Passo 0 — Coletar diff

Seguir [_shared/git-diff-base.md](./_shared/git-diff-base.md).

Se o diff total for **maior que 500 linhas**, avisar que PRs grandes aumentam risco de revisão superficial e sugerir dividir por contexto (ou skill `split-to-prs` se forem vários PRs).

---

## Passo 1 — Breaking changes e riscos

Seguir [_shared/breaking-changes-checklist.md](./_shared/breaking-changes-checklist.md). Listar na seção **Breaking Changes** do template de saída.

---

## Passo 2 — Produzir rascunho (template fixo)

Preencher **exatamente** estas seções, nesta ordem:

```markdown
## Título do PR

{tipo(escopo): Assunto — commitlint se existir commitlint.config.js; senão Conventional ≤72 chars}

## Resumo

- {o que mudou}
- {por que}
- {como validar em alto nível}

## Breaking Changes

{Nenhum — ou lista de itens do checklist}

## Plano de testes

- [ ] {comando real de lint — ver package.json/Makefile}
- [ ] {comando real de testes}
- [ ] {cenário happy path}
- [ ] {cenário de erro relevante}

## Rollback

{estratégia: migration down / revert / coordenação — ver diff}

## Screenshots / Logs

{Anexar se UI ou observabilidade; senão "N/A"}
```

**Título:** se existir `commitlint.config.js`, seguir [`commit.md`](./commit.md) e [_shared/commit-message.md](./_shared/commit-message.md) (squash usa o título do PR como mensagem de commit).

---

## Proibições

- **Proibido** executar `gh pr create`, `git merge` ou push — só texto.
- **Proibido** inventar mudanças não presentes no diff.
