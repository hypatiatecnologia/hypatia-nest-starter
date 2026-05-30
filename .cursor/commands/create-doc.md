---
description: Doc técnica profunda em Markdown local; não é playbook nem diagnóstico ROI.
---

**Objetivo:** documentação navegável do repo (local).

**Quando usar:** referência técnica fora do handbook.

**Não usar quando:** sprint/ROI → [`diagnostico`](./diagnostico.md); MkDocs empresa → [`create-playbook-doc`](./create-playbook-doc.md).

**Done when:** arquivo(s) gerados conforme flags `--update`.

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md)

# create-doc — Documentação de repositório

Use este command quando:
- O usuário pede para documentar um serviço, repositório ou módulo.
- É necessário criar ou atualizar uma página de documentação técnica.
- O objetivo é gerar referência navegável para novos desenvolvedores ou revisores.

**Ativa automaticamente:** [architecture/rule.mdc](../rules/architecture/rule.mdc), [principles/rule.mdc](../rules/principles/rule.mdc), [errors-and-logging/rule.mdc](../rules/errors-and-logging/rule.mdc).

---

## Uso

```
/create-doc <caminho-ou-nome> [--lang <idioma>] [--update <escopo>]
```

**Flags:**
- `--lang <idioma>` → idioma da prosa documentada (ex.: `--lang english`, `--lang portuguese`). Padrão: **português do Brasil**.
- `--update <escopo>` → controla o que é regenerado quando o arquivo já existe:
  - `all` (padrão) — regenerar tudo
  - `services` — atualizar apenas prosa e tabelas; manter diagramas Mermaid intactos
  - `diagrams` — regenerar apenas blocos Mermaid; manter toda prosa intacta

Se apenas um nome for fornecido sem caminho, procurar no diretório de trabalho atual.

---

## Derivação do slug (obrigatório)

O slug é o identificador usado para nomear o arquivo de saída. Derivar nesta ordem de precedência:

1. **`package.json` → campo `name`**: usar o valor literal, substituindo `/` por `-` (scoped packages: `@org/nome` → `org-nome`).
2. **`go.mod` → última parte do caminho do módulo**: `github.com/org/meu-servico` → `meu-servico`.
3. **`pyproject.toml` / `setup.cfg` → campo `name`**.
4. **`pom.xml` → `<artifactId>`**.
5. **`composer.json` → campo `name`** (parte após `/`).
6. **Nenhum manifesto encontrado**: usar o nome do diretório raiz do repositório, em lowercase, com espaços substituídos por `-`.

Após obter o nome bruto, normalizar: lowercase, substituir underscores por hífens, remover caracteres não alfanuméricos exceto `-`.

Exemplos: `fury_shipping-returns-api` → `shipping-returns-api` | `@myorg/payments-service` → `myorg-payments-service` | `MyApp` → `myapp`.

---

## Regras gerais (obrigatórias)

**Idioma:** escrever toda prosa de documentação no idioma definido por `--lang`. Nomes de campos, valores de status, mensagens de erro e constantes encontrados verbatim no código devem ser reproduzidos exatamente como estão — não traduzir conteúdo extraído de fonte.

**Completude:** todos os exemplos de JSON, structs de mensagens, schemas e snippets de payload DEVEM ser totalmente escritos. Nunca usar `...`, `// ...`, `{ ... }` ou qualquer placeholder para abreviar conteúdo.

**Update mode:** antes de escrever, verificar se `docs/{slug}.md` já existe.
- Se **não existir**: criação completa (ignorar `--update`).
- Se **já existir**: re-explorar o código e produzir versão atualizada conforme o escopo:
  - `all` — re-explorar tudo; atualizar todo o conteúdo e diagramas.
  - `services` — atualizar prosa, tabelas e exemplos JSON. **Manter blocos ` ```mermaid ` existentes exatamente como estão.**
  - `diagrams` — regenerar apenas blocos ` ```mermaid `. **Manter toda prosa existente exatamente como está.**
  - Em todos os casos: atualizar a data no cabeçalho `_Atualizado em:_`.

**Saída:** verificar se o diretório `docs/` existe na raiz do projeto; se não existir, criá-lo antes de escrever. Escrever o arquivo em `docs/{slug}.md` usando a ferramenta Write. Não exibir o Markdown no chat como bloco de código.

---

## Detecção do tipo de repositório (obrigatório antes do Passo 1)

Antes de iniciar a exploração, classificar o repositório em um dos tipos abaixo. O tipo determina quais seções são geradas e como a seção de "interface de entrada" é nomeada.

| Tipo | Indicadores | Seção substituta a "Endpoints" |
|---|---|---|
| **API HTTP** | controllers com rotas, `@RestController`, `router.get/post`, `app.use`, `urlpatterns` | `## Endpoints` |
| **Biblioteca / SDK** | ausência de server/listener, exports de funções/classes públicas, `index.ts`, `lib/`, ausência de porta escutada | `## API Pública` |
| **CLI** | `cmd/`, `bin/`, `commander`, `cobra`, `click`, `argparse`, `symfony console`, scripts com `argv` | `## Comandos CLI` |
| **Worker / Job** | ausência de HTTP listener, presença de loop de consumo (`for msg := range`, `consumer.poll`, `schedule`, `cron`) | `## Jobs e Handlers de Mensagem` |
| **Híbrido** (ex.: API + Worker) | combinação dos indicadores acima | ambas as seções, na ordem: `## Endpoints` depois `## Jobs e Handlers de Mensagem` |

### Conteúdo das seções substitutas

**`## API Pública`** (bibliotecas/SDKs): documentar cada função/método/classe exportada publicamente.
- Um H3 por função ou grupo de funções relacionadas.
- Tabela de parâmetros: `| Parâmetro | Tipo | Obrigatório | Descrição |`
- Tabela de retorno: `| Tipo | Descrição |`
- Comportamento de erro: quais exceções/erros são lançados e quando.
- Exemplo de uso completo (código real, sem placeholders).
- Diagrama `flowchart TD` apenas se a função tiver lógica de branch não trivial.

**`## Comandos CLI`** (CLIs): documentar cada comando e subcomando.
- Um H3 por comando raiz; H4 por subcomando se houver.
- Tabela de flags/argumentos: `| Flag | Tipo | Obrigatório | Padrão | Descrição |`
- Exemplo de invocação completo: `$ nome-do-cli comando --flag valor`
- Saída esperada (stdout/stderr) em bloco de código.
- Códigos de saída: `| Código | Significado |`

**`## Jobs e Handlers de Mensagem`** (workers): documentar cada consumer/job.
- Um H3 por job ou consumer.
- Origem: tópico/fila/cron expression/trigger.
- Struct completa da mensagem de entrada (com exemplo de payload real).
- Passos de processamento (lista numerada).
- Diagrama `flowchart TD` mostrando o fluxo de processamento e os caminhos de erro.
- Comportamento em caso de falha: retry, dead-letter, alarme, descarte.

---

## Passo 1 — Exploração em três fases

**Regra `/ping`:** o endpoint `/ping` (ou `/health`, `/healthz`, `/actuator/health`) é um health-check interno e deve ser **completamente ignorado** em toda análise e documentação.

### Fase A — Análise estrutural (executar primeiro)

Mapeamento de padrões de dispatch e variação antes de tocar em endpoints. Pergunta-guia: *"O que este sistema decide em runtime, e quais são as alternativas que pode escolher?"*

1. Encontrar `abstract class` + subclasses concretas anotadas com `@Service`, registradas em factory, mapa ou container de injeção de dependência.
2. Encontrar enums com 4+ valores usados em `switch` ou como chaves em `Map<Enum, Handler>`.
3. Encontrar interfaces com 3+ implementações concretas.
4. Inventariar classes com sufixos: `Handler`, `Strategy`, `Processor`, `Pipeline`, `Rule`, `Policy`, `Evaluator`, `Executor`, `Command`, `Chain`.
5. Para cada grupo com 3+ variantes → registrar como estrutura de dispatch crítica.
6. Detectar padrões de máquina de estados (`addNode`/`addTransition`, `StateMachine`, builders de grafo, enum de estado + mapa de transição) → planejar seção de Ciclos de Vida.
7. Registrar cada nome de variante distinto — tornam-se sub-seções em Ciclos de Vida.
8. **Padrões funcionais** (especialmente em Go e TypeScript): detectar também:
   - `map[TipoChave]func(...)` ou `map[string]Handler` onde `Handler` é um tipo de função — cada entrada é uma variante de dispatch.
   - Closures retornadas por factory functions (`func NewHandler(tipo string) HandlerFunc`) — cada tipo é uma variante.
   - Higher-order functions com parâmetro de comportamento (`process(item Item, fn func(Item) error)`) — a função passada é o ponto de variação.
   - Arrays/slices de funções executadas em sequência (middleware chain, pipeline funcional) — cada função é um passo documentável.
   - Em TypeScript: objetos literais `{ [key: string]: (args) => result }` usados como tabela de dispatch.

### Fase B — Contexto de negócio (executar segundo)

Extrair significado de domínio da superfície do código.

1. Ler README e campos de descrição do Swagger/OpenAPI → extrair o propósito de negócio do serviço.
2. Coletar todas as mensagens de exceção/erro escritas em linguagem de negócio (não stack traces) → cada uma é uma regra de negócio.
3. Ler nomes de testes e descrições (`it(`, `describe(`, `@Test`, `func Test`, `def test_`) → são cenários de negócio escritos em linguagem humana.
4. Para cada estado terminal de cada grafo/máquina de estados → identificar qual chamada externa ou evento dispara → revela consequências no mundo real.
5. Construir o glossário de domínio: para cada nome de classe significativo, valor de enum e termo de domínio encontrado no código, mapear para seu significado no mundo real.
6. Identificar os atores (usuário final, operador, sistema externo, job interno) que interagem com o serviço.

### Fase C — Exploração de superfície (executar por último)

Ler TODOS os arquivos de código-fonte relevantes. Coletar:

- Cada endpoint **exceto health-checks**: rota, método HTTP, handler responsável.
- Cada validação: condição de guarda + código/mensagem de erro exato retornado.
- Cada branch de lógica de negócio, retorno antecipado e descarte silencioso (200 OK em entrada inválida).
- Cada chamada de API externa: padrão de URL, corpo da requisição, corpo da resposta, config de timeout/retry.
- Cada serviço de dados: banco de dados (queries, schema), cache (padrão de chave, TTL), armazenamento de objetos (bucket, padrão de caminho), filas/mensageria (tópico, filtros, struct completa da mensagem).
- Todas as entidades/modelos de domínio com campos e tipos.
- Todos os códigos de erro: status HTTP, mensagem, gatilho, comportamento (propagar vs. 200 silencioso).

---

## Passo 2 — Estrutura do arquivo Markdown

Usar exatamente esta ordem de headings:

```
# {NomeDoApp}
_Idioma: {idioma} | Domínio: {domínio} | Tipo: {tipo} | Atualizado em: {data}_

---

## Propósito de Negócio

## Mapa de Conceitos do Domínio

## Cenários de Negócio

## Arquitetura
### Estrutura de Pacotes
### Decisões de Design
### Mecanismos de Dispatch        ← apenas se Fase A encontrou padrões de dispatch

## Ciclos de Vida                 ← apenas se Fase A encontrou máquinas de estados ou dispatch com 3+ variantes
### {NomeDoAgregado}
#### {NomeDoHandler}              ← um por variante concreta detectada

## Endpoints                      ← API HTTP  (substituir conforme tipo detectado)
## API Pública                    ← Biblioteca / SDK
## Comandos CLI                   ← CLI
## Jobs e Handlers de Mensagem    ← Worker / Job
### {MÉTODO} /caminho  OU  ### {NomeDaFunção}  OU  ### {NomeDoComando}  OU  ### {NomeDoJob}

## Entidades de Domínio

## Serviços de Dados

## Serviços Assíncronos e Mensageria

## APIs Externas

## Códigos de Erro

## Glossário de Domínio
```

---

## Passo 3 — Conteúdo de cada seção

### 1. Propósito de Negócio

**Não é uma visão técnica geral.** Responder: por que este serviço existe no mundo real?

- Qual problema de negócio resolve (1–2 frases)
- Quem são os atores (usuário final, operador, transportadora, sistema interno) — usar nomes reais, não "usuário" ou "cliente"
- O que acontece no mundo físico quando o serviço funciona corretamente
- Qual o impacto de negócio quando falha

Apenas prosa — sem listas, sem código. Máximo 2–3 parágrafos curtos. Sem jargão técnico (sem "microsserviço", sem "REST", sem "endpoint").

*Fonte*: README, campos de descrição do Swagger, mensagens de exceção em linguagem de negócio, nomes de estados terminais em grafos.

### 2. Mapa de Conceitos do Domínio

Um único diagrama Mermaid `flowchart TD` mostrando como os principais agregados e entidades se relacionam e se criam. Este é um **diagrama narrativo**, não um diagrama UML de classes — um não-desenvolvedor deve conseguir lê-lo.

Após o diagrama: uma linha de descrição de negócio por nó (papel de negócio, não papel técnico).

*Fonte*: nomes de classes de agregado, relacionamentos entre entidades, estruturas de dispatch da Fase A, análise de atores da Fase B.

### 3. Cenários de Negócio

Uma tabela conectando atores reais a fluxos técnicos e resultados físicos. Colunas: **Cenário | Ator | Fluxo Técnico | Resultado no Mundo Real**.

Cada linha é uma história completa: o que a dispara, quem a inicia, qual caminho percorre no sistema, o que acontece no mundo real como resultado.

Mínimo: uma linha por variante de dispatch principal encontrada na Fase A.

*Fonte*: variantes de dispatch da Fase A, nomes de testes e estados terminais da Fase B, nomes de enum/strategy.

### 4. Arquitetura

**Estrutura de Pacotes:** árvore VS Code-style (use caracteres `├──`, `└──`, `│`). Não usar tabela.

**Decisões de Design:** prosa explicando as principais decisões arquiteturais encontradas no código — padrões usados, trade-offs identificáveis, convenções do projeto.

**Mecanismos de Dispatch** (apenas se Fase A encontrou padrões): subsseção explicando como o sistema decide qual lógica executar em runtime. Conectar o mecanismo técnico (hierarquia de classes abstratas / switch de enum / mapa de strategy) aos cenários de negócio da Seção 3. Um parágrafo curto por estrutura de dispatch encontrada. Apenas prosa.

### 5. Ciclos de Vida — condicional

**Incluir apenas se Fase A detectou máquinas de estados, hierarquias de handlers abstratos ou estruturas de dispatch com 3+ variantes.**

Um H3 por agregado ou grupo de dispatch. Dentro de cada subseção, um H4 por variante concreta detectada.

Cada variante contém:
1. **Quando esta variante é usada** — conexão com o cenário de negócio da Seção 3 (uma frase)
2. **Diagrama `flowchart TD`** mostrando os estados/passos reais desta variante, incluindo estados terminais com seu significado de negócio
3. **Estados terminais** — tabela resumida: `Estado | Significado de Negócio | Gatilho de saída`

*Fonte*: classes abstratas + subclasses da Fase A, grafos de máquina de estados, análise de estados terminais da Fase B.

### 6. Endpoints

Um H3 por endpoint (excluir health-checks). Cada subseção contém:

1. Descrição do que o endpoint faz em linguagem de negócio (uma frase)
2. Tabela de parâmetros de caminho/query: `| Parâmetro | Tipo | Obrigatório | Descrição |`
3. Tabela de schema do corpo da requisição: `| Campo | Tipo | Obrigatório | Descrição |`
4. Tabela de validações: `| Validação | Status HTTP | Mensagem |`
5. Passos do pipeline (lista numerada: descrição do que acontece em cada etapa)
6. Diagrama `flowchart TD` — árvore de decisão mostrando todas as validações, branches, chamadas externas, caminhos de sucesso/erro
7. Diagrama `sequenceDiagram` — interação completa entre atores
8. Por chamada de API externa: URL, JSON do corpo da requisição, JSON do corpo da resposta
9. Corpo da resposta de sucesso (JSON de exemplo completo)

### 7. Entidades de Domínio

Lista vertical, uma entidade por bloco. Antes da tabela de campos, uma frase de contexto de negócio: o que esta entidade representa no mundo real.

Tabela de campos: `| Campo | Tipo | Descrição |`

### 8. Serviços de Dados

Um H3 por serviço realmente utilizado. Se nenhum, escrever "Nenhum."

Para cada serviço: nome, propósito, padrão de chave/query, schema do valor/resultado, comportamento de erro.

### 9. Serviços Assíncronos e Mensageria

Um H3 por serviço realmente utilizado. Se nenhum, escrever "Nenhum."

Para cada serviço: nome do tópico/fila, valores de filtro, struct completa da mensagem (com exemplo de payload), comportamento em caso de falha.

### 10. APIs Externas

Um H3 por API externa chamada. Se nenhuma, escrever "Nenhuma."

Para cada API: URL base, endpoints chamados, configuração de timeout/retry, exemplo completo de request e response.

### 11. Códigos de Erro

Todos os erros de domínio. Colunas: `| Código | Status HTTP | Mensagem | Gatilho | Comportamento | Impacto de Negócio |`

A coluna **Impacto de Negócio** responde: o que este erro significa para o ator que o recebe? Ex.: "Requisição rejeitada — resubmissão necessária com dados válidos" ou "Descarte silencioso — ator não recebe erro mas a ação não foi processada."

### 12. Glossário de Domínio

Tabela mapeando cada termo técnico significativo do código para seu significado no mundo real. Colunas: `| Termo Técnico | Significado no Mundo Real |`

Incluir: nomes de classes, valores de enum, constantes de status, abreviações de domínio. Excluir: termos genéricos de programação (Controller, Repository, Service).

*Fonte*: glossário construído na Fase B.

---

## Passo 4 — Regras para diagramas Mermaid

### Regras para sequenceDiagram

- Declarar participantes explicitamente: `participant Client`, `participant AppName`, etc.
- Usar `activate`/`deactivate` para mostrar tempo de processamento em interações longas — **apenas no nível raiz**, nunca dentro de `alt`/`else`/`end`.
- Usar `alt`/`else`/`end` para branches condicionais; `opt`/`end` para condicionais de branch único.
- Tipos de seta: `->>` para async/fire-and-forget; `-->>` para retornos de resposta.
- Nomes de participantes devem ser palavras únicas ou entre aspas (`participant "Retry Service"`).
- Nunca usar caracteres especiais (`{`, `}`, `:` exceto como seta) sem aspas em labels.

#### Proibições críticas (causam falha silenciosa)

- **NUNCA aninhar `alt`/`loop`/`opt`/`par` dentro de outro.** Achatar em `else` adicionais no nível raiz.
- **NUNCA chamar `activate`/`deactivate` dentro de `alt`/`else`/`end`.**
- **NUNCA usar `*`, `#` ou backticks no texto de mensagens.**
- **NUNCA usar palavra reservada do Mermaid como alias de participante:** `alt`, `else`, `end`, `loop`, `opt`, `par`, `and`, `rect`, `note`, `over`, `activate`, `deactivate`, `autonumber`, `title`, `actor`, `participant`. Usar prefixo/sufixo para disambiguar (ex.: `ENDST`, `ALTPATH`).
- **`alt` sem `else` é inválido** — usar `opt ... end` para condicionais de branch único.

### Regras para flowchart TD

- Sempre `flowchart TD` — nunca `graph TD`.
- IDs de nó: apenas alfanumérico (`A`, `CheckInput`) — sem hífens, sem espaços.
- Labels com caracteres especiais DEVEM ser entre aspas: `A["texto com (parênteses)"]`.
- Qualquer label contendo `{` ou `}` DEVE ser entre aspas: `A["POST /items/{id}"]`.
- Sempre colocar labels de diamante com `?` `>` `<` `=` `+` `:` `|` `&` `-` entre aspas: `CHECK{"é válido?"}`.
- Sem sequências de escape `\"` dentro de labels — usar texto simples ou `#quot;`.

---

## Passo 5 — Multi-stack: pontos de atenção por tecnologia

Ao explorar o código, adaptar a análise conforme a stack detectada:

| Stack | Onde encontrar endpoints | Onde encontrar erros | Onde encontrar entidades |
|---|---|---|---|
| Node/TypeScript (Express/Fastify/NestJS) | `router.get/post`, decorators `@Get/@Post`, `app.use` | classes `extends Error`, `HttpException`, enums de código | interfaces/types, classes com `@Entity` |
| Java/Kotlin + Spring | `@RestController`, `@GetMapping`, `@PostMapping` | `@ControllerAdvice`, `ResponseStatusException`, enums de código | `@Entity`, `@Document`, data classes |
| Go | `http.HandleFunc`, `mux.Handle`, `chi.Route`, handlers em `router` | erros customizados, constantes de status, structs de erro | structs com tags `json:`, `db:`, `bson:` |
| Python (FastAPI/Django/Flask) | `@app.get`, `@router.post`, `urlpatterns`, `@blueprint.route` | `HTTPException`, classes `extends Exception`, `ValidationError` | `BaseModel` Pydantic, `models.Model` Django |
| PHP (Laravel/Symfony) | `Route::get`, `@Route` annotation, `routes/api.php` | `ValidationException`, classes de Exception customizadas, `abort()` | `Model` Eloquent, `Entity` Doctrine |

---

## Passo 6 — Checklist final (verificar antes de declarar concluído)

### Camada de negócio
- [ ] Seção "Propósito de Negócio" presente e escrita em linguagem simples — sem jargão técnico
- [ ] Mapa de Conceitos mostra relacionamentos entre todos os principais agregados
- [ ] Tabela de Cenários tem uma linha por variante de dispatch principal, com ator + resultado físico
- [ ] Glossário de Domínio presente ao final do documento
- [ ] Tabela de Códigos de Erro tem coluna "Impacto de Negócio"

### Análise estrutural
- [ ] Fase A executada antes da Fase C — estruturas de dispatch identificadas antes da exploração de endpoints
- [ ] Tipo de repositório detectado (API HTTP / Biblioteca / CLI / Worker / Híbrido) e registrado no cabeçalho
- [ ] Seção de interface de entrada usa o nome correto para o tipo detectado (`Endpoints` / `API Pública` / `Comandos CLI` / `Jobs e Handlers de Mensagem`)
- [ ] Toda classe abstrata com 3+ subclasses concretas tem sua própria subseção em Ciclos de Vida
- [ ] Todo enum de dispatch / mapa de strategy com 3+ variantes tem suas próprias subseções
- [ ] Padrões funcionais (map de funções, closures de factory, higher-order functions) inspecionados em Go/TypeScript

### Diagramas
- [ ] Health-check endpoints completamente excluídos
- [ ] Todo endpoint tem diagrama `flowchart TD`
- [ ] Todo endpoint tem `sequenceDiagram` com `alt/else/end` para paths condicionais
- [ ] Toda variante de ciclo de vida tem `flowchart TD`
- [ ] **Sem `alt` aninhado dentro de `alt`** — todos os branches são `alt/else/end` no nível raiz
- [ ] **Sem `alt` sem `else`** — usar `opt ... end` para condicionais de branch único
- [ ] **Sem `activate`/`deactivate` dentro de `alt`/`else`/`end`**
- [ ] Nenhuma palavra reservada do Mermaid usada como alias de participante
- [ ] Qualquer label contendo `{` ou `}` está entre aspas
- [ ] Sem `\"` dentro de labels Mermaid

### Markdown
- [ ] Diretório `docs/` criado se não existia
- [ ] Arquivo salvo em `docs/{slug}.md` — nome do arquivo bate com o slug derivado do manifesto
- [ ] Nenhum exemplo incompleto — zero `...`, `// ...`, `{ ... }` como placeholder
- [ ] Descartes silenciosos (200 OK em entrada inválida) documentados em Validações e Códigos de Erro
- [ ] Data atualizada no cabeçalho do documento
- [ ] Nenhuma tag HTML no documento Markdown
