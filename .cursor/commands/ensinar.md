---
description: Ensina conceito ou código de forma didática (expositivo ou socrático); somente leitura, agnóstico de stack.
---

**Objetivo:** ensinar um conceito ou trecho de código com clareza didática e verificação de entendimento.

**Quando usar:** dúvida de aprendizado, estudo de padrão, "não entendi X", onboarding conceitual.

**Não usar quando:** auditoria técnica do código → [`explain`](./explain.md); bug → [`debug`](./debug.md); implementar ou refatorar → Agent / [`refactor`](./refactor.md).

**Done when:**

- **Expositivo:** 9 seções numeradas preenchidas + gabarito incluído no final com aviso "tente antes de ver o gabarito"; mini-check presente.
- **Socrático:** usuário respondeu e recebeu resumo final, OU foram realizadas 3 rodadas de perguntas sem resposta e um resumo parcial foi entregue automaticamente.
- Todas as incertezas relacionadas ao repositório listadas explicitamente.

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md)

**Proibido** modificar, criar ou deletar qualquer arquivo; rodar testes ou comandos destrutivos; propor refactors (apenas sugerir `/explain` na seção opcional ao final).

---

## Entrada obrigatória

No mesmo turno do `/ensinar`, o usuário deve informar (ou perguntar **uma vez** se faltar):

| Campo | Valores | Default |
|-------|---------|---------|
| **Alvo** | conceito livre (ex.: "idempotência", "DIP") **ou** `@arquivo` / path + símbolo opcional | — |
| **Nível** | `iniciante` \| `intermediário` \| `avançado` | `iniciante` |
| **Estilo** | `expositivo` \| `socrático` | `expositivo` |

**Ajustar vocabulário, profundidade e quantidade de jargão conforme o nível:**
- `iniciante`: conceitos básicos, pouco jargão, analogias simples.
- `intermediário`: detalhes de implementação, trade-offs comuns.
- `avançado`: casos de borda, métricas, referências para leitura adicional. Se o repositório não suportar análise avançada, use `/explain` para auditoria técnica detalhada.

### Exemplos de invocação

```
/ensinar "idempotência" nível=iniciante estilo=expositivo
/ensinar @src/infra/job/job-service.ts nível=intermediário estilo=socrático
/ensinar "Dependency Inversion Principle" nível=intermediário estilo=expositivo
```

---

## Passo 1 — Coleta de contexto (condicional)

**Se o alvo for código** (ex.: `@arquivo` ou path):

- Inspecionar `package.json`, arquivos de build/gestão (ex.: `go.mod`, `pyproject.toml`, `pom.xml`, `Cargo.toml`, `Makefile`), `README.md`, `docs/`, `adr/`, `CONTRIBUTING.md`.
- Analisar o módulo/pacote vizinho: chamadores (imports/usos), contratos (interfaces, tipos, schemas, rotas).

**Se o alvo for conceito puro** (ex.: "idempotência"):

- Limitar a `README.md`, `docs/`, `adr/`, `CONTRIBUTING.md`.
- Não varrer todos os arquivos de build por padrão.

Não ensinar código em isolamento quando o contexto de uso for mais revelador.

Marcar incertezas explicitamente: "não encontrei doc sobre X", "comportamento depende de configuração não visível".

---

## Passo 2 — Princípios pedagógicos

Aplicar na resposta (sem mencionar frameworks pedagógicos ao usuário):

| Princípio | Aplicação |
|-----------|-----------|
| Scaffolding | Do geral ao específico: ideia → analogia → detalhe → trade-offs |
| Curiosidade | Conectar ao "por quê" no sistema, não só à sintaxe |
| Productive struggle | Mini-check antes do gabarito (expositivo) ou perguntas antes da resposta (socrático) |
| Feedback guiado | Mini-check (expositivo) ou perguntas de verificação (socrático) |
| Público-alvo | Tom e profundidade conforme nível informado |
| Evidência | Afirmações sobre o repo com `path:linha` quando houver código |

**Tom:** português do Brasil, segunda pessoa ("você"), frases curtas, analogias concretas.

**Alvo grande demais:** se o tópico exigiria leitura/explicação extensa (ex.: arquitetura inteira do projeto), dividir a resposta em "Parte 1/N" e avisar no início qual será o foco desta parte (ex.: "Parte 1 — visão geral e principais componentes").

---

## Passo 3 — Estilo expositivo (estrutura obrigatória)

Produzir **sempre nesta ordem**:

1. **Ideia central** — 1–3 frases, sem jargão desnecessário.
2. **Pré-requisitos** — conceitos que o leitor deve já saber (lista curta).
3. **Analogia** — uma comparação do mundo real alinhada ao nível.
4. **Explicação em camadas** — o quê → como → quando usar / quando evitar.
5. **No seu projeto** — só se houver alvo de código ou doc no repo; citações `path:linha`. Omitir se o alvo for conceito puro sem evidência no repo.
6. **Erros comuns** — 2–4 armadilhas típicas relacionadas ao tópico.
7. **Mini-check** — 2–3 perguntas para o usuário tentar responder sozinho.

8. **Próximo passo** — um arquivo, doc ou símbolo sugerido para continuar o estudo neste repo. Se não houver conteúdo relevante no repo, sugerir tópico conceitual adjacente ou omitir a seção.

9. **Incertezas** — lista do que não foi confirmado no repositório.

### Gabarito — (tente antes de ver)

> **Aviso:** responda ao mini-check antes de consultar este gabarito.

**Gabarito (respostas modelo):**
[Colocar aqui as respostas modelo correspondentes ao mini-check]

---

**Se o usuário errar o mini-check:**
- Não apenas forneça a resposta correta. Explique **por que** a resposta esperada faz sentido.
- Use uma analogia alternativa curta.
- Aponte uma referência no repo (`path:linha`) se houver; caso contrário, indique material conceitual externo.

---

## Passo 4 — Estilo socrático (estrutura obrigatória)

**Rodada 1 — Ativação:** pergunta aberta sobre o que o usuário já sabe (ex.: "O que você já entende sobre X?").

**Rodada 2 — Decomposição:** pergunta que divide o tema em partes menores (ex.: "Quais peças do sistema você acha envolvidas em Y?").

**Rodada 3 — Evidência** (se houver código): pergunta que aponta para arquivo/doc (ex.: "O que este trecho em `src/path/file.ts:42` sugere sobre Z?"). Se não houver código, substituir por pergunta de aplicação: "Em que situação do dia a dia você usaria X?"

**Regra automática:** se o usuário não responder após 3 rodadas, oferecer um resumo parcial (até 8 linhas) e perguntar se quer o estilo `expositivo` para aprofundamento.

**Limite de interações:** máximo 3 rodadas; após isso, entregar resumo parcial automaticamente.

**Só após o usuário responder** ou pedir explicitamente "revela", "explica direto" ou equivalente:
- Resumo em **até 8 linhas**.
- Sugerir rodar `/ensinar` de novo com estilo `expositivo` se quiser profundidade.

---

## Passo 5 — Fronteira com `/explain`

| `/ensinar` | `/explain` |
|------------|------------|
| Construir entendimento (conceito ou código) | Descrever comportamento factual do código |
| Analogias, mini-check, nível do aluno | Seis seções técnicas (propósito, contratos, erros…) |
| Pode ser sem arquivo (conceito puro) | Exige alvo de código |

**Se quiser ir além** (opcional, uma linha ao final): para auditoria técnica detalhada do mesmo alvo de código, use [`/explain`](./explain.md) com path e símbolo.

---

## Limites

- Não propor refactors, otimizações nem melhorias de código.
- Não executar código nem testes.
- Não inventar comportamento ou convenção do projeto sem evidência em arquivo do repo.
- Se o escopo for ambíguo, ensinar o núcleo e indicar o que ficou de fora.
- **Exemplos de código hipotéticos** são permitidos para ilustrar conceitos quando o repositório não contém exemplos claros. Devem ser explicitamente marcados: `"Exemplo ilustrativo (não extraído do repo):"`.
