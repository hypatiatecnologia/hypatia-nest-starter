# ADR 0007: Requeue em falha transitória do claim Redis

**Status:** Aceito — falha de infraestrutura no claim Redis reentrega a mensagem; só falha de handler ou envelope inválido vai para a DLQ
**Data:** 2026-08-31
**Contexto:** review de produção do starter (`4a5db75`); o comportamento anterior mandava qualquer falha — inclusive Redis indisponível — para a DLQ.

## Contexto

`handleMessage` em `src/rabbitmq/rabbitmq.service.ts` faz `SET NX event:processed:{eventId}` antes do handler (ADR 0006). Antes deste ADR, qualquer exceção nesse caminho era tratada como falha de handler: `nack` sem requeue → DLQ.

A review de produção observou que indisponibilidade de Redis é falha de infraestrutura, não mensagem venenosa. Com o comportamento antigo, um blip transitório de Redis drenava a fila inteira para a DLQ — e o replay exigia apagar `event:processed:{eventId}` manualmente quando o `DEL` do release também falhava (runbook do ADR 0006). O custo operacional era proporcional ao tamanho do blip, e o template ensinava esse comportamento a todo serviço derivado.

## Problem

Como o consumer deve reagir quando o claim do dedupe falha por indisponibilidade de infraestrutura, distinto de handler falhando ou mensagem malformada?

## Alternatives Considered

1. **Manter any-failure → DLQ** (código anterior).
   - Prós: um único caminho de erro, zero código extra no adapter.
   - Contras: blip de Redis converte mensagens válidas em DLQ; cada replay exige limpeza manual de chave Redis; comportamento herdado por todos os derivados.
2. **Requeue com backoff em falha do claim** (adotado).
   - Prós: blip de Redis não drena a fila; a DLQ mantém significado forte (veneno/falha de handler); mudança contida em um método.
   - Contras: redelivery em loop enquanto o Redis estiver fora (limitado pelo prefetch 1); precisa de backoff para não virar nack/redelivery apertado.
3. **Pausar o consumer quando o Redis estiver indisponível** (circuit breaker no consumer).
   - Prós: elimina o loop de redelivery; backpressure real no broker.
   - Contras: acopla o ciclo de vida do consumer ao health do Redis; mais estados no adapter compartilhado — over-engineering para o template, mesmo critério que rejeitou o claim em duas fases no ADR 0006.

## Decision

Adotar a opção 2. `claimDedupeKey` distingue três desfechos: claim adquirido → processar; claim já existe → `ack` (duplicata); erro no `SET NX` → log com a chave + backoff de 2s + `nack(message, false, true)` (requeue). Falha de handler e envelope inválido continuam indo para a DLQ sem requeue.

Compatível com o ADR 0006: o claim continua **antes** do handler e a garantia at-most-once da invocação não muda. Um claim cujo `SET NX` expira sem confirmar se gravou é indistinguível de duplicata na redelivery — cai no caminho "duplicate" e é ackado; nenhum evento se perde.

O teto conhecido é redelivery ilimitado enquanto o Redis estiver fora. Se isso um dia incomodar, o caminho de upgrade é limitar reentregas pela contagem `x-death` e dead-letter — não implementado por antecipação.

## Consequences

- Blips de Redis não geram mais DLQ nem execução do runbook de limpeza de chaves.
- A DLQ volta a significar exclusivamente falha de handler ou envelope inválido.
- Enquanto o Redis estiver fora, o consumer fica em redelivery com backoff de 2s por mensagem (prefetch 1 limita o custo por réplica); a fila cresce no broker, não em memória.
- Novo teste unitário cobre o desfecho: `nack(message, false, true)`, handler não invocado, claim não liberado.

## Trade-offs

Ganha-se tolerância a indisponibilidade de infraestrutura sem toil manual. Paga-se com dois caminhos de falha no adapter compartilhado (infra → requeue, veneno → DLQ) e com redelivery contínuo durante a indisponibilidade — deliberado, pois a alternativa (pausar o consumer) adiciona mais complexidade do que o problema exige neste estágio do template.
