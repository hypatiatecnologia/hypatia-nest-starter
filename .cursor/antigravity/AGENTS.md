# Agent guardrails (cross-tool)

Instruções mínimas para **Antigravity** (specs) e **Cursor** (código).
Válidas em qualquer repositório que use esta pasta `.cursor/antigravity/`.

## Segurança

- **Proibido** commit, push ou alterar git config sem pedido explícito do usuário
- **Proibido** segredos em código, `.env` versionado, logs ou respostas HTTP
- Em conflito de regras, preferir a alternativa **mais segura**

## Convenções do projeto

1. **Stack:** inferir do repo (`nest-cli.json`, `package.json`, etc.) — **não** assumir Nest/Hypatia neste arquivo global
2. Se existir **`.cursor/rules/`**, alinhar specs às rules citadas no GEMINI.md (não carregar o índice inteiro)
3. Overlay de stack no Cursor (opcional): `.cursor/stacks/*.md` — só quando o usuário `@` mencionar
4. Decisões em **`adr/`** com status **Accepted** são fixas até novo ADR com status **Superseded**
5. Specs mestres em **`specs/`** têm precedência sobre suposições do modelo

## Divisão de ferramentas

| Ferramenta                    | Papel                              | Modo                 |
| ----------------------------- | ---------------------------------- | -------------------- |
| **Antigravity** + `GEMINI.md` | Spec, ADR, passos de implementação | Planning             |
| **Cursor** + `.cursor/rules`  | Código, testes, migrations         | Agent / Composer 2.5 |
| **Tab / Ask**                 | Ajustes pontuais, imports, lint    | Inline               |

> **Regra de ouro:** um passo de implementação = **um chat Agent** no Cursor: ≤5 arquivos alterados/criados, 1 módulo/feature (arquivos de referência para leitura não contam nesse limite; ver `token-budget` se existir).

Guardrails adicionais de **execução no Cursor** (hooks, `block-rm`, desabilitar lint/testes): .cursor/AGENTS.md quando existir.

## Instalação e precedência

Ver [README.md](./README.md) — global (`~/.gemini/`) ou por repositório (`@./.cursor/antigravity/`).

**Importante:** `GEMINI.md` ou `AGENTS.md` na **raiz do repo sobrescrevem** os arquivos em `~/.gemini/`. Com instalação global ativa, não mantenha cópias locais na raiz — use `@./.cursor/antigravity/` se precisar de override fino.
