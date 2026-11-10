# Mapa mental — Hypatia Nest Starter

## Fluxo HTTP e publicação

```mermaid
sequenceDiagram
  participant Client
  participant Gateway
  participant API
  participant Service
  participant Broker as RabbitMQ

  Client->>Gateway: HTTP + x-correlation-id
  Gateway->>API: request
  API->>API: validate DTO and bind correlation
  API->>Service: execute use case
  Service->>Broker: publish HypatiaEvent
  API-->>Client: response + x-correlation-id
```

## Fluxo do worker

Claim Redis **antes** do handler (ADRs 0006 e 0008): réplicas da mesma fila disputam
`event:processed:{encodeURIComponent(queue)}:{encodeURIComponent(eventId)}`. Filas
diferentes processam suas próprias assinaturas, mesmo compartilhando Redis.
O claim suprime reentregas durante o TTL (24h); crash após o claim pode impedir
a execução ou conclusão do handler. Handlers com efeitos de negócio precisam de
idempotência persistente própria. Para replay após falha de liberação, apagar
somente a chave da fila e evento afetados. Serviços existentes devem seguir o
procedimento de migração do [ADR 0008](../adr/0008-queue-scoped-event-deduplication.md).

```mermaid
sequenceDiagram
  participant Broker as RabbitMQ
  participant Worker
  participant Redis
  participant DLQ

  Broker->>Worker: HypatiaEvent
  Worker->>Redis: SET NX eventId
  alt claim lost
    Worker->>Broker: acknowledge
  else claimed
    Worker->>Worker: run handler
    alt success
      Worker->>Broker: acknowledge
    else failure
      Worker->>Redis: DEL eventId
      Worker->>Broker: reject without requeue
      Broker->>DLQ: dead letter
    end
  end
```

## Camadas

```text
HTTP boundary
  -> controllers and event consumers
    -> application services
      -> Prisma, Redis, RabbitMQ and outbound HTTP adapters
```

## Topologia genérica

```text
gateway -> api --publish--> hypatia.events --route--> worker
             |                                  |
             +--> PostgreSQL / Redis             +--> DLQ on failure
```

## Pontos de entrada no código

| Fluxo | Arquivo |
| --- | --- |
| Bootstrap | `src/main.ts` |
| Descoberta de módulos | `src/common/module-discovery/module-discovery.ts` |
| Correlation ID | `src/common/correlation/` |
| Publicação e consumo | `src/rabbitmq/rabbitmq.service.ts` |
| Consumer de exemplo | `src/modules/example/example-event.consumer.ts` |
| Health | `src/health.controller.ts` |
| Erros | `src/common/filters/all-exceptions.filter.ts` |
| HTTP de saída | `src/http/http-client.service.ts` |
