# Exemplo 03 — cognitive-complexity/rule.mdc
# Funções simples, guard clauses, nesting máximo 3

**Rules ativas:** `cognitive-complexity/rule.mdc` (alwaysApply: true)

---

## Prompt de entrada

```
Crie uma função TypeScript que processa um pagamento:
- Valida que o valor é positivo
- Verifica se o usuário tem saldo suficiente
- Verifica se o cartão não está expirado
- Aplica desconto se o usuário for premium
- Registra a transação
- Retorna o resultado
```

---

## Output CORRETO (esperado)

```typescript
// ✅ Guard clauses eliminam nesting profundo
// ✅ Cada validação tem uma função com nome de domínio
// ✅ Função principal ≤ 30 linhas, nesting ≤ 2

function validatePaymentInput(amount: number, card: Card, user: User): void {
  if (amount <= 0) throw new DomainError('invalid_amount', 'Amount must be positive')
  if (isCardExpired(card)) throw new DomainError('card_expired', 'Card is expired')
  if (!hasSufficientBalance(user, amount)) throw new DomainError('insufficient_balance', 'Insufficient balance')
}

function applyDiscount(amount: number, user: User): number {
  return user.isPremium ? amount * 0.9 : amount
}

async function processPayment(
  input: ProcessPaymentInput,
  deps: PaymentDeps,
): Promise<PaymentResult> {
  validatePaymentInput(input.amount, input.card, input.user)   // falha rápido

  const finalAmount = applyDiscount(input.amount, input.user)

  const transaction = await deps.transactions.save({
    userId: input.user.id,
    amount: finalAmount,
    cardId: input.card.id,
  })

  return { transactionId: transaction.id, amount: finalAmount }
}
```

**Por que está correto:**
- `validatePaymentInput` agrupa validações sem duplicar lógica.
- Guard clauses no início — caminho feliz é linear e legível.
- Nesting máximo: 1 nível (o `if` dentro da função de validação).
- Funções com nomes de domínio (`isCardExpired`, `hasSufficientBalance`, `applyDiscount`).
- `processPayment` tem < 15 linhas de código efetivo.

---

## Output INCORRETO (proibido pelas rules)

```typescript
// ❌ Viola cognitive-complexity/rule.mdc
// ❌ Nesting > 3 níveis, função-canivete, flag booleano combinando comportamentos

async function processPayment(amount: number, userId: string, cardId: string, isPremium: boolean, skipValidation: boolean) {
  // ❌ flag booleano que combina comportamentos
  if (!skipValidation) {
    if (amount > 0) {
      const user = await db.findUser(userId)
      if (user) {
        if (user.balance >= amount) {   // nesting: 4 níveis ← PROIBIDO
          const card = await db.findCard(cardId)
          if (card) {
            if (card.expiryDate > new Date()) {  // nesting: 5 níveis ← PROIBIDO
              let finalAmount = amount
              if (isPremium) {  // nesting: 6 níveis ← PROIBIDO
                finalAmount = amount * 0.9
              }
              // regra + persistência + efeito colateral tudo junto
              await db.saveTransaction({ userId, amount: finalAmount, cardId })
              await db.updateBalance(userId, user.balance - finalAmount)
              console.log(`Payment processed: ${finalAmount}`)  // ❌ console.log em produção
              return { success: true, amount: finalAmount }
            } else {
              return { success: false, error: 'card expired' }
            }
          }
        } else {
          return { success: false, error: 'insufficient balance' }
        }
      }
    }
  }
  return { success: false, error: 'invalid' }
}
```

**Por que está errado:**
- Nesting de 6 níveis — limite é 3.
- Flag `skipValidation` combinando comportamentos — `cognitive-complexity/rule.mdc` proíbe.
- Função-canivete: validação + cálculo + persistência + efeito colateral no mesmo corpo.
- `console.log` em produção — proibido por `errors-and-logging/rule.mdc`.
- Cognitive complexity desta função: ~22 (limite é 15).
