---
description: Revisa padrões company-patterns em módulo TS; pode corrigir. Prefira command do repo se existir.
---

**Objetivo:** relatório Conforme/Avisos/Violações + correções opcionais.

**Quando usar:** antes do merge em módulo backend.

**Não usar quando:** auditoria OWASP → [`security-review`](./security-review.md).

**Done when:** lint/test/build ok no escopo; resumo Passo 4 gerado.

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md)

**Alvo:** arquivos ou módulo a validar — informar no chat (ex.: `src/modules/<nome>/`).

Ativar no picker: [typescript-node](../rules/typescript-node/rule.mdc), [company-patterns](../rules/company-patterns/rule.mdc), [architecture](../rules/architecture/rule.mdc).

Se o repositório tiver `.cursor/commands/review-company-patterns.md`, preferir esse command (específico do repo).

---

## Passo 1 — Análise

1. **Perfil do módulo** — com persistência (`repositories/`) ou só HTTP/integração?
2. **Estrutura de pastas** — alinha ao perfil A ou B da rule `company-patterns`?
3. **Nomenclatura** — kebab-case em arquivos; `I*` em interfaces de serviço quando for padrão do repo.
4. **Camadas** — regras de negócio sem acoplamento indevido a framework/ORM na borda interior.
5. **Factories** — dependências via `make*` (ou padrão do projeto), não `new` de infra solto.
6. **Logging e erros** — `traceId` quando o fluxo for rastreável; sem vazamento de segredo; código de erro estável na borda.
7. **Validação** — Yup (ou contrato do projeto) na borda HTTP.

Relatório:

- **Conforme**
- **Avisos** (desvio leve)
- **Violações** (corrigir antes do merge)

---

## Passo 2 — Correções (quando aplicável)

Aplicar em lotes pequenos; após cada lote rodar lint e testes do escopo.

- Ajustar nomes de arquivos/pastas para kebab-case.
- Tipos no arquivo raiz do módulo quando estiverem espalhados sem necessidade.
- Porta (`ports/`) + provider em `providers/<nome>/` para integração HTTP externa.
- `traceId` nos params do caso de uso quando o fluxo for end-to-end.
- Transações só em módulos com persistência, seguindo `BaseRepository` ou padrão do repo.
- **Não** adicionar repositório em módulo que não persiste dados neste serviço.

Namespace dedicado é **opcional** — preferir `export type` / `export interface` no arquivo raiz quando o repo já assim o faz.

---

## Passo 3 — Validação automática

Inspecionar `package.json` (ou `Makefile`) e usar **apenas scripts que existem**. Ordem de detecção do gerenciador Node:

1. `bun.lock` → `bun install`, `bun run lint`, `bun test`
2. `pnpm-lock.yaml` → `pnpm install --frozen-lockfile`
3. `yarn.lock` → `yarn install --frozen-lockfile`
4. `package-lock.json` → `npm ci`

Exemplos (substituir pelo script real):

```bash
bun run lint
bun test
bun run build
# ou: npm run lint && npm test
```

**Proibido** inventar scripts como `validate:patterns` se não estiverem no `package.json`.

### Checklist manual (opcional)

**Módulo com persistência:**

- [ ] Repositório estende base do projeto; transações conforme padrão existente.
- [ ] Entrada HTTP validada na borda (`validateRequest` ou equivalente).
- [ ] `traceId` nos fluxos que orquestram I/O crítico.

**Módulo só HTTP / integração:**

- [ ] `ports/` + `providers/<nome>/` para sistemas externos.
- [ ] Sem `repositories/` “por costume”.
- [ ] Yup só no que o cliente envia.

---

## Passo 4 — Resumo

```markdown
## Revisão de padrões

**Módulo:** …
**Data:** …
**Status:** Conforme / Avisos / Violações

### Ajustes feitos
- …

### Avisos restantes
- …

### Próximos passos
- …
```

---

## Proibições

- Não desligar regra de lint só para “passar”.
- Não impor padrão com repositório em fluxo só proxy HTTP.
- Não commitar com violações classificadas como erro sem justificativa em PR.
- Não pular transação em operações de escrita coordenadas quando o repo exige.

## Critério de conclusão

- [ ] Violações frente às rules do repo resolvidas ou justificadas.
- [ ] Lint ok no escopo alterado (comando real do projeto).
- [ ] Testes relacionados ok.
- [ ] Build/typecheck ok.
