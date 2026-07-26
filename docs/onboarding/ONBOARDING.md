# Onboarding — Hypatia Nest Starter

Este guia apresenta o template como referência pública e independente de uma topologia organizacional específica.

## Percurso recomendado

1. Siga [PRIMEIROS-PASSOS.md](./PRIMEIROS-PASSOS.md) para instalar dependências e executar a suíte.
2. Leia o [README](../../README.md) para escolher `api`, `worker` ou `off`.
3. Explore o [mapa mental](./MAPA-MENTAL.md) e o [glossário](./GLOSSARIO.md).
4. Abra o Swagger em `http://localhost:3000/docs/api`.
5. Consulte [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) quando um pré-requisito falhar.

## O que observar

| Tema | Código |
| --- | --- |
| Bootstrap e shutdown | `src/main.ts` |
| Configuração tipada | `src/config/` |
| Correlation ID | `src/common/correlation/` |
| DTOs e erros | `src/modules/example/`, `src/common/filters/` |
| Persistência | `src/prisma/` e `prisma/` |
| Cache e deduplicação | `src/redis/`, `src/rabbitmq/` |
| Health | `src/health.controller.ts` |

## Exercícios

### Verificar observabilidade

```bash
curl -i -H 'x-correlation-id: onboarding-example' http://localhost:3000/health
```

Confirme o header de resposta e o mesmo identificador no log estruturado.

### Observar uma dead-letter queue

No consumer de exemplo, provoque uma falha controlada, publique um evento e observe a fila configurada com sufixo `.dlq`. Reverta a falha depois do exercício.

### Criar um serviço descartável

```bash
npm run create-service -- sample-api api
```

Inspecione a cópia gerada, valide `.env.example` e remova o diretório ao terminar. O scaffold inicia somente um repositório Git local.

## Regras de trabalho

- Valide DTOs na borda e mantenha regras de negócio fora de controllers.
- Propague correlation ID em chamadas, logs, erros e eventos.
- Não registre tokens, credenciais, PII ou payloads sem redaction.
- Trate valores de exemplo como inadequados para deploy.
- Execute os checks do README antes de propor uma mudança.
- Atualizações do template não chegam automaticamente a projetos derivados.

## Próximas referências

- [Guia rápido](./GUIA-RAPIDO.md)
- [Architecture Decision Records](../adr/)
- [Changelog](../../CHANGELOG.md)
