# Exemplo 04 — errors-and-logging/rule.mdc
# DomainError com code estável, RFC 7807, logging estruturado

**Rules ativas:** `errors-and-logging/rule.mdc` (alwaysApply: true), `typescript/rule.mdc` (auto-attach)

---

## Prompt de entrada

```
Crie o handler de erros global do Fastify para uma API TypeScript.
Deve tratar erros de domínio, erros de validação Zod e erros inesperados.
```

---

## Output CORRETO (esperado)

```typescript
// src/infra/http/error-handler.ts
import type { FastifyInstance, FastifyError } from 'fastify'
import { ZodError } from 'zod'
import { DomainError } from '@/domain/errors'

// Mapa de code de domínio → HTTP status
const DOMAIN_STATUS: Record<string, number> = {
  not_found:             404,
  forbidden:             403,
  invalid_input:         400,
  out_of_stock:          409,
  insufficient_balance:  402,
  card_expired:          422,
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    const requestId = request.id

    // Erro de domínio — code estável, status derivado do mapa
    if (error instanceof DomainError) {
      app.log.warn({ requestId, code: error.code, err: error }, 'domain error')
      return reply.status(DOMAIN_STATUS[error.code] ?? 400).send({
        type:   `https://errors.example.com/${error.code}`,
        title:  error.message,
        status: DOMAIN_STATUS[error.code] ?? 400,
        code:   error.code,            // ✅ code estável legível por máquina
      })
    }

    // Erro de validação Zod
    if (error instanceof ZodError) {
      app.log.info({ requestId, issues: error.issues }, 'validation error')
      return reply.status(400).send({
        type:   'https://errors.example.com/validation_error',
        title:  'Validation failed',
        status: 400,
        code:   'validation_error',
        errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
      })
    }

    // Erro inesperado — log detalhado no servidor, resposta genérica ao cliente
    app.log.error({ requestId, err: error }, 'unexpected error')  // ✅ log estruturado com requestId
    return reply.status(500).send({
      type:   'https://errors.example.com/internal_error',
      title:  'An unexpected error occurred',
      status: 500,
      code:   'internal_error',
      // ✅ sem stack trace, sem mensagem interna ao cliente
    })
  })
}
```

**Por que está correto:**
- Três casos distintos tratados com handler central — não try/catch em cada controller.
- `DomainError` com `code` estável em snake_case — legível por máquina e por humano.
- HTTP status derivado do `code` no boundary — não hardcoded na camada de domínio.
- Log estruturado com `requestId` e nível correto (`warn` para domain, `error` para inesperado).
- Cliente nunca recebe stack trace, mensagem SQL ou path interno.
- Formato RFC 7807 (Problem+JSON): `type`, `title`, `status`, `code`.

---

## Output INCORRETO (proibido pelas rules)

```typescript
// ❌ Viola errors-and-logging/rule.mdc em múltiplos pontos
app.setErrorHandler((error, request, reply) => {
  // ❌ catch genérico que não classifica o erro
  console.error('Error occurred:', error)  // ❌ console.log + ❌ log não estruturado

  if (error.statusCode) {
    // ❌ expõe mensagem interna diretamente ao cliente
    return reply.status(error.statusCode).send({ error: error.message })
  }

  // ❌ stack trace exposto ao cliente em produção
  return reply.status(500).send({
    error: 'Internal Server Error',
    message: error.message,     // ❌ pode vazar detalhes de implementação
    stack: error.stack,         // ❌ CRÍTICO — expõe paths internos e versões
    query: error.query,         // ❌ pode vazar SQL ao cliente
  })
})
```

**Por que está errado:**
- `console.error` em vez de logger estruturado — não tem `requestId`, não é JSON.
- `error.message` ao cliente sem sanitização — pode vazar detalhes SQL, paths, versões.
- `error.stack` ao cliente — CRÍTICO, exposição de informação interna (CWE-209).
- Sem `code` estável — o cliente recebe texto livre que pode mudar a qualquer momento.
- Sem distinção entre tipo de erro — tudo vira 500 ou usa `statusCode` genérico.
