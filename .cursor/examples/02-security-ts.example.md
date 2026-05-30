# Exemplo 02 — typescript-security.mdc
# Validação de entrada, IDOR e identidade não forjável

**Rules ativas:** `typescript-security.mdc` (auto-attach via globs `**/*.ts`), `principles/rule.mdc`

---

## Prompt de entrada

```
Crie um endpoint GET /users/:id/documents que retorna os documentos do usuário.
O userId vem do token JWT. Stack: TypeScript + Fastify.
```

---

## Output CORRETO (esperado)

```typescript
// src/infra/http/routes/documents.ts
import { z } from 'zod'
import type { FastifyInstance } from 'fastify'

const paramsSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
})

export async function documentRoutes(app: FastifyInstance) {
  app.get('/users/:id/documents', {
    onRequest: [app.authenticate],  // middleware de auth obrigatório
  }, async (req, reply) => {
    // ✅ identidade vem do token validado no servidor — não do body/query
    const requesterId = req.user.sub  // extraído do JWT verificado pelo middleware

    const params = paramsSchema.parse(req.params)

    // ✅ verificação de ownership — IDOR prevention
    if (requesterId !== params.id) {
      return reply.status(403).send({ code: 'forbidden', message: 'Access denied' })
    }

    const documents = await documentService.findByUserId(params.id)
    return reply.send(documents)
  })
}
```

**Por que está correto:**
- Identidade extraída do JWT validado (`req.user.sub`), nunca do `body` ou `query`.
- Verificação de ownership explícita antes de retornar dados (previne IDOR).
- Parâmetros validados com Zod (UUID — previne injeção via path param malformado).
- 403 com mensagem genérica — não vaza detalhes internos.

---

## Output INCORRETO (proibido pelas rules)

```typescript
// ❌ Viola typescript-security.mdc em 3 pontos
app.get('/users/:id/documents', async (req, reply) => {
  // ❌ CRÍTICO — userId vem do body, forjável pelo cliente (CWE-284)
  const userId = req.body.userId

  // ❌ sem validação do parâmetro de rota
  const { id } = req.params

  // ❌ sem verificação de ownership — qualquer usuário autenticado
  //    pode acessar documentos de qualquer outro usuário (IDOR - A01 OWASP)
  const documents = await db.query(
    `SELECT * FROM documents WHERE user_id = '${id}'`  // ❌ SQL injection
  )

  // ❌ expõe stack trace ao cliente em produção
  try {
    return reply.send(documents.rows)
  } catch (e) {
    return reply.status(500).send({ error: e.message, stack: e.stack })
  }
})
```

**Por que está errado:**
- `req.body.userId` é forjável — viola "identidade de fonte não forjável" (`typescript-security.mdc`).
- Sem verificação de ownership — qualquer usuário pode ver documentos de outros (IDOR, A01 OWASP).
- SQL com interpolação de string — injeção SQL (A03 OWASP).
- Stack trace exposto ao cliente — vaza informações internas (`typescript-security.mdc`).
