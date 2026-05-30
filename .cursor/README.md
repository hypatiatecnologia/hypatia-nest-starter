# Cursor — Configuração Hypatia

**IDE padrão do ecossistema Hypatia.** Este diretório é versionado em cada repo e copiado automaticamente ao rodar `npm run create-service` a partir do **hypatia-nest-starter** (fonte canônica para backends NestJS).

Inclui rules, commands, hooks de segurança e skills para agentes autônomos. Frontends (Morpheus, Olympus) devem copiar/adaptar a mesma base.

## Estrutura

```
.cursor/
├── AGENTS.md              # Guardrails obrigatórios para agentes autônomos
├── README.md              # Este arquivo
├── hooks.json             # Registro dos hooks de segurança
├── commands/              # 21 comandos com estrutura _shared/
│   ├── COMMANDS.md        # Índice/roteador
│   ├── _shared/           # Recursos compartilhados
│   └── *.md               # Comandos individuais
├── examples/              # 10 testes de comportamento das rules
├── hooks/                 # 2 hooks de segurança
├── rules/                 # 31 rules por stack (incl. nestjs-patterns deste repo)
├── skills-cursor/         # 13 skills oficiais
└── user-rules/            # Texto canônico para Cursor Settings → Rules for AI

# Na raiz do repositório (fora de .cursor/):
├── .cursorignore          # Exclui segredos do contexto do agente
└── .cursorindexingignore  # Exclui build/deps da indexação
```

## Componentes Principais

### 1. Rules (31 arquivos .mdc)

Cobertura completa por stack:
- **Princípios**: principles, cognitive-complexity, architecture
- **Linguagens**: typescript, typescript-node, typescript-react, typescript-react-native, go, java-spring, python, php, php7, laravel, symfony, zend-framework
- **Segurança**: typescript-security, go-security, java-security, php-security, python-security
- **Padrões**: hypatia-ecosystem, nestjs-patterns (este repo), company-patterns (picker manual), naming-and-files, errors-and-logging, gitflow, openapi-contracts, node-express, tester, linguagem-pt-br

### 2. Commands (21 arquivos .md)

| Command | Propósito |
|---------|-----------|
| `commit` | Mensagens de commit (commitlint) |
| `pr` | Rascunho de PR |
| `revisao-pr` | Lint + testes em diffs pequenos |
| `test` | Testes (escrever + rodar) |
| `debug` | Debugging de bugs |
| `refactor` | Refatoração preservando comportamento |
| `security-review` | Auditoria de segurança |
| `deps-audit` | Auditoria de dependências e supply chain |
| `create-doc` | Documentação técnica |
| `create-playbook-doc` | Documentação no handbook |
| `spec` | Specs e ADRs |
| `migrate` | Migrations de banco |
| `contract-check` | Paridade OpenAPI vs implementação |
| `onboard` | Onboarding de devs |
| `explain` | Explicar código (read-only) |
| `add-telemetry` | Telemetria (traces/métricas) |
| `diagnostico` | Diagnóstico + issues/ROI |
| `readme` | README raiz |
| `create-readme` | Alias compatível para `readme` |
| `review-nest-patterns` | Revisão de módulo NestJS (Hypatia starter) |
| `review-patterns` | Revisão padrões Idea/Express (outros repos) |

### 3. Skills (13)

| Skill | Uso |
|-------|-----|
| `babysit` | PR merge-ready (CI, comentários) |
| `split-to-prs` | Dividir trabalho em vários PRs |
| `canvas` | Visualizações e artefatos analíticos |
| `create-rule` | Criar novas regras do Cursor |
| `create-skill` | Criar novas skills |
| `create-hook` | Criar novos hooks |
| `create-subagent` | Criar subagentes especializados |
| `migrate-to-skills` | Migrar commands para skills |
| `statusline` | Configurar status line no CLI |
| `update-cursor-settings` | Modificar settings.json |
| `update-cli-config` | Configuração de CLI |
| `shell` | Comandos shell especializados |
| `sdk` | Uso do Cursor SDK |

### 4. Hooks de Segurança

- **block-rm.sh**: Bloqueia `rm -rf` em paths críticos (`/`, `/home/`, `/Users/`, `.git/`)
- **redact-prompt.sh**: Bloqueia envio de prompt se detectar padrões de secret (AWS, tokens, JWT, PEM)

Os hooks são registrados em [`hooks.json`](hooks.json). Em instalação global,
copie este template para `~/.cursor/`; em instalação por projeto, copie para
`<repo>/.cursor/`. Os caminhos dos hooks foram definidos para funcionar depois
da cópia do conteúdo para uma pasta `.cursor/`.

### 5. Examples (Testes de Comportamento)

| Arquivo | Rule Testada |
|---------|--------------|
| `01-architecture.example.md` | Separação de camadas, DIP |
| `02-security-ts.example.md` | Validação de entrada, IDOR |
| `03-cognitive-complexity.example.md` | Funções simples, guard clauses |
| `04-errors-and-logging.example.md` | DomainError, RFC 7807 |
| `05-tester.example.md` | Cenários de teste, AAA |
| `06-gitflow.example.md` | Conventional Commits |
| `07-go.example.md` | Error handling, queries parametrizadas |
| `08-java-spring.example.md` | Controller magro, JPA, IDOR |
| `09-php.example.md` | Controller magro, FormRequest, Policy |
| `10-nestjs-patterns.example.md` | Controller magro, DTO class-validator, service + Prisma |

## Hierarquia de Precedência

1. **`security/*`** da linguagem em contexto
2. **`architecture`** + **`cognitive-complexity`**
3. **`nestjs-patterns`** ou **`company-patterns`** (conforme stack)
4. **Stack específica** (`typescript-node`, `java-spring`, etc.)
5. **`errors-and-logging`**, **`naming-and-files`**, **`linguagem-pt-br`**
6. **`openapi-contracts`** quando houver API pública versionada
7. **Commands** `_shared/commit-message.md`
8. **Command do repo** sobre command global homônimo

Em conflito: alternativa **mais segura** e com **menos vazamento** de dados internos.

## Uso

### Cenário A — Global (`~/.cursor`)

As rules e commands ficam ativos em **todos os projetos** abertos no Cursor. Indicado para convenções pessoais ou de time que devem ser universais.

```bash
cp -R cursor/.cursor-unified/. ~/.cursor/
```

> Neste cenário as rules `alwaysApply: true` carregam em qualquer workspace. Rules com `globs` só ativam nos arquivos correspondentes.

### Cenário B — Por projeto (`.cursor/` na raiz do repo)

As rules e commands ficam restritos ao projeto. Indicado quando a configuração é específica de uma stack ou equipe, ou quando você quer sobrescrever parcialmente as regras globais.

```bash
mkdir -p /seu/projeto/.cursor
cp -R cursor/.cursor-unified/. /seu/projeto/.cursor/
```

> Não use symlink `<repo>/.cursor/rules` → `~/.cursor/rules` — isso duplica as rules `alwaysApply` no contexto.

### Usar Skills

No chat do Cursor, mencione a skill pelo nome para o agente carregar as instruções:
- `split-to-prs` — dividir trabalho em PRs
- `babysit` — manter PR merge-ready
- `canvas` — criar visualizações e artefatos analíticos

### Usar Commands

Digite `/` no chat do Cursor para ver a lista completa de commands disponíveis. Consulte [`commands/COMMANDS.md`](commands/COMMANDS.md) para o guia de quando usar cada um.

## Manutenção

Para modificar esta configuração:
1. Siga as restrições em `AGENTS.md`
2. Mantenha a hierarquia de precedência em `rules/_shared/precedence.md`
3. Preserve os hooks de segurança em `hooks/`
4. Mantenha os exemplos de teste comportamental em `examples/`

