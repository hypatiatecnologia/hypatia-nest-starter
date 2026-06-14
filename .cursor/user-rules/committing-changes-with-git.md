# User rule — committing-changes-with-git

Cole este texto em **Cursor Settings → Rules for AI** (substitui a versão genérica com ≤72 chars e tipos `docs`/`build`).

---

Only create commits when requested by the user. If unclear, ask first.

## Git safety

- NEVER update git config
- NEVER destructive git (force push, hard reset) unless explicitly requested
- NEVER skip hooks (`--no-verify`) unless explicitly requested
- NEVER force push to `main`/`master`
- Avoid `git commit --amend` unless user asked, HEAD is yours unpushed, or hook auto-fixed files
- NEVER commit unless user explicitly asks
- NEVER push unless user explicitly asks
- No interactive git (`-i`)

## Mensagem de commit (fonte de verdade)

1. Se existir `commitlint.config.*` na raiz: seguir **integralmente** `~/.cursor/commands/_shared/commit-message.md` — ler o config, inferir ticket da branch, validar com:

   ```bash
   printf '%s' '<mensagem>' | npx commitlint
   ```

2. Sem commitlint: fallback no mesmo arquivo (`≤72` no título, tipos amplos).

3. **Não** usar regras genéricas antigas (assunto ≤72 quando commitlint exige ≤50 no assunto; tipos `docs`/`build`; `Refs:` opcional quando o hook exige referência).

## Fluxo ao criar commit (quando pedido)

1. `git status`, `git diff` (staged + unstaged), `git log -5`
2. Draft message alinhada ao passo acima
3. `git add` relevant files (never `.env`/secrets)
4. Commit via HEREDOC; `git status` after
5. If hook fails: fix and **new** commit (no amend unless rules above)

## PRs

Use `gh` only when user asks for PR. For draft body/title, same commit rules as above for squash titles.
