# Templates MkDocs — playbook

Usado por [`create-playbook-doc.md`](../create-playbook-doc.md). Aplicar ao gerar cada arquivo.

## Passo 4 — Conteúdo de cada arquivo

### 4.1 `index.md` (services, modo full)

```markdown
---
title: {NomeDoServico}
description: {descrição curta extraída do README ou Swagger}
tags:
  - {slug}
  - {domínio inferido}
  - {tecnologias principais em lowercase}
---

# {NomeDoServico}

{Uma frase descrevendo o que o serviço faz no mundo real.}

<div class="tech-stack">
  <span class="tech-badge">{Linguagem + versão}</span>
  <span class="tech-badge">{Framework + versão}</span>
  <span class="tech-badge">{Banco de dados}</span>
  <!-- uma badge por tecnologia principal detectada -->
</div>

## Visão Geral

| Atributo | Valor |
|----------|-------|
| **Repositório** | `{org}/{slug}` |
| **Porta** | {porta detectada ou N/A} |
| **Banco** | {banco detectado} |
| **Cache** | {cache detectado ou N/A} |
| **Mensageria** | {broker detectado ou N/A} |

## Documentação

<div class="card-grid">
  <div class="card">
    <h3>Arquitetura</h3>
    <p>{descrição de uma linha do que está em architecture.md}</p>
    <a href="architecture/">Ver arquitetura →</a>
  </div>
  <!-- um card por arquivo gerado no modo full -->
</div>

## Responsabilidades

{Lista de responsabilidades principais do serviço.}

## Arquitetura Resumida

\`\`\`mermaid
flowchart TB
    {diagrama de alto nível mostrando clientes → serviço → dados/externos}
\`\`\`

## Quick Links

| Recurso | Link |
|---------|------|
| Repositório | [GitHub](https://github.com/{org}/{slug}) |
| Logs | [Cloud Logging](https://console.cloud.google.com/logs) |
```

### 4.2 `architecture.md` (services, modo full)

```markdown
---
title: Arquitetura - {NomeDoServico}
description: Estrutura interna, camadas e padrões de código do {NomeDoServico}
tags:
  - {slug}
  - architecture
---

# Arquitetura

{Uma frase introdutória.}

## Estrutura de Pastas

\`\`\`
{árvore VS Code-style com ├──, └──, │}
\`\`\`

## Camadas da Aplicação

\`\`\`mermaid
flowchart TB
    {diagrama de camadas do código}
\`\`\`

## Padrões de Código

{H3 por padrão detectado: Factory, Repository, Service, Strategy, etc.
Para cada padrão: descrição + snippet de código real do repositório.}

## Módulos Principais

{H3 numerado por módulo. Uma lista do que cada módulo faz.}

## Processos

{H3 por processo de inicialização detectado (HTTP server, Worker, etc.)
flowchart TB mostrando a sequência de inicialização.}

## Fluxo de Dados

\`\`\`mermaid
flowchart LR
    {Input → Processing → Output}
\`\`\`

## Dependências Principais

| Pacote | Versão | Uso |
|--------|--------|-----|
{tabela de dependências principais detectadas no manifesto}
```

### 4.3 `api.md` (services, modo full)

```markdown
---
title: API Reference - {NomeDoServico}
description: Documentação completa dos endpoints da API do {NomeDoServico}
tags:
  - {slug}
  - api
---

# API Reference

{Frase introdutória.}

## Autenticação

{Descrever o mecanismo de autenticação detectado no código.}

\`\`\`http
{headers de autenticação reais}
\`\`\`

!!! warning "{título do aviso}"
    {aviso sobre headers obrigatórios, se aplicável}

## Base URL

| Ambiente | URL |
|----------|-----|
| Local | `http://localhost:{porta}/...` |
| Homologação | `https://{slug}.homol.{domínio}/...` |
| Produção | `https://{slug}.{domínio}/...` |

---

{Para cada grupo de endpoints:}
## {GrupoDeEndpoints}

### {Verbo + /caminho}

{Descrição de negócio em uma frase.}

\`\`\`http
{MÉTODO} /caminho
\`\`\`

**Permissão:** `{permissão detectada, se houver}`
**Rate Limit:** `{limite detectado, se houver}`

**Request:**
\`\`\`json
{exemplo completo de request body real — zero placeholders}
\`\`\`

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
{uma linha por campo do request}

**Validações:**
| Validação | Status HTTP | Mensagem |
|-----------|-------------|---------|
{uma linha por validação detectada no código}

**Response ({status}):**
\`\`\`json
{exemplo completo de response — zero placeholders}
\`\`\`

**Errors:**
- `{status}` - {mensagem}

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
{tabela de todos os códigos de erro detectados}

**Formato de erro:**
\`\`\`json
{estrutura real de erro do serviço}
\`\`\`

## Rate Limiting

| Endpoint | Limite | Janela |
|----------|--------|--------|
{tabela de rate limits detectados, se houver}
```

### 4.4 `flows.md` (services, modo full)

```markdown
---
title: Fluxos de Negócio - {NomeDoServico}
description: Fluxos dos principais processos do {NomeDoServico}
tags:
  - {slug}
  - flows
---

# Fluxos de Negócio

{Frase introdutória.}

{Para cada fluxo principal detectado:}

## {NomeDoFluxo}

{Breve descrição em prosa do que este fluxo representa no mundo real.}

\`\`\`mermaid
sequenceDiagram
    {sequenceDiagram completo com todos os atores e passos reais}
\`\`\`

{Subsections com detalhes técnicos relevantes do fluxo, ex.:}
### {DetalhesTécnicos}

\`\`\`{linguagem}
{snippet de código real relevante para o fluxo}
\`\`\`

---

## Estados e Transições

{Para cada entidade com estados detectada:}
### Status de {Entidade}

\`\`\`mermaid
stateDiagram-v2
    {diagrama de estados real}
\`\`\`

---

## Idempotência

{Se detectado no código, documentar mecanismos de idempotência com snippets reais.}
```

### 4.5 `data-model.md` (services, modo full)

```markdown
---
title: Modelo de Dados - {NomeDoServico}
description: Entidades, tabelas e relacionamentos do {NomeDoServico}
tags:
  - {slug}
  - data-model
---

# Modelo de Dados

{Frase introdutória.}

## Diagrama ER

\`\`\`mermaid
erDiagram
    {diagrama ER real com todas as tabelas e relacionamentos detectados}
\`\`\`

## Tabelas

{Para cada tabela detectada:}
### {NomeDaTabela} ({descrição de negócio})

{Uma frase de contexto de negócio.}

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
{uma linha por coluna detectada}

**Índices:**
{lista de índices se detectados}

**Exemplo:**
\`\`\`json
{exemplo real com dados plausíveis — zero placeholders}
\`\`\`

---

## Tipos {Linguagem}

{Para cada interface/type/struct exportada:}
### {NomeDoTipo}

\`\`\`{linguagem}
{definição real copiada do código}
\`\`\`
```

### 4.6 `integrations.md` (services, modo full)

```markdown
---
title: Integrações - {NomeDoServico}
description: Integrações externas do {NomeDoServico}
tags:
  - {slug}
  - integrations
---

# Integrações

{Frase introdutória.}

## Visão Geral

\`\`\`mermaid
flowchart TB
    {diagrama mostrando todas as integrações detectadas}
\`\`\`

---

{Para cada integração detectada — RabbitMQ, Redis, APIs externas, Socket.IO, etc.:}

## {NomeDaIntegração}

{Descrição de negócio de por que esta integração existe.}

### Configuração

\`\`\`{linguagem}
{configuração real copiada do código}
\`\`\`

### {Detalhes específicos por tipo}

{Para RabbitMQ: estrutura de filas + diagram flowchart + workers com código real + retry/DLQ}
{Para Redis: padrões de chave + TTL + invalidação + código real}
{Para APIs externas: endpoint + request/response completos + retry config}
{Para Socket.IO: eventos emitidos + consumidos + código real}

### Keys / Filas / Rotas Utilizadas

| Pattern/Fila | TTL/Config | Descrição |
|---|---|---|
{tabela com todos os patterns detectados}
```

### 4.7 `setup.md` (services, modo full)

```markdown
---
title: Setup & Configuração - {NomeDoServico}
description: Como rodar o {NomeDoServico} localmente
tags:
  - {slug}
  - setup
---

# Setup & Configuração

{Frase introdutória.}

## Requisitos

{Lista de requisitos detectados no README ou package.json/go.mod/pyproject.toml}

## Setup Local

### 1. Clone o Repositório

\`\`\`bash
git clone git@github.com:{org}/{slug}.git
cd {slug}
\`\`\`

### 2. Instale Dependências

\`\`\`bash
{comando real detectado: npm install / yarn install / pip install / go mod download / etc.}
\`\`\`

### {3..N. Passos adicionais}

{migrações, seeds, serviços de infra, etc. — extraídos do README ou detectados nos scripts}

### {N+1}. Inicie o Servidor

\`\`\`bash
{comando real de dev detectado}
\`\`\`

Acesse: `http://localhost:{porta}`

---

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
{tabela extraída dos scripts do manifesto ou Makefile}

---

## Docker Compose

{Se detectado docker-compose.yml, reproduzir o conteúdo real. Se não detectado, omitir esta seção.}

---

## Variáveis de Ambiente

{Para cada grupo de variáveis detectado:}
### {NomeDoGrupo}

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
{uma linha por variável detectada no código ou .env.example}

### Exemplo de .env

\`\`\`bash
{arquivo .env.example real, ou reconstituído das variáveis detectadas}
\`\`\`

---

## Troubleshooting

{Para cada problema comum detectável (conexões com banco/cache/fila):}
### {Título do Problema}

\`\`\`bash
{comandos de diagnóstico reais}
\`\`\`

---

## Testes

### Executar Testes

\`\`\`bash
{comandos reais de teste detectados}
\`\`\`

### Estrutura de Testes

\`\`\`
{árvore da pasta tests/ se existir}
\`\`\`

---

## Deploy

{Se detectado: instruções de build, Docker e/ou Cloud Run — extraídas do Dockerfile, cloudbuild.yaml ou README.}
```

### 4.8 Modo `simple` — arquivo único

Seguir o padrão exato do `coupon-service.md`:

```markdown
---
title: {NomeDoServico}
description: {descrição curta}
tags:
  - {slug}
  - {tags relevantes}
---

# {NomeDoServico}

{Descrição de uma frase.}

<div class="tech-stack">
  <span class="tech-badge">{stack}</span>
</div>

## Visão Geral

| Atributo | Valor |
|----------|-------|
| **Repositório** | `{org}/{slug}` |
| **Stack** | {stack resumida} |
| **Hospedagem** | Google Cloud Run |

## Responsabilidades

{Lista de responsabilidades.}

## Arquitetura

\`\`\`mermaid
flowchart TB
    {diagrama de alto nível}
\`\`\`

## Conceitos Importantes

{Tabelas ou H3s com conceitos de domínio e seus status/valores.}

## Processamento Assíncrono (se houver workers)

\`\`\`mermaid
sequenceDiagram
    {fluxo do worker}
\`\`\`

### Filas {broker} (se houver)

| Fila | Descrição |
|------|-----------|

## Banco de Dados

### Tabelas

| Tabela | Descrição |
|--------|-----------|

### Schema: {tabelaPrincipal}

\`\`\`sql
{DDL real}
\`\`\`

## API Endpoints

### {GrupoDeEndpoints}

| Método | Rota | Descrição |
|--------|------|-----------|

### Exemplo: {NomeDoEndpoint}

\`\`\`http
{exemplo real}
\`\`\`

## Webhooks (se houver)

{Payloads reais.}

## Troubleshooting

### "{Mensagem de erro comum}"

{Diagnóstico e solução.}

## Integrações

| Sistema | Como integra |
|---------|-------------|

## Links Relacionados

{Links para outros docs do playbook relacionados.}
```

---

## Passo 5 — Regras para o front matter YAML

Todo arquivo gerado DEVE ter front matter YAML:

```yaml
---
title: {título da página — não repetir o H1}
description: {descrição de 1 linha para meta e buscas}
tags:
  - {slug do serviço}
  - {tecnologias relevantes em lowercase sem versão}
  - {domínio: payments, coupons, auth, etc.}
---
```

**Regras para tags:**
- O slug do serviço DEVE sempre ser a primeira tag.
- Adicionar tecnologias relevantes: `typescript`, `nodejs`, `python`, `go`, `mysql`, `redis`, `rabbitmq`, etc.
- Adicionar domínio do negócio: `payments`, `coupons`, `affiliates`, `auth`, `notifications`, etc.
- Usar apenas lowercase, sem versões, sem espaços.

---

## Passo 6 — Regras para HTML customizado do MkDocs Material

### Tech Stack Badges

Gerar um badge por tecnologia principal detectada na análise:

```html
<div class="tech-stack">
  <span class="tech-badge">{Tecnologia} {versão}</span>
</div>
```

Exemplos de badges a gerar baseado no que foi detectado:
- Runtime: `Node.js 20`, `Python 3.11`, `Go 1.22`, `Java 21`
- Framework: `Express 4.21`, `FastAPI 0.110`, `Gin 1.9`, `Spring Boot 3.2`
- Banco: `MySQL 8`, `PostgreSQL 16`, `MongoDB 7`
- Cache: `Redis 7`
- Mensageria: `RabbitMQ 3.12`, `Kafka`
- Extras: `Socket.IO`, `Prisma`, `gRPC`

### Card Grid (apenas index.md no modo full)

Gerar um card por arquivo secundário:

```html
<div class="card-grid">
  <div class="card">
    <h3>{Título}</h3>
    <p>{Descrição de uma linha do conteúdo do arquivo.}</p>
    <a href="{arquivo}/">Ver {título curto} →</a>
  </div>
</div>
```

### Admonitions MkDocs

Usar admonitions em vez de texto plano quando aplicável:

```markdown
!!! warning "Título do aviso"
    Texto do aviso.

!!! info "Informação"
    Texto informativo.

!!! danger "Perigo"
    Texto crítico.

!!! tip "Dica"
    Texto de dica.
```

---

## Passo 7 — Regras para diagramas Mermaid

### sequenceDiagram

- Declarar participantes explicitamente.
- Usar `activate`/`deactivate` apenas no nível raiz, NUNCA dentro de `alt`/`else`/`end`.
- Usar `alt`/`else`/`end` para branches condicionais; `opt`/`end` para condicionais de branch único.
- `->>` para chamadas; `-->>` para respostas.
- Nomes de participantes em palavras únicas ou entre aspas.
- **PROIBIDO:** `alt` aninhado dentro de `alt`, `activate` dentro de `alt`, `alt` sem `else`.
- **PROIBIDO:** `*`, `#`, backticks em mensagens.
- **PROIBIDO:** palavras reservadas como alias (`alt`, `else`, `end`, `loop`, `opt`, `par`, `and`, `rect`, `note`, `over`, `activate`, `deactivate`, `autonumber`, `title`, `actor`, `participant`).

### flowchart TD

- Sempre `flowchart TD` — nunca `graph TD`.
- IDs de nó: apenas alfanumérico (`A`, `CheckInput`) — sem hífens nem espaços.
- Labels com `{`, `}`, `(`, `)`, `?`, `>`, `<`, `=`, `+`, `:`, `|`, `&`, `-` DEVEM ser entre aspas.
- Sem `\"` dentro de labels — usar texto simples.

### erDiagram

- Usar `erDiagram` para diagramas de entidade-relacionamento.
- Relações: `||--o{`, `}o--||`, `||--||`, etc.
- Campos dentro de chaves `{}`.

### stateDiagram-v2

- Usar `stateDiagram-v2` para máquinas de estado.
- Estados terminais com `[*]`.

---
