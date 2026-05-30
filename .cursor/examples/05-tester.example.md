# Exemplo 05 — tester/rule.mdc
# Cenários obrigatórios, AAA, descoberta de runner

**Rules ativas:** `tester/rule.mdc` (overlay manual), `typescript/rule.mdc` (auto-attach)

---

## Prompt de entrada

```
Gere testes para a função processPayment do arquivo src/application/create-order.use-case.ts.
Stack: TypeScript + Vitest.
```

---

## Output CORRETO (esperado)

```typescript
// src/application/create-order.use-case.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CreateOrderUseCase } from './create-order.use-case'
import { DomainError } from '@/domain/errors'
import type { OrderRepository, StockRepository, BalanceService } from '@/domain/ports'

// Arrange — mocks tipados das portas (não do banco real)
const mockOrders: OrderRepository = {
  save: vi.fn(),
}
const mockStock: StockRepository = {
  check: vi.fn(),
}
const mockBalance: BalanceService = {
  debit: vi.fn(),
}

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new CreateOrderUseCase(mockOrders, mockStock, mockBalance)
  })

  // ✅ Caminho feliz
  it('creates an order when stock is available and balance is sufficient', async () => {
    // Arrange
    vi.mocked(mockStock.check).mockResolvedValue(true)
    vi.mocked(mockBalance.debit).mockResolvedValue(undefined)
    vi.mocked(mockOrders.save).mockResolvedValue({ id: 'order-1', userId: 'u1', productId: 'p1', quantity: 2 })

    // Act
    const result = await useCase.execute({ userId: 'u1', productId: 'p1', quantity: 2, amount: 100 })

    // Assert
    expect(result.id).toBe('order-1')
    expect(mockBalance.debit).toHaveBeenCalledWith('u1', 100)
    expect(mockOrders.save).toHaveBeenCalledOnce()
  })

  // ✅ Entrada inválida — quantidade negativa
  it('throws invalid_quantity when quantity is zero', async () => {
    await expect(
      useCase.execute({ userId: 'u1', productId: 'p1', quantity: 0, amount: 0 })
    ).rejects.toMatchObject({ code: 'invalid_quantity' })
  })

  // ✅ Condição de negócio — sem estoque
  it('throws out_of_stock when stock check fails', async () => {
    vi.mocked(mockStock.check).mockResolvedValue(false)

    await expect(
      useCase.execute({ userId: 'u1', productId: 'p1', quantity: 1, amount: 50 })
    ).rejects.toMatchObject({ code: 'out_of_stock' })

    // debit nunca deve ser chamado se não há estoque
    expect(mockBalance.debit).not.toHaveBeenCalled()
  })

  // ✅ Falha de infra — repositório lança erro
  it('propagates repository errors without swallowing them', async () => {
    vi.mocked(mockStock.check).mockResolvedValue(true)
    vi.mocked(mockBalance.debit).mockResolvedValue(undefined)
    vi.mocked(mockOrders.save).mockRejectedValue(new Error('DB connection timeout'))

    await expect(
      useCase.execute({ userId: 'u1', productId: 'p1', quantity: 1, amount: 50 })
    ).rejects.toThrow('DB connection timeout')
  })
})
```

**Por que está correto:**
- Arrange–Act–Assert estruturado e nomeado em cada teste.
- Cobre: caminho feliz, entrada inválida (zero), condição de negócio (sem estoque), falha de infra.
- Mocks tipados das **portas** (interfaces) — não do banco real — alinhado à arquitetura.
- Verifica que efeitos colaterais **não ocorrem** quando a validação falha (`debit` não chamado).
- Sem `any` — tipagem strict em todo o arquivo de teste.

---

## Output INCORRETO (proibido pelas rules)

```typescript
// ❌ Viola tester/rule.mdc — sem AAA, sem cenários negativos, any espalhado

test('processPayment works', async () => {
  // ❌ sem Arrange separado — mocks inline confusos
  const result = await createOrderUseCase.execute({
    userId: 'u1', productId: 'p1', quantity: 1, amount: 50
  } as any)  // ❌ any — strict seria revelado como erro de tipagem real

  // ❌ assertion genérica que não verifica o que importa
  expect(result).toBeTruthy()
  // ❌ faltam: teste de estoque esgotado, quantidade inválida, falha de infra
})

// ❌ snapshot como único teste — frágil e não documenta intenção
test('order shape', async () => {
  const result = await createOrderUseCase.execute({ userId: 'u1', productId: 'p1', quantity: 1, amount: 50 })
  expect(result).toMatchSnapshot()  // ❌ snapshot quebra em qualquer mudança de campo
})
```

**Por que está errado:**
- Sem Arrange–Act–Assert — difícil entender o que está sendo testado.
- `as any` esconde erros de tipagem reais.
- Sem cenários negativos — coverage de caminho feliz apenas não é suficiente.
- Snapshot como único teste — frágil, não expressa intenção, quebra com qualquer refactor inofensivo.
- `expect(result).toBeTruthy()` — não verifica nada de substância.
