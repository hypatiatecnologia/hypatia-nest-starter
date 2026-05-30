# Glossário — Hypatia Nest Starter

Definições dos termos usados no starter e no ecossistema Pantheon.

## Ecossistema Pantheon

| Termo | Definição |
| --- | --- |
| **Pantheon** | Conjunto de microserviços Hypatia (Cerberus, Argus, Hades, Athena, Midas, Hermes, Nemesis). |
| **Cerberus** | API Gateway — ponto de entrada HTTP externo. |
| **Argus** | Serviço de autenticação/autorização (JWT). |
| **Hades** | Data vault LGPD — único serviço que armazena PII em claro. |
| **Athena** | Core de negócio — archetype `api`. |
| **Midas** | Pagamentos — archetype `api`, idempotency keys obrigatórias. |
| **Hermes** | Worker assíncrono — archetype `worker`. |
| **Nemesis** | Antifraude — archetype `api`. |

## Observabilidade

| Termo | Definição |
| --- | --- |
| **Correlation ID** | Identificador de rastreio ponta a ponta. Header HTTP: `x-correlation-id`. Propaga para logs Pino, erros JSON e eventos RabbitMQ. |
| **AsyncLocalStorage (ALS)** | API Node que guarda correlation id por request/async chain. Implementado em `CorrelationContext`. |
| **Pino** | Logger JSON estruturado usado via `nestjs-pino`. |

## Mensageria

| Termo | Definição |
| --- | --- |
| **HypatiaEvent** | Envelope canônico: `eventId`, `type`, `occurredAt`, `correlationId`, `payload`. |
| **Exchange `hypatia.events`** | Topic exchange — routing key = tipo do evento (`order.created`). |
| **DLX / DLQ** | Dead Letter Exchange/Queue — mensagens que falharam vão para `{queue}.dlq`. |
| **Dedupe** | Idempotência por `eventId` via Redis (`event:processed:{eventId}`, TTL 24h). |
| **Archetype publisher** | Serviço REST que publica eventos (`RABBITMQ_MODE=publisher`). |
| **Archetype consumer** | Worker que consome fila (`RABBITMQ_MODE=consumer`). |

## NestJS e camadas

| Termo | Definição |
| --- | --- |
| **Module** | Unidade de composição Nest — agrupa controllers, providers, imports. |
| **Controller** | Adaptador HTTP — valida DTO, delega ao service. |
| **Service** | Caso de uso / orquestração — regra de negócio e integrações. |
| **DTO** | Data Transfer Object — validado com `class-validator` na borda. |
| **ValidationPipe** | Pipe global que aplica DTOs (`whitelist`, `forbidNonWhitelisted`). |
| **PrismaService** | Cliente PostgreSQL injetável — acesso ao banco via Prisma ORM. |

## Erros

| Termo | Definição |
| --- | --- |
| **DomainException** | Erro de negócio com `code` snake_case estável (ex.: `order_not_found`). |
| **AllExceptionsFilter** | Filter global que normaliza respostas de erro com `correlationId` e `code`. |
| **RFC 7807** | Problem Details for HTTP APIs — formato `type`, `title`, `status`, `code`. |

## Infra e ops

| Termo | Definição |
| --- | --- |
| **Health check** | `GET /health` — probe Postgres, Redis e RabbitMQ; 503 se degradado. |
| **Graceful shutdown** | Encerramento ordenado via `enableShutdownHooks()` — fecha conexões antes de sair. |
| **Archetype** | Preset de env (`api`, `worker`, `off`) em `archetypes/`. |
| **create-service** | Script que copia starter para novo repo Pantheon com `.cursor/`. |

## Segurança

| Termo | Definição |
| --- | --- |
| **PII** | Personally Identifiable Information — não armazenar neste starter; usar Hades. |
| **redactPayload** | Helper que ofusca campos sensíveis antes de logar objetos. |
| **ThrottlerGuard** | Rate limit global (100 req/60s por IP). |
