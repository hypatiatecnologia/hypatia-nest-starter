---
description: Audita consistência de design no código (tokens, valores arbitrários, proporções de componentes, estados interativos). Use ao revisar PR com mudanças visuais ou após implementação de nova tela.
---

**Objetivo:** relatório de inconsistências de design no código (🔴 crítico → 🟡 sugestão → 🟢 opcional) com solução Tailwind/CSS pronta; corrigir só se pedido.

**Quando usar:** PR com mudanças visuais; nova tela implementada; suspeita de classes arbitrárias ou tokens fora do sistema; revisão de componente antes de promover para shared.

**Não usar quando:** análise visual por screenshot → [`review-mobile-ui`](./review-mobile-ui.md); auditoria de tokens/hierarquia/funil → [`review-design-system`](./review-design-system.md); bug de comportamento → [`debug`](./debug.md).

**Restrições:** analisar o código real do repo; não sugerir tokens que não existam no `tailwind.config`; preservar intenções de design explícitas do autor; mudanças mínimas salvo pedido de refactor.

**Done when:** todas as inconsistências documentadas com elemento + arquivo + solução; se implementar — lint/tsc ok.

---

## Critérios de auditoria

### Tokens e variáveis
- **Proibido** valores arbitrários de cor em componentes: `text-[#ff3344]`, `bg-[#1a1a2e]` → usar token semântico do projeto.
- **Proibido** tamanhos arbitrários sem justificativa: `w-[321px]`, `mt-[13px]` → alinhar à escala do projeto (múltiplos de 4px/8px).
- Espaçamentos, tamanhos de fonte e border-radius devem seguir a escala configurada no `tailwind.config`; desvios são inconsistências.

### Uniformidade de componentes
- Botões do mesmo nível devem ter altura, `rounded-*`, `shadow-*` e `font-*` idênticos em toda a tela.
- Inputs e selects: mesma altura base (`h-10` ou equivalente do projeto), `border`, `ring` e `placeholder` uniformes.
- Cards: mesma combinação de `rounded-*`, `shadow-*` e `p-*` dentro do mesmo contexto; variar só via variante documentada (CVA).

### Estados interativos
- `hover:`, `focus-visible:`, `disabled:` aplicados de forma consistente em todos os elementos clicáveis.
- Focus ring usa token `ring` da marca — `focus-visible:ring-2 focus-visible:ring-ring` — nunca `outline-none` sem substituto.
- `disabled:opacity-50 disabled:cursor-not-allowed` como padrão mínimo em qualquer controle.

### Hierarquia e layout
- Alinhamento vertical/horizontal coerente: colunas do mesmo grid com padding simétrico.
- Hierarquia visual guia o olhar: h1 > h2 > corpo — sem "empate" entre dois elementos de peso similar competindo pela atenção.
- Alternância de `bg-background` / `bg-muted` / `bg-card` consistente entre seções da mesma página.

---

## Formato do relatório (obrigatório)

```markdown
### 🔍 Relatório de Consistência de Design — [componente / arquivo / PR]

**Status geral:** Aprovado | Requer ajustes | Inconsistente

---

#### 🔴 [Elemento — arquivo: `caminho/componente.tsx`]
- **Problema:** [o que quebra a consistência]
- **Impacto:** [por que prejudica a harmonia visual ou aumenta carga cognitiva]
- **Solução:** `w-[321px]` → `w-80`; `text-[#333]` → `text-foreground`

#### 🟡 [Elemento — arquivo: `...`]
...

#### 🟢 [Elemento — arquivo: `...`]
...

---

**Se aprovado:** listar as boas práticas corretamente aplicadas (tokens semânticos usados, estados interativos consistentes, escala seguida).
```

Em **Ask mode**: só relatório. Em **Agent mode**: perguntar se deve aplicar o plano.

---

## Referências

- **Rule do projeto** (carregada automaticamente em TSX): [design-system/rule.mdc](../rules/design-system/rule.mdc)
- **Auditoria de DS (tokens, funil, hierarquia):** [`review-design-system`](./review-design-system.md)
- **Diagnóstico mobile (screenshots):** [`review-mobile-ui`](./review-mobile-ui.md)
