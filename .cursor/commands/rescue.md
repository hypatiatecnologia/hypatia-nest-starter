---
description: Reverte o estado do código para o último commit seguro antes de uma tentativa falha do Cursor, criando um ambiente limpo para tentar novamente.
---

**Objetivo:** Restaurar o repositório para o estado do último commit ou stash seguro após o Cursor (Agent/Composer) entrar em loop de erros ou falhar repetidamente na implementação de um passo.

**Quando usar:** Quando o Cursor falhar na implementação de um passo (Dead End) e for necessário limpar as alterações quebradas antes de tentar o Troubleshooting (Passo N.1) com o Antigravity.

**Não usar quando:** O erro for simples e puder ser corrigido na mesma iteração sem reverter o código inteiro → usar [`debug`](./debug.md).

**Restrições:** 
- NUNCA executar `git reset --hard` ou `git clean` sem antes fazer backup das mudanças atuais (ex: via `git stash` ou branch de backup).
- NUNCA alterar o histórico empurrado para o remote (proibido `git push --force`).

**Done when:** O código local foi revertido com sucesso para um estado estável, o backup foi criado (se aplicável), e o ambiente está limpo e pronto para o Passo N.1.

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md)

---

## Passo 1 — Avaliar o estado atual

1. Verifique as mudanças problemáticas que causaram o loop de erros usando `git status` e `git diff`.
2. Se houver código parcialmente útil, isole-o. Faça backup das mudanças atuais:
   - `git stash save "Backup falha passo N"`
   - Ou crie uma branch temporária: `git checkout -b backup-falha-passo-N` e commit as alterações.

## Passo 2 — Limpar o ambiente (Rollback)

1. Para descartar as mudanças e retornar ao último commit limpo de forma segura:
   - Se usou a abordagem de branch temporária, volte para a branch de trabalho e execute `git reset --hard HEAD` (somente após garantir que o backup existe na outra branch).
   - Para limpar arquivos não trackeados (criados erroneamente pelo agente): use `git clean -fd` com atenção extra para não apagar arquivos locais importantes não commitados (como `.env` — que deve estar no `.gitignore`).

## Passo 3 — Preparar para o Troubleshooting

1. Retorne ao `Antigravity` no chat (Planning mode).
2. Reporte a falha contínua do Cursor e informe que o ambiente foi limpo/restaurado usando o `/rescue`.
3. Forneça ao Antigravity os logs de erro ou o motivo da falha.
4. Aguarde a geração do **Passo N.1** focado em isolar e destravar a causa raiz.
