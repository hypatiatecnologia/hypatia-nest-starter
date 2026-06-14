# Regras de mensagem de commit (commitlint)

Usar quando existir `commitlint.config.*` (`.js`, `.cjs`, `.mjs` ou `.ts`) na raiz do repositório.

## 1. Ler configuração do repo (obrigatório)

Antes de redigir a mensagem, inspecionar o `commitlint.config.*` na raiz:

- **`rules['type-enum']`** — tipos permitidos (se ausente, usar Conventional padrão).
- **`parserPreset.parserOpts.issuePrefixes`** — prefixos de ticket aceitos (ex.: `PLAT-`, `TK-`).
- **`ignores`** — atalhos que dispensam referência (ex.: `[NOID]`, `[TEST]`, `[CI-CD]` no subject).

Não hardcodar prefixos da empresa; derivar do arquivo do projeto aberto.

## 2. Validar

```bash
printf '%s' '<mensagem completa com linhas em branco>' | npx commitlint
```

Corrigir até passar; só então devolver ao usuário.

## 3. Regras típicas (quando config segue padrão Idea)

- Tipos: `chore`, `ci`, `feat`, `fix`, `perf`, `refactor`, `revert`, `test` — documentação → `chore(docs):`, deps → `chore(deps):` (não `docs`/`build` como tipo).
- **Assunto** após `tipo(escopo): `: sentence-case, imperativo, sem ponto, **≤50 caracteres** (prefixo não conta).
- **Referência** via footer `Refs: PREFIX-123` (sem `#`) ou ticket na primeira linha — obrigatória **quando o config definir** `references-empty`/`issuePrefixes`; se o config não validar referência (ex.: este boilerplate), tratar como convenção recomendada, não bloqueante.
- Corpo opcional; linhas ≤72 caracteres; linha em branco antes do footer.

Inferir ticket de `git branch --show-current` quando o nome da branch contiver um prefixo configurado + dígitos.

## Template

```
tipo(escopo): Descrição em sentence-case, imperativo, sem ponto final

Corpo opcional.

Refs: PREFIX-123
```

## Título de PR (squash)

O **título do PR** deve seguir as mesmas regras do assunto quando o merge for squash.

## Fallback (sem commitlint)

Conventional Commits genérico: `tipo(escopo): descrição` imperativa, ≤72 caracteres no título, tipos amplos (`feat`, `fix`, `docs`, `chore`, etc.), footer `Refs: #issue` opcional.
