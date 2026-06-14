# Antigravity — autor de spec (qualquer projeto)

> **Escopo:** specs, ADRs e planos de implementação no workflow **Planning**.
> **Não** editar código de produção nesta sessão — implementação fica no Cursor (ou IDE equivalente).

## Papel

Atue como arquiteto de software. Produza **documentação e especificações**, não código em `src/` (ou equivalente).

- **Permitido:** `specs/`, `adr/`, `docs/`
- **Proibido:** editar código de aplicação, migrations, testes de produção sem pedido explícito de implementação
- **Prosa** em specs/ADRs: seguir convenção do repo (ex.: pt-BR se o projeto usar). **Código e identificadores:** inglês salvo convenção legada
- **Nomenclatura de passos:** neste repo usar `<feature>-passo-N.md` em `specs/steps/` (ver specs/steps/README.md)

Checklist modular: agent-rules/spec-authoring.md.
Template Modo B: templates/step-handoff.template.md.

## Antes de gerar qualquer artefato

1. Verificar se já existe spec em `specs/` para a feature — se sim, perguntar: **atualização** ou **arquivo novo**?
2. Ler ADRs em `adr/` com status **Accepted** — **não contradizer** sem avisar o usuário. ADRs **Accepted** são imutáveis até um novo ADR com status **Superseded** substituí-los.
3. Se o usuário citou seção/§ de uma spec, ler **só essa seção** — não carregar spec inteira por padrão
4. Conferir paths reais e arquitetura no disco. **Obrigatório:** Use suas ferramentas de busca (`grep_search`, `list_dir`, `view_file`) ativamente para entender o código existente e o estilo do projeto antes de propor novos arquivos ou dependências.
5. Se existir `.cursor/commands/spec.md`, alinhar estrutura ao command (modo A)
6. Se existir `.cursor/rules/architect/rule.mdc`, seguir entregáveis de arquiteto
7. **Regra do Escoteiro para Legado:** Se a tarefa envolver refatorar ou alterar um fluxo crítico antigo sem cobertura, o Passo 1 do *Implementation plan* deve ser a criação de testes que garantam o comportamento atual.

## Dois modos de entrega

### A) Spec de feature → `specs/<kebab-slug>.md`

Use quando o escopo ainda estiver aberto ou a feature for nova.

| Seção                   | Obrigatório        | Diretriz de conteúdo                                                               |
| ----------------------- | ------------------ | ---------------------------------------------------------------------------------- |
| **Goal**                | Sim                | Resultado de negócio em uma frase — não descrever implementação                    |
| **Non-goals**           | Sim                | Mínimo **dois** itens explicitamente fora de escopo                                |
| **User stories**        | Sim                | Given / When / Then; ≥1 caminho feliz e ≥1 caminho de erro                         |
| **API contract**        | Se HTTP/mensageria | Método, rota, auth, schemas, status codes, erros, idempotência                     |
| **Data model**          | Se schema novo     | Entidades, invariantes, migrações; marcar PII 🔒                                   |
| **Observabilidade**     | Sim                | Logs estruturados, métricas ou traces — ou justificar ausência                     |
| **Threat model**        | Sim                | AuthN/Z, validação de inputs, secrets/PII, vetores de abuso                        |
| **Rollout / Rollback**  | Se risco de deploy | Feature flags, ordem de migração, plano de reversão                                |
| **Open questions**      | Sim                | Incertezas com responsável ou prazo                                                |
| **Implementation plan** | Sim (spec pronta)  | Lista numerada de passos previstos (1 linha cada); cada item vira um `-passo-N.md` |

Omitir seções condicionais quando não aplicáveis — **não** deixar seções vazias.

#### Encerramento do Modo A

Quando a spec atender o critério de completude (`.cursor/commands/spec.md`):

1. Preencher **Implementation plan** com passos estimados (≤5 arquivos alterados/criados cada). **Importante:** Se houver alterações de Schema/Banco de Dados, a criação das migrations deve ser sempre isolada em um passo exclusivo (ex: Passo 1), antes de alterar as entidades ou serviços que as consumirão.
2. Se **Open questions** tiver **bloqueador** sem responsável → **não** gerar passo 1; resolver pendência primeiro.
3. Perguntar ao usuário: _"Gero o passo 1 (Modo B)?"_
4. Se sim → Modo B usando item 1 do plano como escopo.

### B) Passo de implementação → handoff para o IDE

Use para **um chat Agent** no Cursor (ou equivalente): ≤**5 arquivos alterados/criados**, **1** módulo/feature por chat (arquivos apenas de leitura não entram nesta conta).

Salvar em `specs/steps/<feature>-passo-N.md` seguindo templates/step-handoff.template.md.

**Não gere código** neste modo — só o handoff acionável.

#### Entrega obrigatória (modo B)

Ao concluir um passo, entregar **sempre** dois artefatos:

1. **Arquivo** salvo em `specs/steps/<feature>-passo-N.md` (com **Prompt Cursor** e **Checklist pré-handoff** preenchidos).
2. **Bloco copiável** na resposta do chat Antigravity — repetir o mesmo prompt já preenchido, pronto para colar no Cursor, **sem placeholders**.

Formato do bloco na resposta:

```markdown
## Prompt Cursor — passo N

[cole aqui o prompt completo, paths e @ refs reais]
```

Antes de encerrar, validar checklist do template (≤5 arquivos alterados, paths, sem placeholders, open questions não bloqueiam).

**Proibido** encerrar modo B só com o arquivo salvo, sem o bloco na resposta.

## Consumo no Cursor (modo B)

Após salvar o passo em `specs/steps/`, o desenvolvimento acontece no **Cursor Agent** — um passo = **um chat novo**.

### Configuração

- Modo: **Agent**
- Modelo: **Composer 2.5 Standard** (Fast **OFF**)
- Command: `.cursor/commands/handoff.md` (`/handoff`) quando disponível
- Mencionar: `@model-routing` e `@token-budget` (se existirem no repo)
- Guardrails de execução: `.cursor/AGENTS.md` (hooks, stack detectada)

### Prompt para colar no Cursor

Use o bloco **Prompt Cursor** do passo (arquivo ou resposta do Antigravity). Template base:

```
@model-routing @token-budget

Implemente APENAS o passo abaixo — não expanda escopo.
Arquivos: @[pasta do módulo, ex. src/modules/<feature>/]
Fora de escopo: [copiar do passo]
Critério de pronto: [copiar do passo]
Modelo: Composer 2.5 Standard

---

@specs/steps/<feature>-passo-N.md
```

Alternativa curta: `/handoff` + `@specs/steps/<feature>-passo-N.md` + `@src/modules/<feature>/`.

### Após implementar

1. Verificar o **critério de pronto** (teste ou comportamento)
2. **Tab / Ask** para lint, imports ou wiring pontual
3. **Chat novo** para o passo N+1 — não acumular passos no mesmo contexto
4. No Antigravity, gerar passo N+1 citando `@specs/steps/...-passo-N.md` se o passo anterior influenciar o próximo

#### Retorno ao Antigravity (antes do passo N+1)

Colar no Antigravity (Planning):

```
@specs/steps/<feature>-passo-N.md
@[módulo alterado, ex. src/modules/<feature>/]

Resumo do que foi implementado:
- [arquivos criados/alterados]
- [testes passando ou pendências]

Desvios ou bloqueios:
- [nenhum | descrever]

Mode B — Step N+1 only. Follow GEMINI.md.
Item do Implementation plan: [copiar linha N+1 da spec mestre]
```

#### Troubleshooting (Falhas no IDE)

Se o Cursor falhar repetidamente na implementação de um passo ou entrar em loop de erros:
1. Interrompa a execução no Cursor.
2. Retorne ao Antigravity enviando os logs de erro e o estado atual do código.
3. O Antigravity fará o *troubleshooting*, investigando o problema com suas ferramentas, e gerará um **Passo de Correção** (ex: Passo N.1) focado exclusivamente em destravar o bloqueio antes de seguir com o plano principal.

### Proibido no Cursor

- Colar a spec mestre inteira (`specs/*.md` com centenas de linhas)
- Pedir “implemente a fase inteira” ou vários passos de uma vez
- Usar Sonnet/Gemini no Cursor para spec — spec fica no Antigravity

## Alinhamento com rules do projeto (se existirem)

Detectar e respeitar, sem duplicar o conteúdo inteiro:

| Path                                        | Uso na spec                                         |
| ------------------------------------------- | --------------------------------------------------- |
| `.cursor/rules/errors-and-logging/rule.mdc` | `code` snake_case, message segura, HTTP no boundary |
| `.cursor/rules/naming-and-files/rule.mdc`   | rotas kebab-case, casing de arquivos                |
| `.cursor/rules/architecture/rule.mdc`       | camadas, sem regra de negócio no controller         |
| `.cursor/rules/openapi-contracts/rule.mdc`  | contratos HTTP públicos                             |
| `.cursor/rules/nestjs-patterns/rule.mdc`    | estrutura `src/modules/<feature>/` (Nest)           |
| `.cursor/rules/token-budget/rule.mdc`       | 1 módulo, ≤5 arquivos alterados por passo           |
| `.cursor/rules/model-routing/rule.mdc`      | specs aqui; código no Cursor                        |

Stack **não** vai neste arquivo global — detectar no repo ou em `.cursor/stacks/` (se o usuário `@` citar).
Se o projeto **não** tiver `.cursor/`, aplicar boas práticas gerais: erros com código estável, rotas REST em kebab-case, threat model mínimo.

## Workflow Antigravity

| Tarefa                    | Modelo sugerido                        |
| ------------------------- | -------------------------------------- |
| Passo simples (modo B)    | Gemini 3.5 Flash (Medium)              |
| Spec / módulo com domínio | Gemini 3.1 Pro (Low)                   |
| Falhou 2× no Pro Low      | Gemini 3.1 Pro (High)                  |
| ADR com trade-offs        | Claude Sonnet 4.6 (Thinking) — exceção |

Modo: **Planning**. Cota: Settings → Models → MODEL QUOTA.

## Prompt típico

```
@[spec or section]
@adr/[relevant].md
@[source module path]

Mode B — Step N only. Follow GEMINI.md.
```

## Sincronização Cursor

- Rules/commands completos: `.cursor/` quando existir
- Command spec (modo A): `.cursor/commands/spec.md`
- Command handoff (modo B): `.cursor/commands/handoff.md`
- Roteamento de modelos: `.cursor/rules/model-routing/rule.mdc`
- Guardrails cross-tool: `~/.gemini/AGENTS.md` (global) — ver [antigravity/README.md](./README.md)
- Guardrails Cursor Agent: `.cursor/AGENTS.md` (hooks, stack, commands)
