# ADR 0001: BullMQ vs RabbitMQ para Hermes

**Status:** Aceito — não adotar BullMQ no starter por padrão  
**Data:** 2025-05-30  
**Contexto:** boilerplate Idea usa BullMQ (Redis) em paralelo ao RabbitMQ para jobs com delay, cron e retry fino.

## Contexto

O hypatia-nest-starter padroniza mensageria assíncrona via RabbitMQ com envelope `HypatiaEvent`, exchange `hypatia.events`, DLX e dedupe Redis. O boilerplate Idea separa:

- **RabbitMQ** — eventos entre serviços (com retry TTL e DLQ manual).
- **BullMQ** — jobs locais com delay, cron e retry configurável no Redis.

Hermes (archetype `worker`) pode precisar de jobs adiados ou recorrentes além de consumo de eventos de domínio.

## Decisão

**Não incorporar BullMQ no hypatia-nest-starter neste momento.**

Motivos:

1. **Contrato Pantheon** — eventos cross-service devem usar `HypatiaEvent` + RabbitMQ; introduzir BullMQ no starter misturaria dois bus sem necessidade imediata.
2. **YAGNI** — nenhum serviço Pantheon atual exige delay/cron no template base; RabbitMQ + DLQ cobre falhas e reprocessamento via DLQ.
3. **Complexidade operacional** — BullMQ adiciona filas Redis dedicadas e semântica distinta da Idea (incompatível com topologia Hypatia).
4. **Starter enxuto** — Hermes derivado via `create-service` deve começar simples; jobs ad hoc podem ser handlers RabbitMQ idempotentes.

## Consequências

### Positivas

- Um único bus de eventos documentado no starter.
- Menos dependências e config Redis além de cache/dedupe.
- Onboarding mais simples para novos devs.

### Negativas

- Jobs com **delay fixo longo** ou **cron** exigirão solução futura em Hermes (BullMQ, scheduler k8s, ou delayed messages RabbitMQ).
- Times vindos do boilerplate Idea precisam adaptar padrão BullMQ → RabbitMQ handlers.

## Quando reavaliar

Reabrir esta ADR se Hermes precisar de:

- Cron jobs in-process (ex.: relatório diário).
- Retry com backoff configurável por job (não por mensagem DLQ).
- Filas de trabalho **locais ao serviço** sem semântica de evento de domínio.

Alternativas a considerar na reavaliação:

| Opção | Prós | Contras |
| --- | --- | --- |
| BullMQ module em Hermes only | Delay/cron nativo | Segundo bus, Redis extra |
| RabbitMQ delayed message plugin | Um bus | Infra RabbitMQ mais complexa |
| CronJob k8s + handler HTTP/worker | Simples no app | Depende de orquestrador |

## Referências

- `src/rabbitmq/rabbitmq.service.ts` — contrato atual
- `docs/onboarding/GLOSSARIO.md` — termos Pantheon
