# Exemplo 06 — gitflow/rule.mdc
# Conventional Commits — formato, tipos e restrições

**Rules ativas:** `gitflow/rule.mdc` (alwaysApply: true)

---

## Prompt de entrada (via /commit)

```
/commit
```
*(com os seguintes arquivos em stage)*
```
src/application/create-order.use-case.ts   — novo arquivo
src/domain/order.ts                         — novo arquivo
src/infra/http/routes/orders.ts             — novo arquivo
src/application/create-order.use-case.test.ts — novo arquivo
```

---

## Output CORRETO (esperado)

```
feat(orders): adicionar caso de uso de criação de pedido com validação de estoque

Implementa CreateOrderUseCase orquestrando verificação de estoque, débito de
saldo e persistência do pedido. Domínio separado da infra via portas tipadas.
Inclui testes unitários cobrindo caminho feliz, estoque esgotado e falha de infra.
```

**Por que está correto:**
- `feat` — novo comportamento visível pelo usuário (correto para criação de novo caso de uso).
- `(orders)` — escopo específico, não genérico.
- Descrição ≤ 72 caracteres no título, imperativo, sem ponto final.
- Body explica **por quê** e o que mudou de arquitetura, não apenas lista os arquivos.
- Menciona testes incluídos — informação relevante para o revisor.

---

## Outputs INCORRETOS (proibidos pelas rules)

```
# ❌ WIP — explicitamente proibido pelo gitflow/rule.mdc
WIP

# ❌ sem escopo, sem tipo, vago
fix stuff

# ❌ tipo errado — não é um fix, é uma feature nova
fix(orders): criar pedido

# ❌ ponto final no título — proibido
feat(orders): adicionar criação de pedido.

# ❌ título > 72 caracteres
feat(orders): adicionar caso de uso completo de criação de pedido com validação de estoque e débito

# ❌ não imperativo — "adicionado" em vez de "adicionar"
feat(orders): adicionado caso de uso de criação de pedido

# ❌ sem tipo — não segue Conventional Commits
orders: criação de pedido

# ❌ body descreve "o quê" (lista de arquivos) em vez de "por quê"
feat(orders): adicionar criação de pedido

Arquivos alterados:
- src/application/create-order.use-case.ts
- src/domain/order.ts
- src/infra/http/routes/orders.ts
```

**Regra de seleção de tipo:**

| Situação | Tipo correto |
|---|---|
| Novo comportamento visível pelo usuário | `feat` |
| Correção de bug em comportamento existente | `fix` |
| Mover código sem mudar comportamento | `refactor` |
| Adicionar/corrigir testes | `test` |
| Atualizar documentação | `docs` |
| Atualizar deps, build, config CI | `chore` ou `build` ou `ci` |
| Melhoria mensurável de performance | `perf` |
