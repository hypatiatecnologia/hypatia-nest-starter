# Glossário — Hypatia Nest Starter

## Observabilidade

| Termo | Definição |
| --- | --- |
| Correlation ID | Identificador ponta a ponta recebido ou gerado no header `x-correlation-id` e propagado em resposta, logs e eventos. |
| AsyncLocalStorage | API do Node.js usada por `CorrelationContext` para manter contexto por cadeia assíncrona. |
| Pino | Logger JSON estruturado integrado por `nestjs-pino`. |
| Liveness | Sinal de que o processo está ativo em `GET /health/live`. |
| Readiness | Sinal de que as dependências exigidas pelo modo atual estão disponíveis em `GET /health/ready`. |

## Mensageria

| Termo | Definição |
| --- | --- |
| `HypatiaEvent` | Envelope com `eventId`, `type`, `occurredAt`, `correlationId` opcional e `payload`. |
| `hypatia.events` | Topic exchange de exemplo; a routing key corresponde ao tipo do evento. |
| DLX / DLQ | Exchange e fila de dead letters que recebem entregas rejeitadas. |
| Deduplicação | Registro temporário do `eventId` no Redis para evitar processamento repetido. |
| Publisher | Modo que publica eventos a partir de uma API. |
| Consumer | Modo que consome eventos em um worker. |

## NestJS e camadas

| Termo | Definição |
| --- | --- |
| Module | Unidade de composição NestJS que agrupa controllers, providers e imports. |
| Controller | Adaptador HTTP que valida a entrada e delega ao serviço. |
| Service | Caso de uso ou orquestração de domínio e integrações. |
| DTO | Objeto de transferência validado na borda com `class-validator`. |
| ValidationPipe | Validação global com allowlist e rejeição de campos desconhecidos. |
| PrismaService | Cliente PostgreSQL injetável por meio do Prisma ORM. |

## Erros e segurança

| Termo | Definição |
| --- | --- |
| DomainException | Erro de domínio com código estável em snake case. |
| AllExceptionsFilter | Filtro que normaliza respostas de erro e inclui o correlation ID. |
| RFC 7807 | Modelo Problem Details adotado como referência para erros HTTP. |
| PII | Informação pessoal identificável; não deve aparecer em exemplos, fixtures ou logs. |
| `redactPayload` | Helper que mascara campos sensíveis antes do logging. |
| ThrottlerGuard | Limite global de requisições por cliente. |

## Ferramentas

| Termo | Definição |
| --- | --- |
| Archetype | Preset de ambiente para os modos `api`, `worker` e `off`. |
| `create-service` | Script que materializa uma cópia independente do template. |
| `setup-local` | Script que prepara dependências, infraestrutura local e migrações. |
