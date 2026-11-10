# ADR 0008: Deduplicação isolada por fila

**Status:** Adotado nesta revisão; substitui o formato de chave dos ADRs 0006 e 0007
**Data:** 2026-11-09

## Contexto e evidência

O teste `deduplicates replicas of a queue without suppressing another subscription`
reproduziu a falha em `c454c4a`: duas filas recebem o mesmo evento e compartilham
Redis, mas somente o primeiro handler roda. A chave global
`event:processed:{eventId}` contradiz o fan-out por assinaturas do exchange topic.
O teste falhou antes de alterar produção: o segundo handler teve zero chamadas.

## Decisão

Usar `event:processed:{encodeURIComponent(queue)}:{encodeURIComponent(eventId)}`.
Codificar ambos os segmentos evita colisões quando contêm `:` ou `%`.
Réplicas da mesma fila disputam a mesma chave; filas diferentes processam o evento
independentemente. O contrato do envelope e as assinaturas públicas permanecem iguais.
O claim-before, TTL de 24h e requeue com backoff permanecem como nos ADRs anteriores.

## Migração e recuperação

As chaves antigas não identificam qual fila processou o evento e não podem ser
copiadas com segurança para todas as filas. Não consultar a chave global como
fallback: isso preservaria o descarte entre assinaturas.

Em serviços existentes, parar os publishers, drenar as filas e aguardar os handlers
ativos terminarem; interromper todas as réplicas antigas antes de iniciar as novas.
Evitar rolling deploy com versões mistas: elas disputam chaves diferentes e podem
executar o mesmo evento. Preservar a identidade das filas ao atualizar.
Redeliveries e replay de eventos anteriores ao corte podem executar novamente:
handlers com efeitos de negócio precisam de idempotência persistente própria.
Não apagar chaves globais durante a transição; elas expiram pelo TTL.
Rollback também exige pausar o tráfego e interromper todas as réplicas novas antes
de iniciar as antigas; redeliveries que só tenham a chave nova podem executar de novo.

Para replay após falha de `DEL`, remover somente a chave da fila e evento afetados,
no formato novo, antes de republicar a mensagem da DLQ.

## Limites preservados

Claim-before não garante conclusão nem exactly-once: crash após `SET NX` ou timeout
cuja escrita foi aplicada pode impedir a primeira execução ou sua conclusão até o
TTL. Isso corrige a afirmação de ausência de perda no ADR 0007 sem editar o ADR aceito.
A exclusão vale durante o TTL; handlers que ultrapassem 24h podem se sobrepor.
Testes com mocks provam o escopo da chave; atomicidade/distribuição com Redis e broker
reais exigem teste de integração separado.
