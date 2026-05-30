---
description: Gera/atualiza README.md na raiz; só esse arquivo; Contribuindo alinhado a commitlint se existir.
---

**Objetivo:** README útil em <30s de leitura.

**Quando usar:** repo sem README ou desatualizado.

**Não usar quando:** handbook → [`create-playbook-doc`](./create-playbook-doc.md).

**Done when:** checklist final do command atendido.

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md)

# readme — Gerar README do projeto

Use este comando quando:
- O repositório não tem `README.md` ou o existente está desatualizado/vazio.
- Um novo desenvolvedor não consegue rodar o projeto sem pedir ajuda.
- O projeto foi documentado no playbook mas o README ainda não aponta para lá.

**Proibido** modificar qualquer arquivo além do `README.md` na raiz do repositório.

---

## Passo 0 — Coletar todas as fontes antes de escrever

Ler os seguintes arquivos **antes** de gerar qualquer linha do README. Não inventar informações que não estejam presentes nestas fontes.

| Fonte | O que extrair |
|---|---|
| `package.json` / `go.mod` / `pyproject.toml` / `pom.xml` | nome, descrição, versão, dependências principais, scripts |
| `.tool-versions` / `mise.toml` / `.nvmrc` / `.python-version` | versões exatas de runtime |
| `.env.example` / `.env.sample` | variáveis de ambiente obrigatórias e opcionais |
| `docker-compose.yml` / `docker-compose.yaml` | serviços de infraestrutura, portas expostas |
| `Dockerfile` | runtime base, porta exposta, comando de entrada |
| `Makefile` | alvos disponíveis (build, test, lint, run) |
| `README.md` existente | preservar seções marcadas com `<!-- manual -->` / `<!-- /manual -->` |
| `.github/workflows/` | nome do workflow principal de CI para o badge |
| Swagger / OpenAPI (`openapi.yaml`, `swagger.json`, rota `/docs`, `/swagger`) | URL ou rota da documentação da API |
| `CONTRIBUTING.md` / `CODEOWNERS` | instruções de contribuição já existentes |

Se uma fonte não existir, **omitir a seção correspondente** no README em vez de preencher com placeholder.

---

## Passo 1 — Detectar contexto do projeto

Determinar e registrar internamente antes de escrever:

1. **Nome do projeto** — derivar do manifesto (mesma lógica do `create-playbook-doc`: `package.json` → `name`, `go.mod` → último segmento, `pom.xml` → `<artifactId>`, fallback = nome do diretório raiz).
2. **Stack tecnológica** — linguagem + versão, framework, banco de dados, cache, mensageria, infra de deploy.
3. **Tipo de projeto** — API HTTP, Worker, CLI, biblioteca, frontend, fullstack.
4. **Porta local** — porta em que o serviço sobe localmente (procurar em `PORT` no `.env.example`, `docker-compose.yml`, `server.listen`, `app.listen`, etc.).
5. **Comandos reais de dev/test/lint** — extraídos dos scripts do manifesto ou do `Makefile`; nunca inventar comandos genéricos.
6. **Playbook existente** — verificar se existe documentação no engineering-handbook usando a mesma lógica de descoberta do `create-playbook-doc` (Passo 0.1 daquele comando). Se encontrar, registrar a URL ou path relativo para incluir nos links.

---

## Passo 2 — Estrutura do README

Gerar o `README.md` com exatamente estas seções, nesta ordem. Omitir silenciosamente seções para as quais não há dados reais — **nunca deixar seção com placeholder vazio**.

```markdown
# {Nome do Projeto}

> {Uma frase descrevendo o que o projeto resolve no mundo real. Não "Projeto do time X".}

{badges — ver Passo 3}

---

## O que é

{2–3 parágrafos curtos respondendo: qual problema resolve, quem usa, o que acontece quando funciona corretamente.
Sem jargão técnico. Um não-desenvolvedor deve entender.}

## Stack

{tabela com tecnologia e versão — ver Passo 3}

## Pré-requisitos

{lista do que precisa estar instalado localmente, com versões exatas extraídas dos arquivos de runtime.
Incluir mise/nvm/asdf se o projeto usar.}

## Quick Start

{o caminho mais curto do `git clone` até o app respondendo requisições — extraído dos scripts reais}

## Variáveis de Ambiente

{tabela extraída do .env.example — ver Passo 4}

## Comandos Disponíveis

{tabela extraída dos scripts do package.json / Makefile — ver Passo 5}

## Testes

{como rodar os testes — comando real, não genérico}

## Links

{tabela de links — ver Passo 6}

## Contribuindo

{instruções de contribuição — ver Passo 7}
```

---

## Passo 3 — Badges e tabela de stack

### Badges (linha após o título)

Gerar badges no formato Shields.io para cada item detectado. Usar a sintaxe:

```markdown
![{Label}](https://img.shields.io/badge/{Label}-{Versão}-{Cor}?style=flat-square&logo={logo})
```

Badges a gerar com base no que foi detectado:

| O que detectar | Badge a gerar |
|---|---|
| Node.js (`.nvmrc` ou `engines.node`) | `![Node.js](https://img.shields.io/badge/Node.js-{versão}-339933?style=flat-square&logo=nodedotjs)` |
| TypeScript (`typescript` em deps) | `![TypeScript](https://img.shields.io/badge/TypeScript-{versão}-3178C6?style=flat-square&logo=typescript)` |
| Python (`.python-version` ou `pyproject.toml`) | `![Python](https://img.shields.io/badge/Python-{versão}-3776AB?style=flat-square&logo=python)` |
| Go (`go.mod`) | `![Go](https://img.shields.io/badge/Go-{versão}-00ADD8?style=flat-square&logo=go)` |
| Java (`pom.xml` / `java.version`) | `![Java](https://img.shields.io/badge/Java-{versão}-ED8B00?style=flat-square&logo=openjdk)` |
| Express / Fastify / NestJS / Gin / FastAPI / Spring Boot | badge do framework com versão extraída do manifesto |
| MySQL / PostgreSQL / MongoDB | badge do banco |
| Redis | `![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis)` |
| RabbitMQ | `![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3-FF6600?style=flat-square&logo=rabbitmq)` |
| Docker | `![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker)` |
| GitHub Actions workflow detectado | `![CI](https://github.com/{org}/{repo}/actions/workflows/{arquivo}.yml/badge.svg)` |

Usar `{REPO_ORG}/{REPO_NAME}` detectados via `git remote get-url origin` (mesma lógica do Passo 0.3 do `create-playbook-doc`).

### Tabela de Stack

```markdown
## Stack

| Tecnologia | Versão | Papel |
|---|---|---|
| {runtime} | {versão exata} | {papel no sistema} |
```

Uma linha por tecnologia principal. Versão exata dos arquivos de runtime — se não encontrada, usar `latest` sem inventar número.

---

## Passo 4 — Seção de Variáveis de Ambiente

Extrair do `.env.example` (ou `.env.sample`). Classificar cada variável como obrigatória ou opcional com base em comentários no arquivo ou em valores default presentes.

```markdown
## Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha os valores:

```bash
cp .env.example .env
```

| Variável | Obrigatória | Descrição | Exemplo |
|---|---|---|---|
| `DATABASE_URL` | Sim | String de conexão do banco principal | `postgresql://...` |
| `REDIS_URL` | Não | URL do Redis (default: localhost) | `redis://localhost:6379` |
```

Se `.env.example` não existir: omitir a seção e registrar como gap no resumo final (Passo 8).

---

## Passo 5 — Seção de Comandos Disponíveis

Extrair dos scripts do `package.json`, `Makefile` ou equivalente. Incluir apenas os comandos que um desenvolvedor usaria no dia a dia — excluir scripts internos de build de CI.

```markdown
## Comandos Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia servidor de desenvolvimento com hot reload |
| `npm test` | Executa a suite de testes |
| `npm run lint` | Verifica e corrige estilo de código |
| `npm run build` | Gera build de produção |
```

Adaptar o prefixo (`npm`, `yarn`, `pnpm`, `make`, `go`, `python`, etc.) à stack detectada.

---

## Passo 6 — Seção de Links

Construir a tabela de links com base no que foi detectado. Incluir apenas links que possam ser verificados ou inferidos com alta confiança — não inventar URLs.

```markdown
## Links

| Recurso | Link |
|---|---|
| Repositório | [GitHub](https://github.com/{REPO_ORG}/{REPO_NAME}) |
| API Docs | [Swagger]({URL detectada — rota /docs ou /swagger}) |
| Engineering Handbook | [{NomeDoServico} no Playbook]({URL ou path detectado}) |
| Staging | [{URL detectada no .env.example ou docker-compose}] |
| Produção | [{URL detectada no .env.example ou README existente}] |
| Logs | [Cloud Logging](https://console.cloud.google.com/logs) |
```

Regras:
- URL da API Docs: procurar rota `/docs`, `/swagger`, `/api-docs` no código ou em variável `SWAGGER_URL` / `API_DOCS_URL` no `.env.example`.
- URL do playbook: usar o path encontrado no Passo 1.6; se não encontrado, omitir a linha.
- URLs de staging/produção: procurar em variáveis `APP_URL`, `BASE_URL`, `API_URL` no `.env.example` ou em comentários do `docker-compose.yml`.

---

## Passo 7 — Seção de Contribuição

Se `CONTRIBUTING.md` existir: referenciar o arquivo em vez de duplicar o conteúdo.

```markdown
## Contribuindo

Leia o [CONTRIBUTING.md](./CONTRIBUTING.md) para o guia completo.
```

Se não existir: gerar instruções mínimas baseadas no que foi detectado (branch pattern do `.github/`, branch padrão via `origin/HEAD`, e presença de `commitlint.config.js` na raiz).

**Com `commitlint.config.js`** (alinhar a [_shared/commit-message.md](./_shared/commit-message.md)):

```markdown
## Contribuindo

1. Crie um branch a partir da branch padrão do repositório (ex.: `develop` ou `main`): `git checkout -b PLAT-123/feat-minha-feature`
2. Commits no formato Conventional Commits validados pelo Husky:
   - Tipos: `chore`, `ci`, `feat`, `fix`, `perf`, `refactor`, `revert`, `test` (documentação: `chore(docs): …`)
   - Assunto em sentence-case, até 50 caracteres após `tipo(escopo): `
   - Footer obrigatório: `Refs: PLAT-123` (ou ticket na primeira linha; atalhos `[NOID]`, `[TEST]`, `[CI-CD]` quando aplicável)
3. Abra um Pull Request; o título deve seguir as mesmas regras se o merge for squash
```

**Sem commitlint:**

```markdown
## Contribuindo

1. Crie um branch a partir da branch padrão: `git checkout -b feat/minha-feature`
2. Faça commits seguindo [Conventional Commits](https://www.conventionalcommits.org/)
3. Abra um Pull Request descrevendo o que mudou e como testar
```

---

## Passo 8 — Preservar conteúdo manual existente

Se já existe um `README.md`:

1. Extrair todos os blocos entre `<!-- manual -->` e `<!-- /manual -->` e reinseri-los na seção mais próxima semanticamente no novo README.
2. Se o README existente tiver seções inteiramente escritas à mão sem marcação, **perguntar ao usuário** antes de sobrescrever:

```
O README existente tem conteúdo não gerado automaticamente nas seções: {lista}.
Deseja preservar essas seções? [s/N]
```

---

## Passo 9 — Resumo e gaps detectados

Após escrever o `README.md`, produzir no chat um resumo conciso:

```
README.md gerado em {path}.

Seções incluídas: {lista}

Gaps detectados (não incluídos por falta de fonte):
- .env.example não encontrado → seção "Variáveis de Ambiente" omitida
- URL do Swagger não detectada → link de API Docs omitido
- {outros gaps}

Ações recomendadas:
- Criar .env.example com as variáveis detectadas no código
- {outras ações}
```

Gaps não são erros — são informação acionável para o time.

---

## Checklist final

- [ ] Nome e descrição do projeto refletem o repositório real — sem "Projeto do time X"
- [ ] Badges gerados com versões reais dos arquivos de runtime — sem inventar versão
- [ ] Quick Start testável: seguir os passos produz um serviço respondendo localmente
- [ ] Variáveis de ambiente extraídas do `.env.example` — sem expor valores reais de produção
- [ ] Comandos extraídos dos scripts reais do projeto — sem comandos genéricos inventados
- [ ] Links do playbook incluídos se documentação foi encontrada
- [ ] Badge de CI apontando para o workflow correto do repositório
- [ ] Conteúdo manual preservado ou confirmação obtida do usuário antes de sobrescrever
- [ ] Nenhum placeholder vazio (`{PREENCHER}`, `TODO`, `...`) no arquivo final
- [ ] Nenhuma informação sensível (tokens, senhas, IPs internos) no arquivo gerado
