---
description: Mensagem de commit do stage validada por commitlint; não executa git commit. Para PR use /pr.
---

**Objetivo:** devolver só o texto da mensagem de commit.

**Quando usar:** arquivos em stage, antes de `git commit`.

**Não usar quando:** rascunho de PR → [`pr`](./pr.md) ou [`revisao-pr`](./revisao-pr.md).

**Done when:** `npx commitlint` passou (se houver config) e texto pronto para colar.

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md) · Regras: [_shared/commit-message.md](./_shared/commit-message.md)

1. Executar no terminal (com permissão quando pedido): `git diff --staged --stat`, `git diff --staged` e `git branch --show-current`; opcionalmente `git log --oneline -5` para tom de mensagens recentes.

2. **Verificar coesão do stage antes de gerar a mensagem.** Se o diff em stage misturar mudanças de dois ou mais contextos funcionais não relacionados (ex.: fix de bug em módulo A + nova feature em módulo B + atualização de dependência), alertar o usuário:

   ```
   O stage contém mudanças em {n} contextos distintos:
     - {contexto 1}: {arquivos}
     - {contexto 2}: {arquivos}

   Commits atômicos são mais fáceis de reverter e revisar.
   Sugestão: usar `git add -p` para separar em commits distintos.
   Deseja continuar com um único commit mesmo assim? [s/N]
   ```

   Se o usuário confirmar, gerar a mensagem para o conjunto completo.

3. Resumir o que está em stage sem inventar mudanças fora do diff.

4. **Inferir referência de issue** (ver [_shared/commit-message.md](./_shared/commit-message.md)): branch atual, ticket informado pelo usuário, ou atalhos `[TEST]` / `[CI-CD]` / `[NOID]` quando couber.

5. Produzir **apenas** o texto da mensagem conforme [_shared/commit-message.md](./_shared/commit-message.md).

   **Válido:**
   ```
   feat(auth): Adiciona proxy de login parceiro

   Refs: PLAT-262
   ```

   **Inválido (e por quê):**
   - `feat(auth): adiciona OAuth` — assunto em minúscula (`subject-case`) e sem referência (`references-empty`).
   - `feat(auth): Adiciona OAuth` sem footer — falta `Refs:` ou ticket/atalho na mensagem.
   - `docs(readme): Atualiza onboarding` — tipo `docs` não permitido (`type-enum`).
   - Assunto com mais de 50 caracteres após `: ` — `subject-max-length`.

6. **Validar antes de responder** (quando existir `commitlint.config.js` na raiz do repo) — ver comando em [_shared/commit-message.md](./_shared/commit-message.md). Corrigir até passar; só então devolver o texto.

7. **Proibido** executar `git commit`, `git push` ou `--amend` — só texto para o usuário colar ou confirmar.

Se não houver arquivos em stage, responder claramente e sugerir `git add`.
