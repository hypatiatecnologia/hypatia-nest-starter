# Cursor — Configuração multi-stack

Pack portátil de **rules**, **commands**, **hooks** e **skills** para agentes autônomos no Cursor. Funciona em repos de stacks diferentes — o agente detecta o contexto pelo sinal no projeto.

Consulte também [AGENTS.md](AGENTS.md) para guardrails e detecção de stack.

| Sinal no repo | Rules principais |
| --- | --- |
| `react-router.config.ts` / `app/routes/` | [remix-fsd](rules/remix-fsd/rule.mdc), [typescript-react](rules/typescript-react/rule.mdc) |
| `nest-cli.json` | [nestjs-patterns](rules/nestjs-patterns/rule.mdc), [hypatia-ecosystem](rules/hypatia-ecosystem/rule.mdc) (picker) |
| `next.config.*` | [typescript-react](rules/typescript-react/rule.mdc) |

## Estrutura

```
.cursor/
├── AGENTS.md              # Guardrails e detecção de stack
├── README.md              # Este arquivo
├── antigravity/           # Pack Gemini/Antigravity (specs, handoff) — ver antigravity/README.md
├── hooks.json             # Registro dos hooks de segurança
├── commands/              # 32 comandos + _shared/
│   ├── COMMANDS.md        # Índice/roteador
│   ├── _shared/           # Recursos compartilhados
│   └── *.md               # Comandos individuais
├── examples/              # 11 testes de comportamento das rules
├── hooks/                 # 2 hooks de segurança + 1 de formatação
├── rules/                 # 39 rules por stack
├── skills/                # Skills próprias do projeto (carregadas pelo Cursor)
└── user-rules/            # Texto canônico para Cursor Settings → Rules for AI

# Na raiz do repositório (fora de .cursor/):
├── .cursorignore          # Exclui segredos do contexto do agente
└── .cursorindexingignore  # Exclui build/deps da indexação
```

## Componentes principais

### Antigravity (Gemini)

Pack em [antigravity/](antigravity/) para **Planning** no Google Antigravity: specs (Modo A) e passos de handoff (Modo B). Implementação no Cursor via `/handoff` e rules `model-routing` / `token-budget`.

Instalação global Antigravity: `./scripts/sync-cursor-config.sh --gemini --force` ou `./cursor-config/install.sh --force --gemini`.

### 1. Rules (39 arquivos `.mdc`)

Cobertura por stack:

- **Princípios (always-on):** principles, cognitive-complexity, architecture, errors-and-logging, naming-and-files, linguagem-pt-br
- **Front-end:** typescript-react, typescript-react-native, frontend-architecture, tailwind-css, shadcn-ui, **remix-fsd**
- **Node/TS:** typescript, typescript-node, node-express, company-patterns, nestjs-patterns
- **Hypatia (picker manual):** hypatia-ecosystem
- **Outras linguagens:** go, java-spring, python, php, php7, laravel, symfony, zend-framework
- **Segurança:** typescript-security, go-security, java-security, php-security, python-security
- **Transversal:** gitflow, tester, openapi-contracts, environment, architect

Índice completo: [rules/RULES.md](rules/RULES.md)

### 2. Commands (32 arquivos `.md`)

| Command | Propósito |
|---------|-----------|
| `commit` | Mensagens de commit (commitlint) |
| `pr` | Rascunho de PR |
| `revisao-pr` | Lint + testes em diffs pequenos |
| `rescue` | Recuperar branch/PR com conflitos ou CI |
| `test` | Testes (escrever + rodar) |
| `debug` | Debugging de bugs |
| `refactor` | Refatoração preservando comportamento |
| `security-review` | Auditoria de segurança |
| `deps-audit` | Auditoria de dependências e supply chain |
| `create-component` | Scaffold de componente React |
| `create-doc` | Documentação técnica |
| `create-playbook-doc` | Documentação no handbook |
| `spec` | Specs e ADRs |
| `handoff` | Implementar um passo em `specs/steps/*-passo-N.md` |
| `migrate` | Migrations de banco |
| `contract-check` | Paridade OpenAPI vs implementação |
| `onboard` | Onboarding de devs |
| `explain` | Explicar código (read-only) |
| `ensinar` | Explicar conceitos e padrões |
| `add-telemetry` | Telemetria (traces/métricas) |
| `diagnostico` | Diagnóstico + issues/ROI |
| `readme` | README raiz |
| `create-readme` | Alias compatível para `readme` |
| `review-nest-patterns` | Revisão de módulo NestJS |
| `review-patterns` | Revisão padrões Idea/Express (outros repos) |
| `review-design-system` | Auditar design system (tokens, hierarquia, trust signals) |
| `review-design-consistency` | Consistência de design no código (tokens, props, estados) |
| `review-mobile-ui` | Diagnóstico mobile a partir de screenshots |
| `audit-ui` | Auditoria completa de UI, a11y e UX (com código) |
| `ui-developer` | Design review holístico (heurísticas, navegação, referências) |
| `ux-copy` | Microcopy — CTAs, erros, tooltips, labels, placeholders |
| `ux-flow` | Mapear jornada, estados e edge cases |

Índice completo: [commands/COMMANDS.md](commands/COMMANDS.md)

### 3. Skills

**Skills do projeto** (versionadas em [`skills/`](skills/), carregadas pelo Cursor):

| Skill | Uso |
|-------|-----|
| `review-design-system` | Auditar design system (UI, tokens, conversão) |

**Skills built-in** (instaladas e atualizadas pelo próprio Cursor em `~/.cursor/skills-cursor/` — **não** versionar cópia no repo): `babysit`, `split-to-prs`, `canvas`, `create-rule`, `create-skill`, `create-hook`, `create-subagent`, `migrate-to-skills`, `statusline`, `update-cursor-settings`, `update-cli-config`, `shell`, `sdk`, `automate`, `loop`, `review`, `review-bugbot`, `review-security`.

### 4. Hooks

- **block-rm.sh** (segurança): Nega `rm` recursivo em paths críticos (`/`, home e primeiro nível, `~`, `$HOME`) e qualquer remoção em `.git/`; pede **confirmação** (`ask`) para `rm` recursivo em outros paths
- **redact-prompt.sh** (segurança): Bloqueia envio de prompt se detectar padrões de secret (AWS, tokens, JWT, PEM); anon keys públicas do Supabase (`role: anon`) são permitidas
- **format-on-edit.sh** (qualidade): Roda `prettier --write` em arquivos `.ts`/`.tsx` editados pelo agente (mesmo formatador do `lint-staged`); silencioso quando o repo não tem prettier

Registrados em [`hooks.json`](hooks.json).

### 5. Examples (11 testes de comportamento)

| Arquivo | Rule testada | Foco |
|---------|--------------|------|
| `01-architecture.example.md` | architecture | Separação de camadas, DIP |
| `02-security-ts.example.md` | typescript-security | Validação de entrada, IDOR |
| `03-cognitive-complexity.example.md` | cognitive-complexity | Funções simples, guard clauses |
| `04-errors-and-logging.example.md` | errors-and-logging | DomainError, RFC 7807 |
| `05-tester.example.md` | tester | Cenários de teste, AAA |
| `06-gitflow.example.md` | gitflow | Conventional Commits |
| `07-go.example.md` | go + go-security | Error handling, queries parametrizadas |
| `08-java-spring.example.md` | java-spring + java-security | Controller magro, JPA, IDOR |
| `09-php.example.md` | php + laravel + php-security | Controller magro, FormRequest, Policy |
| `10-nestjs-patterns.example.md` | nestjs-patterns | Controller magro, DTO, service + Prisma |
| `11-remix-fsd.example.md` | remix-fsd | Rota magra, action/loader, FSD, Zod |

## Hierarquia de precedência

Fonte canônica: [rules/_shared/precedence.md](rules/_shared/precedence.md)

1. **`security/*`** da linguagem em contexto
2. **`architecture`** + **`cognitive-complexity`**
3. **`hypatia-ecosystem`** — somente repos Pantheon (picker manual)
4. **`nestjs-patterns`** / **`company-patterns`** / **`remix-fsd`** (conforme stack)
5. **Stack genérica** (`typescript-node`, `java-spring`, etc.)
6. **`errors-and-logging`**, **`naming-and-files`**, **`linguagem-pt-br`**
7. **`openapi-contracts`** quando houver API pública versionada
8. **Commands** `_shared/commit-message.md`
9. **Command do repo** sobre command global homônimo

Em conflito: alternativa **mais segura** e com **menos vazamento** de dados internos.

## Uso

### Portar para outro projeto

- Checklists por stack: **[PORTABILITY.md](PORTABILITY.md)**
- Templates `AGENTS.md`: **[templates/agents/](templates/agents/)**
- Script: `scripts/sync-cursor-config.sh` na raiz do repo fonte

### Por projeto (`.cursor/` na raiz do repo)

Configuração versionada com o código. Indicado quando a stack ou equipe é específica.

> Não use symlink `<repo>/.cursor/rules` → `~/.cursor/rules` — isso duplica as rules `alwaysApply` no contexto.

### Global (`~/.cursor`)

Para convenções pessoais ou **repo remoto** (time): **[GLOBAL-SETUP.md](GLOBAL-SETUP.md)** · onboarding: [../cursor-config/install.sh](../cursor-config/install.sh) · `hooks.global.json` versionado.

### Commands e skills

- Digite `/` no chat do Cursor para ver commands disponíveis.
- Mencione skills pelo nome (`babysit`, `split-to-prs`, `canvas`) para carregar instruções.

## Manutenção

1. Siga as restrições em [AGENTS.md](AGENTS.md)
2. Mantenha a hierarquia em [rules/_shared/precedence.md](rules/_shared/precedence.md)
3. Preserve os hooks em [hooks/](hooks/)
4. Ao alterar rules, atualize [examples/](examples/) correspondentes
5. Fonte canônica: `.cursor/` na raiz — **não** duplicar em `.cursor/.cursor/`
