# Prontidão para publicação pública do Hypatia Nest Starter

> **Status:** aprovado pelo usuário em 26/07/2026.

## Goal

Publicar o `hypatia-nest-starter` na organização Hypatia como um template backend seguro,
reproduzível e compreensível fora do contexto interno, preservando sua autoria organizacional e
permitindo que Anderson o destaque como prova de platform engineering.

## Non-goals

- Transferir ou duplicar o repositório para a conta pessoal de Anderson.
- Publicar um pacote npm ou assumir suporte de biblioteca versionada.
- Publicar a topologia interna, o roadmap ou detalhes operacionais dos serviços da Hypatia.
- Redesenhar a arquitetura runtime, trocar NestJS, Prisma, RabbitMQ ou Redis.
- Garantir que serviços já derivados recebam atualizações automaticamente.
- Mudar a visibilidade, criar release ou editar pins sem aprovação explícita posterior.

## User stories

### Avaliação externa

**Given** uma pessoa sem contexto sobre a Hypatia,
**When** ela abre o repositório,
**Then** entende em menos de 30 segundos que se trata de um starter NestJS para serviços seguros,
observáveis e orientados a eventos.

### Criação de serviço

**Given** um clone limpo com Node.js 22 e os pré-requisitos documentados,
**When** a pessoa segue o quick start ou executa `create-service`,
**Then** obtém um serviço de exemplo, executa a suíte e entende quais componentes são opcionais em
até dez minutos.

### Informação interna detectada

**Given** um segredo, dado pessoal, path local ou detalhe operacional desnecessário encontrado na
árvore ou no histórico,
**When** o gate de publicação é avaliado,
**Then** a publicação permanece bloqueada até remoção e nova auditoria.

### Pré-requisito ausente

**Given** Node.js, Docker ou um serviço de infraestrutura indisponível,
**When** um comando documentado é executado,
**Then** ele falha com mensagem acionável, sem criar um scaffold parcial apresentado como sucesso.

## Assumptions

- `hypatiatecnologia` continuará sendo a proprietária e mantenedora do repositório.
- Anderson possui autoridade para decidir sobre a publicação do código da organização.
- A marca Hypatia será mantida, mas diagramas e exemplos públicos usarão nomes genéricos quando os
  nomes reais não forem necessários para ensinar o starter.
- O primeiro release público distribui um template GitHub, não um pacote npm; por isso o
  `package.json` deve usar `"private": true`.
- O repositório continuará suportando Node.js 22, NestJS 11, PostgreSQL, Redis, RabbitMQ e Prisma.
- O `.claude/` local não versionado pertence ao ambiente do usuário e fica fora desta mudança até
  uma decisão separada.
- O fluxo de atualização de derivados permanece o do ADR 0005: changelog e merge/cherry-pick
  dirigido.

## Risks

- **Exposição de contexto organizacional:** substituir topologia, roadmap e nomes operacionais
  desnecessários por exemplos genéricos, mantendo apenas a identidade pública da Hypatia.
- **Segredo no histórico:** executar scanning de todos os commits e revisar manualmente
  credenciais de exemplo antes da mudança de visibilidade.
- **Contrato contraditório:** alinhar README, `package.json`, `.nvmrc`, Docker e CI, incluindo a
  correção de NestJS 10 para 11.
- **Publicação npm acidental:** definir `"private": true` e validar o pacote antes da abertura.
- **Expectativa de suporte excessiva:** documentar estágio, versões suportadas, política de
  atualização de snapshots e capacidade de manutenção.
- **Claims de segurança absolutos:** descrever controles concretos e limites, sem declarar o
  starter “production-ready” ou “secure” sem qualificação verificável.
- **Histórico já exposto:** tratar a mudança de visibilidade como irreversível para fins de
  confidencialidade.

## API contract

Esta mudança não altera contratos HTTP ou de mensageria. Antes da publicação, os contratos
existentes expostos pelo template devem ser verificados e documentados de forma consistente:

- `GET /health/live`, `GET /health/ready` e alias `GET /health`;
- Swagger no modo API;
- `x-correlation-id` aceito, gerado quando ausente e propagado em resposta, logs e eventos;
- envelope RabbitMQ com `eventId`, `type`, `occurredAt`, `correlationId` opcional e `payload`;
- modos `publisher`, `consumer` e `off`;
- `npm run create-service -- <service-name> [api|worker]`, com falha atômica e diagnóstico quando
  os argumentos ou pré-requisitos forem inválidos.

Mudança futura nesses contratos exige spec própria.

## Error handling

- Scripts de setup e scaffold retornam código diferente de zero e mensagem acionável em erro.
- Um scaffold incompleto não pode ser apresentado como criação bem-sucedida.
- Falha de CI, audit, gitleaks, Trivy, licença ou auditoria manual bloqueia publicação.
- Exemplos não devem engolir falhas de PostgreSQL, Redis ou RabbitMQ; health readiness deve
  continuar refletindo dependências necessárias ao modo escolhido.
- Nenhuma automação desta mudança altera visibilidade, publica pacote, cria release ou modifica o
  perfil sem autorização específica.

## Observability

- CI mantém jobs separados para qualidade, segurança e build da imagem.
- Quick start expõe health checks e correlation ID como sinais verificáveis.
- Auditoria de publicação registra data, escopo, comandos, findings e decisão em `docs/audits/`.
- Skips ou componentes opcionais são declarados no output e na documentação, não tratados como
  sucesso silencioso.

## Quality attributes

- Em clone limpo com Node.js 22, a suíte que não exige infraestrutura deve passar com os comandos
  documentados.
- Com Docker Compose disponível, o quick start deve produzir health readiness e Swagger
  acessíveis em até dez minutos, medido por dry run a partir do README.
- Três execuções consecutivas do workflow principal devem concluir verdes após as mudanças.
- Um visitante sem contexto da Hypatia deve identificar propósito, stack, estágio e forma de uso
  no primeiro viewport do README.

## Threat model

- **Ativos:** código e histórico da Hypatia, credenciais de desenvolvimento, topologia interna,
  nomes de serviços, e-mail de disclosure, reputação da organização e consumidores derivados.
- **Entradas não confiáveis:** variáveis de ambiente, headers HTTP, payloads, routing keys,
  nomes passados ao scaffold, imagens Docker e dependências npm.
- **Vetores de abuso:** credencial real em exemplo ou commit antigo, command/path injection no
  scaffold, brute force de autenticação, vazamento em logs, dependency confusion e imagem
  vulnerável.
- **Controles exigidos:** scanning da árvore e histórico, exemplos fictícios, validação de
  argumentos, secrets fora do Git, dependências auditadas, actions pinadas e permissões mínimas.
- **AuthN/AuthZ:** os exemplos de JWT e API key devem ser explicitamente demonstrativos; segredos
  default não podem ser adequados para deploy.
- **PII:** o starter não deve conter dados pessoais reais; documentação pública remove referências
  pessoais e operacionais que não sejam canais deliberados de contato.

## Rollout / Rollback

1. Corrigir contratos contraditórios e proteger o pacote contra publicação npm.
2. Generalizar documentação e diagramas sem remover a marca Hypatia.
3. Validar quick start, scaffold, testes, Docker e CI em ambiente limpo.
4. Auditar árvore, histórico, dependências, licenças e canais de disclosure.
5. Obter três execuções verdes e revisar o relatório final.
6. Solicitar aprovação específica para tornar público e habilitar o modo template.
7. Após aprovação, aplicar metadata, criar release, validar sem autenticação e integrar ao perfil.

Antes da abertura, rollback é a reversão comum das mudanças. Depois da abertura, tornar privado
não revoga clones ou forks; qualquer informação sensível deve ser eliminada antes do rollout.

## Acceptance criteria

- **AC-01:** README, `package.json`, `.nvmrc`, Docker e CI concordam em Node.js 22 e NestJS 11.
- **AC-02:** `package.json` contém `"private": true` e o fluxo de release não publica no npm.
- **AC-03:** Quick start e `create-service` são validados em clone limpo e concluídos em até dez
  minutos, ou falham com diagnóstico acionável.
- **AC-04:** A suíte, o audit, o secret scanning, o image scanning e o build exigidos concluem
  verdes em três execuções consecutivas.
- **AC-05:** Auditoria datada cobre árvore, histórico, segredos, dados pessoais, topologia interna,
  autoria, licença e dependências, sem finding bloqueante aberto.
- **AC-06:** README preserva a marca Hypatia, mas usa arquitetura e nomes genéricos em exemplos
  públicos que não exigem a topologia interna.
- **AC-07:** `SECURITY.md` define versões suportadas, canal sustentável de disclosure e a
  responsabilidade de atualização dos serviços derivados.
- **AC-08:** Status, limites, suporte e política de contribuição são explícitos e não usam claims
  absolutos de segurança ou prontidão para produção.
- **AC-09:** Metadata proposta inclui descrição, topics, social preview, template flag e release
  coerente com `CHANGELOG.md`.
- **AC-10:** O repositório permanece na organização Hypatia e visibilidade, release, metadata
  externa, pin e perfil não mudam antes de aprovação explícita posterior.

## Open questions

- Nenhuma questão bloqueante. A aprovação confirmou a marca Hypatia com exemplos genéricos, sem
  promessa inicial de triagem de PRs externos.
- O canal de disclosure e a versão da release serão validados contra a capacidade operacional e o
  histórico durante a auditoria; divergência bloqueia o rollout em vez de ser decidida pelo
  executor.

## Implementation plan

1. Alinhar versões e contratos documentais e impedir publicação npm acidental.
2. Generalizar a narrativa, diagramas e exemplos públicos preservando a marca Hypatia.
3. Validar quick start, scaffold, suíte, Docker e mensagens de erro em ambiente limpo.
4. Executar e registrar auditoria de árvore, histórico, dependências, licenças e disclosure.
5. Preparar contrato público, metadata e release notes, validar os gates e solicitar aprovação
   específica para visibilidade, release e integração ao perfil.
