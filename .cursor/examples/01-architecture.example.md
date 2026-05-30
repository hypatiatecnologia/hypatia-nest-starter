# Exemplo 01 — architecture/rule.mdc
# Separação de camadas e regra de dependência (DIP)

**Rules ativas:** `architecture/rule.mdc` (alwaysApply: true), `cognitive-complexity/rule.mdc`

---

## Prompt de entrada

```
Crie um endpoint POST /orders que recebe { userId, productId, quantity },
valida estoque, debita o saldo do usuário e cria o pedido.
Stack: TypeScript + Fastify.
```

---

## Output CORRETO (esperado)

O agente deve separar em 3 camadas distintas:

```typescript
// src/domain/order.ts — regra pura, sem Fastify, sem DB
export class Order {
  constructor(
    public readonly userId: string,
    public readonly productId: string,
    public readonly quantity: number,
  ) {
    if (quantity <= 0) throw new DomainError('invalid_quantity', 'Quantity must be positive')
  }
}

// src/application/create-order.use-case.ts — orquestra domínio + portas
export class CreateOrderUseCase {
  constructor(
    private readonly orders: OrderRepository,   // porta — interface
    private readonly stock: StockRepository,    // porta — interface
    private readonly balance: BalanceService,   // porta — interface
  ) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    const hasStock = await this.stock.check(input.productId, input.quantity)
    if (!hasStock) throw new DomainError('out_of_stock', 'Product out of stock')

    await this.balance.debit(input.userId, input.amount)
    const order = new Order(input.userId, input.productId, input.quantity)
    return this.orders.save(order)
  }
}

// src/infra/http/routes/orders.ts — handler magro, sem regra de negócio
export async function orderRoutes(app: FastifyInstance) {
  app.post('/orders', { schema: createOrderSchema }, async (req, reply) => {
    const order = await createOrderUseCase.execute(req.body)
    return reply.status(201).send(order)
  })
}
```

**Por que está correto:**
- Domínio não importa Fastify, Prisma ou qualquer infra.
- Casos de uso dependem de interfaces (portas), não de implementações concretas.
- Handler HTTP tem zero lógica de negócio — só valida, delega, mapeia resposta.

---

## Output INCORRETO (proibido pelas rules)

```typescript
// ❌ Viola architecture/rule.mdc — god handler com tudo misturado
app.post('/orders', async (req, reply) => {
  const { userId, productId, quantity } = req.body  // sem validação Zod

  // regra de negócio no handler
  if (quantity <= 0) return reply.status(400).send({ error: 'invalid' })

  // SQL direto no handler — viola DIP
  const stock = await db.query('SELECT stock FROM products WHERE id = $1', [productId])
  if (stock.rows[0].stock < quantity) return reply.status(409).send({ error: 'no stock' })

  // transação + regra de negócio + HTTP no mesmo lugar
  await db.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [price, userId])
  const result = await db.query('INSERT INTO orders (...) VALUES (...) RETURNING *', [...])

  return reply.status(201).send(result.rows[0])
})
```

**Por que está errado:**
- Lógica de negócio (validação de estoque, débito) no handler HTTP.
- SQL direto no controller — viola DIP e a tabela de imports da `architecture/rule.mdc`.
- Impossível testar a regra de negócio sem subir Fastify + banco.
- Mistura de responsabilidades no mesmo módulo (anti-pattern "serviço deus").
