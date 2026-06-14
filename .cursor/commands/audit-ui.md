---
description: Auditoria rigorosa de interface, usabilidade e acessibilidade no código (WCAG, Nielsen/Norman, estados, responsividade). Toda crítica vem com refatoração de código pronta.
---

**Objetivo:** relatório priorizado (🔴 crítico → 🟡 sugestão → 🟢 opcional) de falhas de UI, a11y e UX com **solução em código obrigatória para cada item**; não entregar críticas sem implementação correspondente.

**Quando usar:** revisão completa de tela ou componente pós-implementação; PR com mudanças significativas de UI; preparação para acessibilidade ou auditoria de produto.

**Não usar quando:** mapeamento pré-desenvolvimento → [`ux-flow`](./ux-flow.md); só tokens/consistência visual → [`review-design-consistency`](./review-design-consistency.md); análise por screenshot → [`review-mobile-ui`](./review-mobile-ui.md).

**Restrições:** usar a stack real do projeto (React + Tailwind); não sugerir bibliotecas fora do `package.json`; código proposto deve passar em lint/tsc; refatorações mínimas salvo pedido explícito de redesign.

**Done when:** 6 pilares auditados; cada problema com código de solução; se implementar — lint/tsc ok.

---

## Pilares de auditoria

### 1. Hierarquia visual e apelo
- Harmonia de cores, tipografia e espaçamento seguem a escala do projeto (múltiplos de 4/8px).
- Ruído visual eliminado: elementos sem hierarquia clara ou que competem entre si são alerta.
- Peso tipográfico e tamanho usados intencionalmente — sem dois elementos de destaque idêntico na mesma área.

### 2. Acessibilidade (a11y — WCAG AA mínimo)
- HTML semântico: `<button>` para ações, `<a>` para navegação, headings em ordem lógica (`h1` → `h2` → `h3`).
- Atributos `aria-*`: `aria-label` em ícones sem texto, `aria-describedby` em campos com mensagem de erro, `role` apenas quando semântico nativo não resolve.
- Foco de teclado visível em todos os elementos interativos: `focus-visible:ring-2 focus-visible:ring-ring`; nunca `outline-none` sem substituto.
- Contraste WCAG AA: 4.5:1 em texto, 3:1 em ícones interativos e bordas de input.

### 3. Estados e feedbacks
- Todos os elementos clicáveis têm `hover:`, `focus-visible:` e `active:` — ausência é alerta.
- Elementos desabilitados: `disabled:opacity-50 disabled:cursor-not-allowed` como mínimo; não bloquear foco para leitores de tela.
- Estados assíncronos cobertos: loading (skeleton ou spinner), error (mensagem + ação de recuperação), success (feedback + próximo passo).
- Transições de estado: `transition-colors duration-150` em interações; sem salto abrupto de layout.

### 4. Responsividade (mobile-first)
- Classes base definem mobile; `md:` e `lg:` sobrescrevem para telas maiores.
- Texto não ultrapassa o container em qualquer breakpoint (`break-words` ou `truncate` onde couber).
- Touch targets ≥ 44px em mobile (`min-h-[44px]`); espaçamento entre elementos clicáveis ≥ `gap-2`.

### 5. Carga cognitiva
- Labels descritivos e diretos: `placeholder` não substitui `<label>`; todo input tem label visível ou `aria-label`.
- Prevenção de erros: validação inline com mensagem contextual antes do submit sempre que possível.
- Fluxo de cliques mínimo para a ação principal — cada passo extra sem justificativa é alerta.
- Tooltips e textos auxiliares: presentes onde a ação não é óbvia; ausentes onde o contexto já explica.

### 6. Consistência e reuso
- Componentes equivalentes com mesma altura base, `rounded-*`, `shadow-*` e `font-*`.
- Tokens semânticos do projeto usados em vez de valores arbitrários.
- Padrão de composição respeitado: variantes via CVA, não via props booleanas acumuladas.

---

## Formato do relatório (obrigatório)

```markdown
### 📊 Resumo executivo — [componente / rota]

**Status:** Aprovado | Requer ajustes | Crítico

Principais problemas (máx. 5, por impacto decrescente):
1. ...

---

### 🛠️ Plano de ação

#### 🔴 [Problema — pilar: Acessibilidade]
- **Violação:** [heurística ou diretriz WCAG infringida]
- **Impacto:** [consequência para o usuário]
- **Solução:**

\`\`\`tsx
// antes
<div onClick={handleClick}>Confirmar</div>

// depois
<button type="button" onClick={handleClick}>Confirmar</button>
\`\`\`

#### 🟡 [Problema — pilar: Estados]
...

#### 🟢 [Problema — pilar: Carga cognitiva]
...
```

Em **Ask mode**: relatório sem implementar. Em **Agent mode**: perguntar se deve aplicar após entregar o relatório.

---

## Referências

- **Rule do projeto** (carregada automaticamente em TSX): [design-system/rule.mdc](../rules/design-system/rule.mdc)
- **Mapeamento pré-desenvolvimento:** [`ux-flow`](./ux-flow.md)
- **Só consistência de tokens/props:** [`review-design-consistency`](./review-design-consistency.md)
- **Análise por screenshot mobile:** [`review-mobile-ui`](./review-mobile-ui.md)
