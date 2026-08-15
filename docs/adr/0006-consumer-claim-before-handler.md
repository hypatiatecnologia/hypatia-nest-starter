# ADR 0006: Claim Redis antes do handler no consumer

**Status:** Aceito — manter `SET NX` antes do handler (at-most-once da invocação)
**Data:** 2026-08-15
**Contexto:** revisão do core do starter; o mapa mental descrevia gravar `eventId` depois do sucesso, mas o código (e os testes) já reclamam a chave antes de executar o handler.

## Contexto

RabbitMQ entrega *at-least-once*: crash do consumer, blip de rede ou replay da DLQ reentregam a mesma mensagem. Réplicas concorrentes do worker podem receber a mesma `eventId`.

O código em `src/rabbitmq/rabbitmq.service.ts` faz `SET NX event:processed:{eventId}` (TTL 24h) **antes** de chamar o handler. Quem perde o claim dá `ack` e não processa. Quem ganha e falha tenta `DEL` da chave e `nack` sem requeue (DLQ).

A documentação de onboarding (`MAPA-MENTAL.md`) e a rule `hypatia-ecosystem` sugeriam o inverso: processar, depois lembrar o `eventId` (at-least-once clássico com janela de duplicata).

## Problem

Qual garantia o starter deve ensinar a todo serviço derivado (Hermes, Midas, Athena)?

## Alternatives Considered

1. **Claim depois do sucesso** (como o mapa mental antigo).
   - Prós: at-least-once; crash no handler reprocessa.
   - Contras: duas réplicas podem executar o mesmo efeito; exige handlers estritamente idempotentes; reescreve testes já adotados.
2. **Claim em duas fases** (`processing` → `processed`).
   - Prós: reentrega após crash no meio do handler; ainda serializa réplicas.
   - Contras: mais estados, TTL e código no adapter compartilhado; over-engineering para o template.
3. **Manter claim-before** (código atual) e documentar a garantia.
   - Prós: já testado; evita double-process entre réplicas; mudança mínima.
   - Contras: crash entre claim e `ack` descarta reprocessamento até o TTL; `DEL` falho deixa claim órfã.

## Decision

Adotar a opção 3. Handlers devem ser *crash-safe* (efeito observável só depois de persistência idempotente própria, se o domínio exigir). Não inverter o código sem um ADR sucessor.

Operação: se `redis.del` falhar no nack, logar o erro com a chave e ainda assim dead-letter a mensagem. Replay da DLQ exige apagar `event:processed:{eventId}` manualmente se a claim ainda existir.

## Consequences

- Derivados herdam at-most-once da invocação do handler, não at-least-once de negócio.
- Onboarding e `hypatia-ecosystem` devem descrever claim-before, não o diagrama antigo.
- Outbox transacional continua fora do starter até o primeiro serviço com write+publish crítico (Midas/Athena).

## Trade-offs

Ganha-se exclusão entre réplicas e um adapter simples. Paga-se com a necessidade de runbook (apagar a chave Redis antes de replay) e com handlers que não podem depender de reentrega após crash no meio da execução.
