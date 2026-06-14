# Precedência entre rules, commands e skills

Fonte única de verdade citada por `principles`, `architecture` e `cognitive-complexity`.

## Ordem (mais específico / restritivo vence)

1. **`security/*`** da linguagem em contexto — sempre prevalece sobre convenções que enfraqueçam segurança
2. **`architecture`** + **`cognitive-complexity`** — camadas, DIP, invariantes, limites de complexidade
3. **`hypatia-ecosystem`** — somente em repos Pantheon (ativação manual); não ativar em repos Remix/Next
4. **`nestjs-patterns`** ou **`company-patterns`** (conforme stack do repo) sobre regras genéricas de stack
5. **Stack específica** (ex: `typescript-node` sobre validações gerais; `node-express` sobre validação Express)
6. **`errors-and-logging`**, **`naming-and-files`**, **`linguagem-pt-br`** — convenções transversais
7. **`openapi-contracts`** quando houver API pública versionada
8. **Commands** `_shared/commit-message.md` sobre texto duplicado em **`gitflow`** para mensagens de commit
9. **Command do repo** (ex. `review-nest-patterns`, `review-company-patterns`) sobre command global homônimo

## Empate ou conflito

Quando duas rules parecem conflitar:

1. Aplicar a hierarquia acima
2. Se ainda houver dúvida: alternativa **mais segura** e com **menos vazamento** de dados internos
3. Quando segura vs. simples conflitem: **segurança vence**

## Skills (fora de `.mdc`)

Built-ins (gerenciadas pelo Cursor em `~/.cursor/skills-cursor/` — não versionar cópia no repo):

| Situação | Skill |
|----------|-------|
| PR merge-ready (CI, comentários) | `babysit` |
| Dividir trabalho em vários PRs | `split-to-prs` |
| Criar visualizações Canvas | `canvas` |
| Criar nova regra | `create-rule` |
| Criar nova skill | `create-skill` |
| Criar novo hook | `create-hook` |
| Criar subagente especializado | `create-subagent` |
| Migrar commands para skills | `migrate-to-skills` |
| Configurar status line no CLI | `statusline` |
| Modificar settings.json | `update-cursor-settings` |
| Configuração de CLI | `update-cli-config` |
| Comandos shell especializados | `shell` |
| Uso do Cursor SDK | `sdk` |

Do projeto (versionadas): `review-design-system` em `.cursor/skills/review-design-system/SKILL.md`.

Ver `commands/COMMANDS.md` para índice completo.

## Uma fonte de rules no workspace

Não usar symlink `<repo>/.cursor/rules` → `~/.cursor/rules` (duplica `alwaysApply`).

Preferir estrutura local em `.cursor/` com importação explícita quando necessário.

## Referências cruzadas

- Princípios fundamentais: [`principles/rule.mdc`](../principles/rule.mdc)
- Arquitetura e camadas: [`architecture/rule.mdc`](../architecture/rule.mdc)
- Complexidade cognitiva: [`cognitive-complexity/rule.mdc`](../cognitive-complexity/rule.mdc)
- Padrões da empresa: [`company-patterns/rule.mdc`](../company-patterns/rule.mdc)
