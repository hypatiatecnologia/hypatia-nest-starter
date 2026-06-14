---
description: Valida a integridade, sintaxe e links internos de todas as Cursor Rules (.mdc) do repositório.
---

**Objetivo:** Rodar o linter de Cursor Rules para garantir consistência e detectar links quebrados.

**Quando usar:** 
- Sempre que criar ou modificar um arquivo `.mdc` em `.cursor/rules/`.
- Ao alterar o índice `.cursor/rules/RULES.md`.
- Antes de submeter um Pull Request que altere configurações de agente.

**Não usar quando:** 
- Quiser rodar testes de produção (use `/test`).
- Quiser auditar dependências do projeto (use `/deps-audit`).

**Done when:** O script `scripts/lint-cursor-rules.cjs` rodar e retornar sucesso (exit code 0).

---

## Como rodar o validador

Execute o seguinte comando no terminal do projeto:

```bash
node scripts/lint-cursor-rules.cjs
```

## O que é verificado
1. **Indexação:** Se todas as regras registradas em `RULES.md` existem fisicamente.
2. **Frontmatter:** Se as regras possuem `description` e `alwaysApply` ou `globs`.
3. **Links Quebrados:** Se referências cruzadas como `[link](mdc:../regra/rule.mdc)` ou links normais resolvem para caminhos reais no repositório.
