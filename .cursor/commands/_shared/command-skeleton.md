# Esqueleto de command (agent harness)

Todo command deve deixar explícito no início do corpo (após o frontmatter):

| Campo | Conteúdo |
|-------|----------|
| **Objetivo** | Uma frase: o que entregar ao usuário |
| **Quando usar** | Situação que dispara este `/` |
| **Não usar quando** | Command alternativo (link `./outro.md` ou skill) |
| **Restrições** | Proibições e limites de escopo |
| **Done when** | Critério verificável de conclusão |

## Precedência

1. Command em **`.cursor/commands/` do repositório aberto** (se existir com o mesmo nome)
2. Command global em **`~/.cursor/commands/`**
3. Rules em `.cursor/rules/` e user rules

## Boas práticas Cursor

- **Plan Mode** (`Shift+Tab`): refactors grandes, migrations, `create-playbook-doc` — planejar antes de executar centenas de linhas de diff.
- **Critérios verificáveis**: lint, testes, `npx commitlint` — não declarar “pronto” sem evidência.
- **Contexto**: preferir `@arquivo` quando souber o path; senão deixar o agente buscar — ver [Agent Best Practices](https://cursor.com/blog/agent-best-practices).
