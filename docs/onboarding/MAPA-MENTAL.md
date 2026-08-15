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

Claim Redis **antes** do handler (ADR 0006): a invocação acontece no máximo uma vez entre réplicas. Crash no meio do handler não reprocessa até o TTL (24h) ou até alguém apagar `event:processed:{eventId}`.

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
