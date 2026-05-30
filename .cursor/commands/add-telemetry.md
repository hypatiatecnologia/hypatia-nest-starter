---
description: Adiciona traces/métricas/logs na borda infra; confirma antes de instalar SDKs.
---

**Objetivo:** instrumentação alinhada a errors-and-logging e architecture.

**Quando usar:** feature nova ou gap de observabilidade.

**Done when:** spans/logs/métricas documentados; sem PII em telemetria.

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md)

# /add-telemetry — Instrumentação de Observabilidade

Use este command quando precisar adicionar ou revisar observabilidade em código existente: traces OpenTelemetry, métricas Prometheus, logs estruturados correlacionados.

> Seguir [errors-and-logging/rule.mdc](../rules/errors-and-logging/rule.mdc) para logging.
> Seguir [architecture/rule.mdc](../rules/architecture/rule.mdc) — instrumentação pertence à camada de Infra/Adaptadores; domínio não importa SDK de telemetria.

---

## Fase 1 — Reconhecimento do contexto de observabilidade

Antes de instrumentar, identificar o que já existe:

| O que verificar | Onde procurar |
|---|---|
| SDK de traces instalado? | `package.json` (`@opentelemetry/*`), `pom.xml` (`opentelemetry-*`), `go.mod` (`go.opentelemetry.io`) |
| Exporter configurado? | `src/instrumentation.ts`, `main.go`, `Application.java`, `otel-config.*` |
| Métricas com Prometheus? | `prom-client` (Node), `micrometer` (Spring), `prometheus/client_golang` (Go) |
| Correlation ID propagado? | Middleware de request ID, `AsyncLocalStorage`, MDC (Java), context (Go) |
| Sampling configurado? | Variável `OTEL_TRACES_SAMPLER` ou config de SDK |

Reportar o estado atual antes de propor qualquer adição.

Se nenhum SDK de traces estiver instalado, propor a instalação mínima para a stack detectada antes de continuar para a Fase 2:

| Stack | Pacotes a instalar | Arquivo de inicialização |
|---|---|---|
| Node/TypeScript | `@opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-http` | `src/instrumentation.ts` (carregar antes de qualquer import de app) |
| Go | `go.opentelemetry.io/otel go.opentelemetry.io/otel/sdk` | `main.go` antes de `http.ListenAndServe` |
| Java/Spring | `spring-boot-starter-actuator micrometer-core` | `application.yml` — `management.endpoints.web.exposure.include` |
| Python | `opentelemetry-sdk opentelemetry-exporter-otlp` | antes do `app = FastAPI()` ou `app.run()` |

Aguardar confirmação do usuário antes de instalar dependências.

---

## Fase 2 — O que instrumentar (por tipo de projeto)

Determinar o tipo de projeto detectado na Fase 1 e aplicar apenas as instrumentações relevantes:

### API HTTP (entry point com rotas)

1. **Spans em operações de I/O** — toda chamada a banco, fila, API externa ou cache deve criar um span filho.
2. **Request/response logging estruturado** — campos mínimos: `method`, `path`, `status`, `duration_ms`, `request_id`/`trace_id`.
3. **Métricas RED** no entry point HTTP:
   - `http_requests_total{method, route, status}` — contador
   - `http_request_duration_seconds{method, route}` — histograma

### Worker / Job (consumidor de fila ou cron)

1. **Span por mensagem processada** — `span.name` = nome do job/consumer, atributo `messaging.destination` = nome da fila/tópico.
2. **Log estruturado por mensagem** — campos mínimos: `job`, `message_id`, `trace_id`, `duration_ms`, `status` (success/error/retry).
3. **Métricas de throughput** — `jobs_processed_total{job, status}` e `job_duration_seconds{job}`.
4. **Não aplicar métricas RED de HTTP** — workers não têm request/response HTTP no caminho crítico.

### CLI

1. **Log estruturado por execução** — campos mínimos: `command`, `args`, `duration_ms`, `exit_code`.
2. Traces e métricas são opcionais para CLIs de uso manual; obrigatórios se o CLI rodar em modo daemon ou for chamado por automação.

### Recomendado em operações críticas de negócio (todos os tipos)

4. **Span com atributos de domínio** — ex.: `order.id`, `payment.method` (nunca PII ou valores sensíveis como CPF, cartão, senha).
5. **Eventos de negócio no span** — `span.addEvent("payment.declined", { reason: "insufficient_balance" })`.
6. **Alertas** — definir SLO de latência e taxa de erro; alertar quando `p99 > threshold` ou `error_rate > 1%`.

---

## Fase 3 — Padrões por stack

### TypeScript / Node (OpenTelemetry SDK)

```typescript
// src/instrumentation.ts — inicializar ANTES de qualquer import de app
import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource } from '@opentelemetry/resources'
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

const sdk = new NodeSDK({
  resource: new Resource({ [SEMRESATTRS_SERVICE_NAME]: process.env.SERVICE_NAME }),
  traceExporter: new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT }),
})
sdk.start()
```

```typescript
// Span manual em operação crítica de negócio
import { trace, SpanStatusCode } from '@opentelemetry/api'

const tracer = trace.getTracer('payment-service')

async function processPayment(input: PaymentInput): Promise<PaymentResult> {
  return tracer.startActiveSpan('payment.process', async (span) => {
    try {
      span.setAttributes({
        'payment.method': input.method,    // ✅ atributo de negócio
        'payment.currency': input.currency, // ✅ sem PII — nunca número do cartão
      })
      const result = await chargeProvider.charge(input)
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) })
      span.recordException(err as Error)
      throw err
    } finally {
      span.end()
    }
  })
}
```

### Go (OpenTelemetry SDK)

```go
// Span em handler — propagação automática via context
func (h *OrderHandler) GetUserOrders(w http.ResponseWriter, r *http.Request) {
    ctx, span := tracer.Start(r.Context(), "order.findByUser")
    defer span.End()

    span.SetAttributes(attribute.String("user.id", userID)) // ✅ sem PII

    orders, err := h.service.FindByUserID(ctx, userID) // ctx propagado
    if err != nil {
        span.SetStatus(codes.Error, err.Error())
        span.RecordError(err)
        // ...
    }
}
```

### Java / Spring (Micrometer + OpenTelemetry)

```java
// Métricas via Micrometer — já integrado com Spring Boot Actuator
@Service
public class PaymentService {
    private final MeterRegistry meterRegistry;
    private final Counter paymentCounter;

    public PaymentService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.paymentCounter = Counter.builder("payments.processed")
            .tag("status", "unknown") // substituído dinamicamente
            .register(meterRegistry);
    }

    public PaymentResult process(PaymentRequest request) {
        Timer.Sample sample = Timer.start(meterRegistry);
        try {
            PaymentResult result = chargeProvider.charge(request);
            meterRegistry.counter("payments.processed", "status", "success").increment();
            return result;
        } catch (PaymentDeclinedException e) {
            meterRegistry.counter("payments.processed", "status", "declined").increment();
            throw e;
        } finally {
            sample.stop(Timer.builder("payments.duration").register(meterRegistry));
        }
    }
}
```

---

## Fase 4 — Regras de segurança para telemetria

- **Proibido** incluir nos spans/logs: CPF, número de cartão, senha, token de sessão, dados bancários, email completo.
- **Obrigatório** mascarar PII antes de emitir: `user.id` (UUID) ✅, `user.email` ❌.
- **Proibido** exportar traces para endpoint público sem autenticação.
- **Obrigatório** configurar sampling em produção — `OTEL_TRACES_SAMPLER=parentbased_traceidratio` com taxa < 100% em alto volume para controlar custo.

---

## Fase 5 — Checklist de instrumentação

Para cada item ❌: gerar o código ou configuração necessária para corrigir antes de encerrar.

- [ ] SDK inicializado antes do servidor HTTP / entry point do worker?
- [ ] Correlation ID (`trace_id` / `request_id`) presente em todos os logs de request/job?
- [ ] Spans criados nas operações críticas de I/O (banco, fila, API externa)?
- [ ] Atributos de domínio sem PII nos spans?
- [ ] Métricas adequadas ao tipo de projeto configuradas (RED para HTTP; throughput para Worker)?
- [ ] `/healthz` e `/readyz` excluídos dos traces (evitar ruído)?
- [ ] Sampling configurado para produção?
- [ ] Nenhum dado sensível nos atributos de span ou logs?
