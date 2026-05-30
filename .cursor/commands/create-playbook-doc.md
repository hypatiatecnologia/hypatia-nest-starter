---
description: Documenta serviço no engineering handbook (MkDocs); pode git commit/PR no playbook após confirmação. Use --dry-run primeiro.
---

**Objetivo:** gerar páginas MkDocs no playbook e opcionalmente abrir PR (exceção git/gh).

**Quando usar:** documentar serviço no handbook da empresa.

**Não usar quando:** só README local → [`readme`](./readme.md); doc sem playbook → [`create-doc`](./create-doc.md).

**Done when:** checklist final do Passo 10+ ou saída `--dry-run` exibida.

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md) · Templates: [_shared/playbook-mkdocs-templates.md](./_shared/playbook-mkdocs-templates.md)

# create-playbook-doc — Documentar serviço no Playbook

Use este command quando:
- O usuário quer documentar um serviço/projeto no playbook da empresa.
- É necessário criar ou atualizar páginas no playbook de engenharia.
- O objetivo é gerar documentação navegável para o MkDocs e abrir PR automático.

---

## Uso

```
/create-playbook-doc <caminho-do-repositório> [--section <services|projects>] [--update <escopo>] [--dry-run] [--playbook <caminho>]
```

**Flags:**
- `--section <services|projects>` → seção do playbook onde a doc será adicionada. Padrão: **services**.
- `--update <escopo>` → quando a documentação já existe:
  - `all` (padrão) — regenera tudo, preservando blocos marcados com `<!-- manual -->`
  - `content` — atualiza prosa e tabelas; preserva diagramas Mermaid e blocos `<!-- manual -->`
  - `diagrams` — regenera apenas diagramas Mermaid; preserva toda prosa e blocos `<!-- manual -->`
- `--dry-run` → lista os arquivos que seriam criados/modificados e o trecho do `mkdocs.yml` que seria inserido, sem escrever nada. Encerra antes do Passo 3.
- `--playbook <caminho>` → aponta o playbook explicitamente, sobrepondo a descoberta automática do Passo 0.

**Nota — modo de geração:** não existe mais flag `--mode`. O modo (`full` ou `simple`) é inferido automaticamente no Passo 2.5 com base na análise do repositório.

---

## Passo 0 — Localizar o playbook e pré-verificações obrigatórias

O caminho do playbook **não é fixo**. Executar esta sequência de descoberta antes de qualquer outra coisa:

### 0.1 — Descoberta do playbook

Procurar um repositório que seja o playbook de engenharia seguindo esta ordem de precedência:

1. **Flag explícita** `--playbook <caminho>`: usar o caminho fornecido diretamente.
2. **Workspace atual** (diretório aberto no Cursor): verificar se o workspace corrente **é** o playbook — isto é, se contém um `mkdocs.yml` com `site_name:` referenciando "Playbook" ou "Handbook". Se sim, usar o diretório raiz do workspace.
3. **Repositório irmão**: procurar por um diretório chamado `engineering-handbook` (ou similar contendo "handbook" no nome) **no mesmo diretório pai** do workspace atual. Ex.: se o workspace é `/home/user/projects/meu-servico`, procurar em `/home/user/projects/`.
4. **Busca nos pais**: subir um nível por vez (máximo 4 níveis a partir do workspace) e repetir a busca por diretório com `mkdocs.yml` válido.

**Critério de identificação de um playbook válido**: o diretório contém `mkdocs.yml` E contém `docs/services/` ou `docs/projects/`.

Se nenhum playbook for encontrado após todos os passos: **abortar com a mensagem**:

```
Playbook não encontrado. Use a flag --playbook <caminho> para especificar o diretório
do engineering-handbook. Exemplo:
  /create-playbook-doc ./meu-servico --playbook ../engineering-handbook
```

### 0.2 — Pré-verificações

Após localizar o playbook (`{PLAYBOOK_DIR}`), executar em sequência:

1. **Ler o `{PLAYBOOK_DIR}/mkdocs.yml`** para entender a navegação atual e identificar onde inserir a nova entrada.
2. **Verificar se a documentação já existe** para decidir entre criação nova e atualização (`--update`).
3. **Verificar se o repositório alvo existe** no caminho fornecido.

### 0.3 — Detectar org e repositório do projeto analisado

Executar no repositório **alvo** (não no playbook):

```bash
git -C {REPO_DIR} remote get-url origin
```

Parsear o resultado para extrair `{REPO_ORG}` e `{REPO_NAME}`:
- SSH: `git@github.com:Org/repo-name.git` → `Org` / `repo-name`
- HTTPS: `https://github.com/Org/repo-name.git` → `Org` / `repo-name`

Se o remote não existir ou o parse falhar, usar `{REPO_ORG}` = nome da organização inferido do código (imports, package.json repository field, etc.) e `{REPO_NAME}` = slug derivado.

Essas variáveis substituem todos os placeholders `{org}` e `{slug}` nos arquivos gerados — Quick Links, clone URL, PR body, referências cruzadas.

---

## Derivação do slug (obrigatório)

O slug é o identificador usado para nomear o diretório/arquivo de saída. Derivar nesta ordem de precedência:

1. **`package.json` → campo `name`**: usar o valor literal, substituindo `/` por `-` (scoped packages: `@org/nome` → `org-nome`).
2. **`go.mod` → última parte do caminho do módulo**: `github.com/org/meu-servico` → `meu-servico`.
3. **`pyproject.toml` / `setup.cfg` → campo `name`**.
4. **`pom.xml` → `<artifactId>`**.
5. **`composer.json` → campo `name`** (parte após `/`).
6. **Nenhum manifesto encontrado**: usar o nome do diretório raiz do repositório.

Normalizar: lowercase, substituir underscores por hífens, remover caracteres não alfanuméricos exceto `-`.
Remover prefixos de organização se presentes (ex.: `fury_shipping-returns-api` → `shipping-returns-api`).

---

## Passo 1 — Análise do repositório (três fases)

**Regra de health-check:** ignorar completamente `/ping`, `/health`, `/healthz`, `/actuator/health` em toda análise.

### Fase A — Análise estrutural

Mapeamento de padrões de dispatch antes de tocar em endpoints. Executar primeiro.

1. Encontrar `abstract class` + subclasses concretas anotadas com `@Service`, registradas em factory, mapa ou container DI.
2. Encontrar enums com 4+ valores usados em `switch` ou como chaves em `Map<Enum, Handler>`.
3. Encontrar interfaces com 3+ implementações concretas.
4. Inventariar classes com sufixos: `Handler`, `Strategy`, `Processor`, `Pipeline`, `Rule`, `Policy`, `Evaluator`, `Executor`, `Command`, `Chain`.
5. Para cada grupo com 3+ variantes → registrar como estrutura de dispatch crítica.
6. Detectar máquinas de estados (`StateMachine`, `addNode`/`addTransition`, enum de estado + mapa de transição) → planejar seções de Ciclos de Vida.
7. Detectar padrões funcionais (Go/TypeScript): `map[string]func(...)`, closures de factory, higher-order functions, arrays de middleware/pipeline.

### Fase B — Contexto de negócio

1. Ler README e campos de descrição do Swagger/OpenAPI → extrair propósito de negócio.
2. Coletar mensagens de exceção/erro em linguagem de negócio → cada uma é uma regra de negócio.
3. Ler nomes de testes e descrições (`it(`, `describe(`, `@Test`, `func Test`, `def test_`) → cenários de negócio.
4. Para cada estado terminal de máquinas de estado → identificar chamada externa ou evento disparador.
5. Construir glossário de domínio: mapear cada nome de classe significativo, valor de enum e termo de domínio.
6. Identificar atores: usuário final, operador, sistema externo, job interno.
7. **Detectar a stack tecnológica** (framework, linguagem, banco, cache, mensageria, runtime) para os badges.

### Fase C — Exploração de superfície

Ler TODOS os arquivos de código-fonte relevantes. Coletar:

- Cada endpoint (exceto health-checks): rota, método HTTP, handler.
- Cada validação: condição + código/mensagem de erro exato.
- Cada branch de lógica de negócio, retorno antecipado e descarte silencioso.
- Cada chamada de API externa: URL, corpo da requisição/resposta, timeout/retry.
- Cada serviço de dados: banco (queries, schema), cache (chave, TTL), objetos, filas (tópico, struct).
- Todas as entidades/modelos de domínio com campos e tipos.
- Todos os códigos de erro: status HTTP, mensagem, gatilho, comportamento.
- **Variáveis de ambiente** utilizadas pelo serviço (para a seção Setup).
- **Scripts disponíveis** no `package.json`, `Makefile`, etc. (para a seção Setup).

---

## Passo 2 — Detecção do tipo de repositório

Antes de gerar os arquivos, classificar:

| Tipo | Indicadores | Seção de interface |
|---|---|---|
| **API HTTP** | controllers com rotas, `@RestController`, `router.get/post`, `urlpatterns` | `## Endpoints` |
| **Biblioteca / SDK** | ausência de server/listener, exports públicos, `index.ts`, `lib/` | `## API Pública` |
| **CLI** | `cmd/`, `bin/`, `commander`, `cobra`, `click`, `argparse` | `## Comandos CLI` |
| **Worker / Job** | ausência de HTTP listener, loop de consumo, `consumer.poll`, `cron` | `## Jobs e Handlers de Mensagem` |
| **Híbrido** | combinação dos acima | ambas as seções |

---

## Passo 2.5 — Decidir o modo de geração automaticamente

Não existe flag `--mode`. Após a análise do Passo 1, avaliar os critérios abaixo e decidir entre `full` e `simple`:

**Escolher `full` (multi-arquivo) se qualquer um dos seguintes for verdadeiro:**
- O repositório tem **5 ou mais endpoints** distintos (excluindo health-checks).
- Existe **banco de dados com 3 ou mais tabelas** com schema detectável.
- Existe **mensageria** com 2 ou mais filas/tópicos/workers.
- Existe **2 ou mais integrações externas** (APIs de terceiros, além do banco e cache).
- O repositório é **híbrido** (API + Worker).
- A estrutura de pastas tem **3 ou mais módulos de negócio** distintos.

**Escolher `simple` (arquivo único) se todos os seguintes forem verdadeiros:**
- Menos de 5 endpoints.
- Banco simples (0–2 tabelas) ou sem banco.
- No máximo 1 fila/worker.
- No máximo 1 integração externa.
- Estrutura de pastas simples (sem módulos distintos).

**Comunicar a decisão ao usuário** antes de prosseguir:

```
Modo detectado: full
Motivo: 8 endpoints, 6 tabelas, RabbitMQ com 3 filas, 2 APIs externas.

Arquivos que serão criados:
  docs/services/meu-servico/index.md
  docs/services/meu-servico/architecture.md
  docs/services/meu-servico/api.md
  docs/services/meu-servico/flows.md
  docs/services/meu-servico/data-model.md
  docs/services/meu-servico/integrations.md
  docs/services/meu-servico/setup.md
```

### Se `--dry-run` foi passado

Exibir o resumo acima **mais** o trecho exato que seria inserido no `mkdocs.yml`:

```
Entrada que seria adicionada ao mkdocs.yml:
  - Meu Servico:
      - services/meu-servico/index.md
      - Arquitetura: services/meu-servico/architecture.md
      - API Reference: services/meu-servico/api.md
      - Fluxos de Negócio: services/meu-servico/flows.md
      - Modelo de Dados: services/meu-servico/data-model.md
      - Integrações: services/meu-servico/integrations.md
      - Setup & Config: services/meu-servico/setup.md

Nenhum arquivo foi escrito. Execute sem --dry-run para gerar a documentação.
```

Encerrar imediatamente após exibir a saída — não executar nenhum Passo subsequente.

---

## Passo 3 — Estrutura de arquivos a gerar

### Modo `full` (--mode full)

Gerar um sub-diretório com múltiplos arquivos, seguindo exatamente o padrão do `affiliates-pay`:

**Para `--section services`:**
```
docs/services/{slug}/
├── index.md          ← visão geral + badges + card-grid + arquitetura resumida
├── architecture.md   ← estrutura de pastas + camadas + padrões de código
├── api.md            ← todos os endpoints ou API pública
├── flows.md          ← fluxos de negócio com sequenceDiagram e flowchart
├── data-model.md     ← diagrama ER + tabelas + tipos TypeScript/Go/Python
├── integrations.md   ← RabbitMQ, Redis, APIs externas, Socket.IO
└── setup.md          ← requisitos + setup local + env vars + scripts + troubleshooting
```

**Para `--section projects`:**
```
docs/projects/{slug}/
├── index.md          ← overview + features + quick links + contatos + links úteis
├── architecture.md   ← design + decisões + stack + estrutura de diretórios
├── api.md            ← endpoints completos
├── flows.md          ← fluxos detalhados de negócio
├── setup.md          ← passo a passo + env vars + comandos úteis + troubleshooting
└── troubleshooting.md ← problemas comuns + diagnóstico + soluções
```

### Modo `simple` (--mode simple)

Gerar um único arquivo, seguindo exatamente o padrão de `coupon-service.md`:

**Para `--section services`:** `docs/services/{slug}.md`
**Para `--section projects`:** `docs/projects/{slug}.md`

---


---

## Passo 4–7 — Conteúdo MkDocs, front matter, HTML e Mermaid

**Ler e aplicar integralmente** [_shared/playbook-mkdocs-templates.md](./_shared/playbook-mkdocs-templates.md) ao gerar cada arquivo (templates por seção, modo full/simple, regras YAML, badges, diagramas).

Para refactors ou repos muito grandes: considerar **Plan Mode** (`Shift+Tab`) antes de gerar todos os arquivos.


## Passo 8 — Modo `--update`: preservar conteúdo manual

Quando `--update` é passado e a documentação já existe, aplicar estas regras **antes** de regenerar qualquer arquivo:

### 8.1 — Blocos manuais protegidos

Qualquer conteúdo nos arquivos existentes delimitado por `<!-- manual -->` e `<!-- /manual -->` **nunca deve ser sobrescrito**, independentemente do escopo de `--update`.

Exemplo de uso pelo time no arquivo existente:

```markdown
<!-- manual -->
## Decisões Históricas

Esta seção foi adicionada manualmente após o incident de março/2025.
Não remover sem consultar o time de plataforma.
<!-- /manual -->
```

Ao regenerar o arquivo, extrair todos os blocos `<!-- manual -->...<!-- /manual -->` e reinseri-los na mesma posição relativa (após o mesmo heading pai) no arquivo novo.

### 8.2 — Escopos de `--update`

| Escopo | O que regenera | O que preserva |
|---|---|---|
| `all` | Todo o conteúdo do arquivo | Blocos `<!-- manual -->` |
| `content` | Prosa, tabelas, exemplos JSON, snippets de código | Diagramas Mermaid + blocos `<!-- manual -->` |
| `diagrams` | Apenas blocos ` ```mermaid ` | Toda prosa + blocos `<!-- manual -->` |

Em todos os escopos: atualizar a data no cabeçalho do `index.md` se houver campo de data.

### 8.3 — Avisar sobre mudanças de modo

Se o modo inferido no Passo 2.5 for diferente do modo atual (ex.: repo cresceu e agora seria `full` mas a doc existe em `simple`), **não migrar automaticamente**. Avisar ao usuário:

```
Atenção: o repositório agora qualificaria para modo 'full', mas a documentação
atual está em modo 'simple' (arquivo único). Para migrar, delete os arquivos
existentes e execute o comando sem --update.
```

---

## Passo 9 — Atualizar o mkdocs.yml

Após gerar todos os arquivos, **SEMPRE atualizar o `mkdocs.yml`** do playbook para incluir a nova documentação na navegação.

### Para modo `full`, seção `services`:

Localizar a seção `Serviços:` no `nav:` e adicionar:

```yaml
- {Nome do Serviço}:
    - services/{slug}/index.md
    - Arquitetura: services/{slug}/architecture.md
    - Modelo de Dados: services/{slug}/data-model.md   # apenas se gerado
    - API Reference: services/{slug}/api.md
    - Fluxos de Negócio: services/{slug}/flows.md
    - Integrações: services/{slug}/integrations.md     # apenas se gerado
    - Setup & Config: services/{slug}/setup.md
```

### Para modo `full`, seção `projects`:

Localizar a seção `Projetos:` no `nav:` e adicionar:

```yaml
- {Nome do Projeto}:
    - projects/{slug}/index.md
    - Arquitetura: projects/{slug}/architecture.md
    - API: projects/{slug}/api.md
    - Fluxos: projects/{slug}/flows.md
    - Setup: projects/{slug}/setup.md
    - Troubleshooting: projects/{slug}/troubleshooting.md
```

### Para modo `simple`:

Localizar a seção apropriada e adicionar uma linha simples:

```yaml
- {Nome do Serviço}: services/{slug}.md
# ou
- {Nome do Projeto}: projects/{slug}.md
```

**Regra:** inserir em ordem alfabética dentro da seção, ou no final se ordem não for clara.

---

## Passo 10 — Confirmação interativa antes do PR

Antes de criar o branch e o PR, **sempre** exibir o seguinte resumo e aguardar confirmação explícita do usuário. Não prosseguir automaticamente.

```
─────────────────────────────────────────────
  Documentação gerada — revisar antes do PR
─────────────────────────────────────────────
Serviço : {NomeDoServico} ({REPO_ORG}/{REPO_NAME})
Playbook: {PLAYBOOK_DIR}
Seção   : {services|projects}
Modo    : {full|simple}
Branch  : docs/{slug}

Arquivos {criados|atualizados}:
  {lista de todos os arquivos com status: [NOVO] ou [ATUALIZADO]}

mkdocs.yml: entrada adicionada na seção {Serviços|Projetos}

Deseja criar o PR? [s/N]
─────────────────────────────────────────────
```

- Se o usuário responder **`s`** (ou `sim`, `y`, `yes`): prosseguir com o Passo 11.
- Se responder **`n`** ou qualquer outra coisa: encerrar sem criar branch nem PR, mas **manter os arquivos gerados** no playbook para que o usuário possa revisá-los manualmente.

---

## Passo 11 — Criar o PR no GitHub

Após confirmação no Passo 10, criar o PR automaticamente.
Usar `{PLAYBOOK_DIR}` descoberto no Passo 0 em todos os comandos git.

### 9.1 Criar branch

```bash
git -C {PLAYBOOK_DIR} checkout -b docs/{slug}
```

### 9.2 Stage dos arquivos

```bash
git -C {PLAYBOOK_DIR} add docs/services/{slug}/ mkdocs.yml
# ou
git -C {PLAYBOOK_DIR} add docs/services/{slug}.md mkdocs.yml
```

### 9.3 Commit

> **Exceção aos commands `commit` e `pr`:** este passo **pode** executar `git commit` e `gh pr create` no repositório do playbook — automação pontual do handbook. Os commands [`commit`](./commit.md) e [`pr`](./pr.md) continuam proibidos de executar git/gh nos fluxos normais de desenvolvimento.

Antes do commit, verificar se `{PLAYBOOK_DIR}/commitlint.config.js` existe:

- **Com commitlint:** usar `chore(docs): Adiciona documentação do {NomeDoServico}` (sentence-case, assunto ≤50 chars após `: `) + footer `Refs: {ticket}` ou `[NOID]` no subject. Validar: `printf '%s' '<msg>' | npx --prefix {PLAYBOOK_DIR} commitlint`. Não usar tipo `docs:`.
- **Sem commitlint:** Conventional Commits genérico com tipo `docs:` é aceitável.

```bash
git -C {PLAYBOOK_DIR} commit -m "chore(docs): Adiciona documentação do {NomeDoServico}

- Adiciona {número} páginas em docs/{section}/{slug}/
- Inclui arquitetura, API reference, fluxos de negócio, modelo de dados, integrações e setup
- Atualiza mkdocs.yml com nova entrada de navegação

Refs: [NOID]"
```

(Ajustar `Refs:` para ticket real quando houver.)

### 9.4 Push e criação do PR

Obter o remote origin do playbook para derivar `--repo`:

```bash
git -C {PLAYBOOK_DIR} remote get-url origin
```

Usar o repositório retornado (ex.: `git@github.com:Org/engineering-handbook.git` → `Org/engineering-handbook`) no `gh pr create`:

```bash
git -C {PLAYBOOK_DIR} push origin docs/{slug}

gh pr create \
  --repo {PLAYBOOK_GITHUB_REPO} \
  --title "chore(docs): Adiciona documentação do {NomeDoServico}" \
  --body "$(cat <<'EOF'
## Documentação gerada automaticamente

Serviço: **{NomeDoServico}**
Repositório: `{org}/{slug}`
Seção: `{services|projects}`
Modo: `{full|simple}`

### Arquivos criados

{lista de arquivos gerados com descrição de cada um}

### Atualização do mkdocs.yml

Adicionada entrada de navegação na seção `{Serviços|Projetos}`.

### Como revisar

1. Verifique se o conteúdo técnico reflete o código atual do repositório
2. Confirme se os exemplos JSON e snippets estão corretos
3. Verifique se os diagramas Mermaid renderizam corretamente
4. Confirme se as variáveis de ambiente estão atualizadas

---
*Gerado via `/create-playbook-doc` em {data}*
EOF
)"
```

---

## Passo 12 — Checklist final

### Front matter e estrutura
- [ ] Todo arquivo gerado tem front matter YAML com `title`, `description` e `tags`
- [ ] Primeira tag é sempre o slug do serviço
- [ ] `index.md` tem `<div class="tech-stack">` com badges das tecnologias detectadas
- [ ] `index.md` no modo full tem `<div class="card-grid">` com cards para cada sub-página
- [ ] `mkdocs.yml` atualizado com entrada de navegação

### Conteúdo técnico
- [ ] Slug derivado corretamente do manifesto do projeto
- [ ] Tipo de repositório detectado (API HTTP / Biblioteca / CLI / Worker / Híbrido)
- [ ] Seção de interface usa o nome correto (`Endpoints` / `API Pública` / `Comandos CLI` / `Jobs e Handlers de Mensagem`)
- [ ] Health-check endpoints completamente excluídos da documentação
- [ ] Todos os exemplos JSON são completos — zero `...`, `// ...`, `{ ... }` como placeholder
- [ ] Variáveis de ambiente documentadas na seção Setup
- [ ] Scripts disponíveis documentados na seção Setup
- [ ] Descartes silenciosos (200 OK em entrada inválida) documentados

### Diagramas
- [ ] Diagrama de alto nível no `index.md`
- [ ] Diagrama de camadas no `architecture.md`
- [ ] `flowchart TD` ou `sequenceDiagram` por fluxo principal em `flows.md`
- [ ] `erDiagram` no `data-model.md` (se gerado)
- [ ] `stateDiagram-v2` para entidades com estados (em `flows.md` ou `data-model.md`)
- [ ] Sem `alt` aninhado dentro de `alt`
- [ ] Sem `alt` sem `else` (usar `opt ... end` para branch único)
- [ ] Sem `activate`/`deactivate` dentro de `alt`/`else`/`end`
- [ ] Nenhuma palavra reservada Mermaid como alias de participante
- [ ] Labels com `{` ou `}` estão entre aspas

### PR
- [ ] Confirmação interativa exibida ao usuário antes de criar branch/PR
- [ ] Branch criada com nome `docs/{slug}`
- [ ] Commit com mensagem descritiva
- [ ] PR criado com título e body informativos (org/repo derivados do git remote)
- [ ] URL do PR retornada ao usuário

---

## Passo 13 — Multi-stack: onde encontrar cada artefato

| Stack | Endpoints | Erros | Entidades | Env vars |
|---|---|---|---|---|
| Node/TypeScript | `router.get/post`, `@Get/@Post`, `app.use` | `extends Error`, `HttpException`, enums de código | interfaces/types, `@Entity` | `process.env.*`, `.env.example` |
| Java/Kotlin Spring | `@RestController`, `@GetMapping` | `@ControllerAdvice`, `ResponseStatusException` | `@Entity`, data classes | `application.yml`, `@Value` |
| Go | `http.HandleFunc`, `mux.Handle`, `chi.Route` | structs de erro, constantes de status | structs com tags `json:`, `db:` | `os.Getenv`, `.env` |
| Python FastAPI/Django | `@app.get`, `@router.post`, `urlpatterns` | `HTTPException`, `ValidationError` | `BaseModel` Pydantic, `models.Model` | `os.environ`, `.env` |
| PHP Laravel | `Route::get`, `routes/api.php` | `ValidationException`, `abort()` | `Model` Eloquent | `config/*.php`, `.env` |

---

## Exemplo de uso

```bash
# Documentar serviço (modo inferido automaticamente, seção services)
/create-playbook-doc /caminho/para/meu-servico

# Ver o que seria gerado sem escrever nada
/create-playbook-doc /caminho/para/meu-servico --dry-run

# Documentar na seção projects
/create-playbook-doc /caminho/para/meu-projeto --section projects

# Atualizar apenas os diagramas de um serviço já documentado
/create-playbook-doc /caminho/para/meu-servico --update diagrams

# Atualizar prosa preservando diagramas existentes
/create-playbook-doc /caminho/para/meu-servico --update content

# Apontar o playbook explicitamente (quando a descoberta automática falhar)
/create-playbook-doc /caminho/para/meu-servico --playbook /outro/caminho/engineering-handbook
```
