# Precedência entre rules, commands e skills

Fonte única de verdade citada por `principles`, `architecture` e `cognitive-complexity`.

## Ordem (mais específico / restritivo vence)

1. **`security/*`** da linguagem em contexto — sempre prevalece sobre convenções que enfraqueçam segurança
2. **`architecture`** + **`cognitive-complexity`** — camadas, DIP, invariantes, limites de complexidade
3. **`hypatia-ecosystem`** — quando presente (repos Hypatia), topologia Pantheon e regras transversais
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

| Situação | Skill | Localização |
|----------|-------|-------------|
| PR merge-ready (CI, comentários) | `babysit` | `skills-cursor/babysit/SKILL.md` |
| Dividir trabalho em vários PRs | `split-to-prs` | `skills-cursor/split-to-prs/SKILL.md` |
| Criar visualizações Canvas | `canvas` | `skills-cursor/canvas/SKILL.md` |
| Criar nova regra | `create-rule` | `skills-cursor/create-rule/SKILL.md` |
| Criar nova skill | `create-skill` | `skills-cursor/create-skill/SKILL.md` |
| Criar novo hook | `create-hook` | `skills-cursor/create-hook/SKILL.md` |
| Criar subagente especializado | `create-subagent` | `skills-cursor/create-subagent/SKILL.md` |
| Migrar commands para skills | `migrate-to-skills` | `skills-cursor/migrate-to-skills/SKILL.md` |
| Configurar status line no CLI | `statusline` | `skills-cursor/statusline/SKILL.md` |
| Modificar settings.json | `update-cursor-settings` | `skills-cursor/update-cursor-settings/SKILL.md` |
| Configuração de CLI | `update-cli-config` | `skills-cursor/update-cli-config/SKILL.md` |
| Comandos shell especializados | `shell` | `skills-cursor/shell/SKILL.md` |
| Uso do Cursor SDK | `sdk` | `skills-cursor/sdk/SKILL.md` |

Ver `commands/COMMANDS.md` para índice completo.

## Uma fonte de rules no workspace

Não usar symlink `<repo>/.cursor/rules` → `~/.cursor/rules` (duplica `alwaysApply`).

Preferir estrutura local em `.cursor/` com importação explícita quando necessário.

## Referências cruzadas

- Princípios fundamentais: [`principles/rule.mdc`](../principles/rule.mdc)
- Arquitetura e camadas: [`architecture/rule.mdc`](../architecture/rule.mdc)
- Complexidade cognitiva: [`cognitive-complexity/rule.mdc`](../cognitive-complexity/rule.mdc)
- Padrões da empresa: [`company-patterns/rule.mdc`](../company-patterns/rule.mdc)
