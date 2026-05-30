# Kit de onboarding — Hypatia Nest Starter

Documentação para novos desenvolvedores no ecossistema Pantheon. Leia em conjunto com o [README](../../README.md) e o command Cursor `/onboard`.

## Comece aqui (dia 1)

Siga [PRIMEIROS-PASSOS.md](./PRIMEIROS-PASSOS.md) antes do roteiro de 4 semanas:

1. **Trilha A** — `npm ci` + `npm test` (sem Docker).
2. **Trilha B** — API no ar com `archetypes/api.env.example` + infra Docker.
3. **Trilha C** — validar `create-service` no novo diretório.

Problemas: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

## Documentação disponível

| Documento | Conteúdo |
| --- | --- |
| [PRIMEIROS-PASSOS.md](./PRIMEIROS-PASSOS.md) | Setup mínimo — starter + scaffold |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Erros comuns de instalação |
| [GUIA-RAPIDO.md](./GUIA-RAPIDO.md) | Referência diária — comandos, criar módulo, archetypes |
| [GLOSSARIO.md](./GLOSSARIO.md) | Termos Pantheon e NestJS usados no starter |
| [MAPA-MENTAL.md](./MAPA-MENTAL.md) | Fluxo visual HTTP → domínio → infra |
| [../adr/0001-bullmq-vs-rabbitmq-for-hermes.md](../adr/0001-bullmq-vs-rabbitmq-for-hermes.md) | Decisão BullMQ vs RabbitMQ para Hermes |

## Roteiro sugerido (4 semanas)

### Semana 1 — Primeiros passos

1. Conclua [PRIMEIROS-PASSOS.md](./PRIMEIROS-PASSOS.md) (Trilhas A, B e C se for criar serviço).
2. Leia o [README](../../README.md) — Quick start híbrido vs Docker full.
3. Leia comentários em `src/main.ts`, `src/app.module.ts`, `src/rabbitmq/rabbitmq.service.ts`.
4. Explore Swagger: http://localhost:3000/docs/api
5. Aprofunde termos em [GLOSSARIO.md](./GLOSSARIO.md) conforme surgirem dúvidas.

### Semana 2 — Explorando o código

1. Estude `src/common/correlation/` — header `x-correlation-id` e AsyncLocalStorage.
2. Leia [GLOSSARIO.md](./GLOSSARIO.md) — correlation id, HypatiaEvent, DLQ, archetypes.
3. Execute testes: `npm test`, `npm run test:cov`.
4. Teste health com correlation id:

```bash
curl -H 'x-correlation-id: onboarding-week2' http://localhost:3000/health -v
```

5. Revise rule `.cursor/rules/nestjs-patterns/rule.mdc` no Cursor.

### Semana 3 — Arquitetura e mensageria

1. Leia [MAPA-MENTAL.md](./MAPA-MENTAL.md) — fluxo request → publish → consumer.
2. Rode fluxo api → worker (dois terminais, ver README seção Example flow).
3. Observe dedupe Redis e DLQ no RabbitMQ Management UI (http://localhost:15672).
4. Crie um módulo de feature seguindo [GUIA-RAPIDO.md](./GUIA-RAPIDO.md).
5. Use `/review-nest-patterns` no Cursor antes do primeiro PR.

### Semana 4 — Produção e qualidade

1. Configure archetype worker: `cp archetypes/worker.env.example .env`.
2. Leia sobre graceful shutdown (seção abaixo) e health checks.
3. Garanta `npm run lint:ci && npm test` antes de push (hooks Husky).
4. Scaffold de serviço real: `npm run create-service -- meu-servico api`.
5. Remova `ExampleModule` quando não precisar mais do tutorial.

## Exercícios práticos

### Exercício 1 — Cache com Redis

**Objetivo:** adicionar cache em um endpoint.

1. Injete `RedisService` no seu service.
2. Antes de consultar o banco, faça `redis.get('chave')`.
3. Em cache miss, consulte Prisma e `redis.set('chave', valor, ttlSegundos)`.
4. Teste: primeira request mais lenta, segunda instantânea.

Referência: `src/redis/redis.service.ts`, health probe em `src/health.controller.ts`.

### Exercício 2 — Observar DLQ

**Objetivo:** entender dead-letter queue do Pantheon.

1. No consumer (`ExampleEventConsumer`), force um erro no handler.
2. Publique evento via `POST /example/events`.
3. Abra RabbitMQ UI e verifique fila `{RABBITMQ_QUEUE}.dlq`.
4. Corrija o handler e reprocesse manualmente se necessário.

Referência: `src/rabbitmq/rabbitmq.service.ts` — `nack` sem requeue envia para DLX.

### Exercício 3 — Graceful shutdown

**Objetivo:** verificar encerramento seguro do Nest.

1. Inicie `npm run start:dev`.
2. Dispare request longa (simule delay no service).
3. Envie SIGTERM: `kill -SIGTERM <pid>`.
4. Observe logs: Nest fecha HTTP, depois `OnModuleDestroy` em Redis/RabbitMQ/Prisma.

O starter usa `app.enableShutdownHooks()` em `src/main.ts`. Ordem típica:

```
SIGTERM/SIGINT → HTTP stop → consumers cancel → RabbitMQ close → Redis close → Prisma disconnect
```

## Dashboard de padrões

| Padrão | Onde ver | Dificuldade |
| --- | --- | --- |
| Correlation ID + ALS | `src/common/correlation/` | ⭐⭐ |
| Módulo Nest por feature | `src/modules/example/` | ⭐⭐ |
| Envelope HypatiaEvent | `src/rabbitmq/rabbitmq.types.ts` | ⭐⭐ |
| Idempotência consumer | `rabbitmq.service.ts` + Redis dedupe | ⭐⭐⭐ |
| Dead Letter Queue | topologia em `setupTopology()` | ⭐⭐⭐ |
| Archetypes api/worker | `archetypes/*.env.example` | ⭐⭐ |
| Erros com code estável | `src/common/errors/` + filter | ⭐⭐ |

## Boas práticas

### Faça

- Propague `x-correlation-id` em logs, erros e eventos RabbitMQ.
- Publique eventos **após** commit Prisma (`$transaction`) quando houver side effect.
- Use DTOs com `class-validator` na borda HTTP.
- Ofusque payloads sensíveis antes de logar (`redactPayload` em `src/common/logging/`).
- Rode `npm test` localmente — pre-push hook exige suite verde.

### Evite

- PII em logs ou neste starter (delegue ao Hades).
- `process.env` espalhado — use `ConfigService<AppConfig>`.
- Lógica de negócio pesada em controllers.
- Yup ou padrões Idea/Express (ver rule `nestjs-patterns`).
