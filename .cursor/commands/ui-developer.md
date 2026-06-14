---
description: Auditoria holística de UI/UX baseada em heurísticas (Nielsen, Norman, Laws of UX, WCAG) — funciona com código ou screenshots. Avalia impressão visual, navegação, acessibilidade, estados, consistência, usabilidade e responsividade.
---

**Objetivo:** relatório priorizado (🔴 crítico → 🟡 sugestão → 🟢 opcional) com diagnóstico por pilar + sugestões práticas com referências; implementar código só se pedido.

**Quando usar:** design review completo de tela ou fluxo; validação visual antes de entrega; auditoria orientada a heurísticas; comparar interface com padrões de mercado (Material, HIG, Ant Design).

**Não usar quando:** só refatoração de código Tailwind/React → [`audit-ui`](./audit-ui.md); mapeamento pré-desenvolvimento → [`ux-flow`](./ux-flow.md); só tokens e consistência visual → [`review-design-consistency`](./review-design-consistency.md); só análise de screenshot mobile → [`review-mobile-ui`](./review-mobile-ui.md).

**Restrições:** basear achados em evidências visíveis (código ou print); referenciar a heurística ou diretriz violada em cada problema; não inventar problemas sem evidência; sugestões práticas devem ser implementáveis com a stack atual.

**Done when:** 8 pilares avaliados; cada problema com heurística violada + sugestão prática; resumo executivo com priorização clara.

---

## Pilares de auditoria

### 1. Primeira impressão e apelo visual
- O design transmite profissionalismo e confiança no primeiro contato?
- Harmonia de cores, tipografia, proporções, espaçamento (múltiplos de 4/8px) e hierarquia visual consistentes.
- Identificar ruído visual: elementos que competem pela atenção sem hierarquia clara.

### 2. Navegação e fluxo de usuário
- O fluxo é intuitivo: o usuário encontra o que procura sem esforço (Lei de Hick, Princípio de Menor Esforço)?
- Menus, caminhos e interações seguem lógica consistente; pontos de fricção ou excesso de etapas são alertas.
- Breadcrumbs, estados de página ativa e indicadores de progresso presentes onde esperados.

### 3. Acessibilidade (WCAG AA mínimo)
- Contraste 4.5:1 em texto, 3:1 em ícones interativos.
- HTML semântico, `aria-*` corretos, navegação por teclado completa, foco visível.
- Fontes ≥ 16px em parágrafos; `alt` descritivo em imagens informativas.

### 4. Feedbacks, estados e microinterações
- Cada ação do usuário tem feedback claro: `hover`, `focus`, `active`, `disabled`, loading, erro, sucesso.
- Ausência de estado interativo em elemento clicável é **crítico**.
- Transições (`transition-colors duration-150`) fluidas e que reforçam a interação — sem saltos abruptos de layout.

### 5. Consistência e componentização
- Botões, cards e formulários com proporções, bordas e sombras idênticas no mesmo contexto.
- Variações desnecessárias de um mesmo elemento são alertas de componentização ausente.
- Referência de padrão: Atomic Design para estrutura; CVA para variantes de componentes existentes.

### 6. Usabilidade e carga cognitiva
- Tarefas principais realizáveis em ≤ 3 cliques a partir do ponto de entrada.
- Labels, ícones e tooltips claros e autoexplicativos; `placeholder` não substitui `<label>`.
- Prevenção de erros antes do submit; mensagens de erro contextuais e recuperáveis.

### 7. Responsividade e adaptabilidade
- Layout funciona em mobile (≥ 320px), tablet e desktop sem quebra ou overflow horizontal.
- Texto não ultrapassa container; touch targets ≥ 44px em mobile.
- Abordagem mobile-first verificada nas classes Tailwind ou CSS.

### 8. Sugestões práticas e referências
Para cada problema identificado, indicar:
- **Referência de mercado** (se aplicável): Material Design, Apple HIG, Ant Design, Radix Themes — não para copiar, mas para mostrar o padrão esperado.
- **Biblioteca ou utilitário** disponível na stack atual que resolve o problema.
- **Estimativa de esforço**: rápido (< 1h) · médio (1–4h) · alto (> 4h).

---

## Formato do relatório (obrigatório)

```markdown
### 🔍 Auditoria UI/UX — [tela / fluxo / componente]

**Status:** Aprovado | Requer ajustes | Crítico

---

#### 🔴 [Problema — pilar: Acessibilidade]
- **Heurística violada:** WCAG 1.4.3 (contraste mínimo)
- **Evidência:** `components/Card.tsx` linha 12 — `text-gray-400` sobre `bg-gray-100`
- **Impacto:** usuários com baixa visão não conseguem ler o conteúdo
- **Sugestão:** `text-muted-foreground` → verificar contraste com `bg-card`
- **Esforço:** rápido

#### 🟡 [Problema — pilar: Navegação]
...

#### 🟢 [Problema — pilar: Consistência]
...

---

### 📊 Resumo executivo

| Prioridade | Problema | Pilar | Esforço |
|---|---|---|---|
| 🔴 | ... | ... | rápido |
| 🟡 | ... | ... | médio |

**Ação imediata recomendada:** [o item de maior impacto com menor esforço]
```

Em **Ask mode**: só relatório. Em **Agent mode**: perguntar se deve aplicar após entregar o relatório.

---

## Referências

- **Auditoria de código com refatoração Tailwind:** [`audit-ui`](./audit-ui.md)
- **Mapeamento pré-desenvolvimento:** [`ux-flow`](./ux-flow.md)
- **Só tokens e consistência:** [`review-design-consistency`](./review-design-consistency.md)
- **Rule do projeto** (carregada automaticamente em TSX): [design-system/rule.mdc](../rules/design-system/rule.mdc)
