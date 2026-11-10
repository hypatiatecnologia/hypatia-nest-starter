# Revisão aprofundada do código — 2026-11-10

**Alvo:** `c454c4a0be58d2eaf1db4be4ca22fc814aa4b3fb` e alterações desta revisão.
**Estado inicial:** árvore de trabalho limpa.
**Escopo:** bootstrap, configuração, autenticação, endpoints e erros HTTP, logs,
health checks, cliente HTTP, Redis, PostgreSQL, eventos RabbitMQ, descoberta de
módulos, scripts de scaffolding, Docker/CI e dependências declaradas.

## Alterações aplicadas

1. **Isolamento incorreto entre assinaturas RabbitMQ (P1, corrigido).**
   `src/rabbitmq/rabbitmq.service.ts` deduplicava pelo `eventId` global. Como o
   exchange faz fan-out para filas independentes, o primeiro worker podia impedir
   outro serviço de processar o mesmo evento. A chave agora inclui segmentos
   codificados da fila e do evento. Um teste reproduziu o descarte antes da
   correção e cobre duas entregas na mesma fila e outra assinatura.
   [ADR 0008](../adr/0008-queue-scoped-event-deduplication.md) documenta a mudança,
   o deploy sem versões mistas, replay e rollback. O guia mental segue a chave nova.

2. **Timeout de publicação deixava mensagem no buffer (P1, corrigido).**
   A corrida com `withTimeout` rejeitava a chamada, mas o `ChannelWrapper` guardava
   a mensagem para enviar após reconexão. O timeout nativo documentado na versão
   instalada, 4.1.15, agora também remove mensagens ainda não enviadas. Um teste usa
   o buffer real da biblioteca e verifica que a mensagem expira e sai da fila.
   Se o broker já recebeu a mensagem antes do timeout, um novo publish gera outro
   `eventId`; chamadas de negócio continuam precisando de idempotência própria.

3. **Logs de acesso incluíam query, cookies e headers (P1, corrigido).**
   Os serializers padrão do Pino serializavam URL, query, headers da requisição e
   headers da resposta. Os serializers agora registram somente id de correlação,
   método, caminho sem query e status HTTP. Erros JSON do cliente HTTP preservam
   sua causa para o código chamador, mas o serializer não expande corpo upstream
   para mensagem/stack dos logs. Teste do middleware real usa marcadores sintéticos
   e confirma a remoção.

4. **Cliente HTTP combinava headers com capitalização diferente (P2, corrigido).**
   Um `X-Correlation-ID` fornecido pelo chamador se juntava ao id atual e
   `Accept` duplicava o padrão. Headers são normalizados; o contexto atual prevalece
   e tipos de conteúdo definidos pelo cliente são preservados. Chamadas com body
   continuam usando JSON.

5. **Falha ao ler corpo era tratada como JSON inválido (P2, corrigido).**
   Erros de rede/timeout durante `response.json()` eram convertidos em falhas
   permanentes `HttpClientError(200)` e não podiam ser repetidos. Só erro de parsing
   `SyntaxError` recebe esse tipo; demais causas permanecem transitórias. A chamada
   também aborta leituras de corpos descartados, como respostas não 2xx. Testes
   cobrem causa preservada, abort e retry da leitura interrompida.

6. **Scaffolding copiava configurações locais e gerava lockfile com nome antigo
   (P1 para confidencialidade, corrigido).** `scripts/create-service.sh` excluía
   apenas `.env`; agora exclui variantes `.env.*`, `secrets/`, `.aws/` e `.ssh/`.
   A renomeação do serviço também percorre `package-lock.json`. Os testes usam um
   `rsync` substituto para verificar as exclusões sem ler nem criar credenciais e
   checam a coerência dos nomes nos manifestos.

7. **Advisories de dependências (P1, corrigidos dentro da faixa atual).**
   O `npm audit --omit=dev` inicial encontrou 5 altos e 1 crítico em 11 avisos
   de produção. Atualizei o lockfile, mantendo Nest 11 e o contrato das dependências;
   o override de `brace-expansion` foi elevado de 5.0.9 para 5.0.12.
   A consulta final de produção encontrou 0 altos/críticos e 2 moderados (`glob` e
   `minimatch`). O `npm audit` completo encontrou 0 altos/críticos e 19 avisos
   baixos/moderados entre produção e desenvolvimento. A correção indicada para
   `glob` exige major para 14.0.4; foi deixada de fora porque a descoberta de módulos
   depende do contrato da biblioteca. O uso observado recebe um padrão fixo de
   bootstrap, sem entrada HTTP. Aviso de pacote não demonstra exploração neste
   serviço.

## Recibos de validação

Ambiente: Node.js 22.20.0, alvo e alterações identificados acima.

| Critério | Comando | Resultado |
| --- | --- | --- |
| Lint | `npm run lint:ci` | PASS, exit 0 |
| Tipos | `npm run type-check` | PASS, exit 0 |
| Testes da aplicação e cobertura | `npm test -- --runInBand --coverage --silent` | PASS, 18 suítes e 136 testes; linhas 86.53%, statements 86.4%, funções 77.44%, branches 81.53%; piso do Jest: 80/80/70/70 |
| Contratos dos scripts | `npm run test:scripts` | PASS, 7 testes |
| Build | `npm run build` | PASS, exit 0 |
| Scanner de actions GitHub | `node /Users/andersonalves/.agents/skills/banana-dependency-auditor/scripts/ci-dependency-scan.cjs .github/workflows` | PASS, nenhum finding |
| Advisories de produção | `npm audit --omit=dev --audit-level=high --json` | PASS para severidade alta/crítica; 2 moderados |
| Advisories completos | `npm audit --audit-level=high --json` | PASS para severidade alta/crítica; 19 baixos/moderados |
| Integridade | `git diff --check` | PASS |

O histórico do turno confirma falha dos novos testes antes da implementação para
chaves entre filas, buffer de publicação, logs HTTP, corpo interrompido, headers,
lockfile do scaffolder e exclusões do scaffolder. O teste de causa nos logs também
falhou antes da serialização segura. Nenhum teste foi ignorado ou enfraquecido.

## Limites e riscos restantes

- **NOT_RUN:** teste de integração com Redis/RabbitMQ reais. O escopo da chave de
  dedupe foi verificado com mock compartilhado; atomicidade em Redis, confirmação
  de publicação e entrega entre réplicas ainda precisam de broker e Redis reais.
- A estratégia aceita (`SET NX` antes do handler, ADR 0006) ainda pode impedir
  execução ou conclusão após crash entre o claim e o handler/ack, até o TTL de 24h.
  Isso não é exactly-once. Handler com efeito de negócio exige idempotência
  persistente própria. Chaves antigas não distinguem filas; serviços existentes
  precisam seguir a sequência de migração do ADR 0008.
- O histórico do deploy, o modelo de confiança de proxy, as sub-redes de produção,
  a operação real de JWT/API keys e topologia de brokers externos não estão
  disponíveis nesta revisão. A análise de auth do código local não encontrou
  bypass nos caminhos examinados; configuração externa fica `unverified`.
- A execução do baseline precisou de autorização do host para portas locais. Com
  essa permissão, o mesmo estado inicial `c454c4a` passou: 17 suítes, 129 testes.
