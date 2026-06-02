# Mapa mental — fluxos do Hypatia Nest Starter

Visualização de como os componentes se conectam no archetype **api** (publisher).

## Fluxo HTTP → evento

```mermaid
sequenceDiagram
  participant Client
  participant Cerberus as Cerberus_Gateway
  participant Nest as NestJS_API
  participant Corr as CorrelationMiddleware
  participant Ctrl as ExampleController
  participant Svc as ExampleService
  participant RMQ as RabbitMqService
  participant Redis
  participant PG as PostgreSQL

  Client->>Cerberus: HTTP + x-correlation-id
  Cerberus->>Nest: proxy request
  Nest->>Corr: middleware
  Corr->>Corr: ALS.set correlationId
  Corr->>Ctrl: validated DTO
  Ctrl->>Svc: publishEvent
  Svc->>RMQ: publish type + payload
  RMQ->>RMQ: HypatiaEvent envelope
  RMQ-->>Client: response + correlationId

  Note over PG,Redis: Health probe usa PG + Redis
  Nest->>PG: SELECT 1
  Nest->>Redis: ping key
```

## Fluxo worker (consumer)

```mermaid
sequenceDiagram
  participant RMQ as RabbitMQ
  participant Consumer as RabbitMqService
  participant Handler as ExampleEventConsumer
  participant Redis
  participant DLQ as DLQ_queue

  RMQ->>Consumer: message HypatiaEvent
  Consumer->>Redis: exists event:processed:id
  alt duplicate
    Consumer->>RMQ: ack skip
  else new event
    Consumer->>Handler: handler event
    alt success
      Handler-->>Consumer: ok
      Consumer->>Redis: set dedupe TTL 24h
      Consumer->>RMQ: ack
    else failure
      Handler-->>Consumer: throw
      Consumer->>RMQ: nack no requeue
      RMQ->>DLQ: dead letter
    end
  end
```

## Camadas do projeto

```text
┌─────────────────────────────────────────────────────────┐
│  Borda HTTP (main.ts)                                    │
│  correlationMiddleware · ValidationPipe · helmet · Pino  │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  Adaptadores (controllers / consumers)                     │
│  src/modules/<feature>/*.controller.ts                   │
│  src/modules/<feature>/*-event.consumer.ts               │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  Aplicação (services)                                    │
│  src/modules/<feature>/*.service.ts                      │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  Infra compartilhada                                     │
│  Prisma · Redis · RabbitMQ · HttpClient                  │
└─────────────────────────────────────────────────────────┘
```

## Topologia RabbitMQ

```text
                    publish (routing key = event.type)
  [API Service] ──────────────────────────► hypatia.events (topic)
                                                    │
                                                    │ bind #
                                                    ▼
                                            hypatia-service.events
                                                    │
                              handler fail nack ────┼──► hypatia.events.dlx
                                                    │              │
                                                    │              ▼
                                                    │    hypatia-service.events.dlq
                                                    ▼
                                            [Worker Service]
```

## Onde aprender cada peça

| Fluxo | Arquivo principal |
| --- | --- |
| Bootstrap | `src/main.ts` |
| Auto-discovery de módulos | `src/common/module-discovery/module-discovery.ts` |
| Correlation | `src/common/correlation/` |
| Publish | `src/rabbitmq/rabbitmq.service.ts` |
| Consume | `src/modules/example/example-event.consumer.ts` |
| Health | `src/health.controller.ts` |
| Erros | `src/common/filters/all-exceptions.filter.ts` |
| HTTP outbound | `src/http/http-client.service.ts` |
