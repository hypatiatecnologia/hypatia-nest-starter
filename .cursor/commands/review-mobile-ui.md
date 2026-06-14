---
description: Analisa screenshots de UI mobile e entrega diagnóstico priorizado com refatorações Tailwind/React prontas. Use quando o usuário anexar prints de tela ou pedir revisão visual mobile.
---

**Objetivo:** diagnóstico priorizado (🔴 crítico → 🟡 sugestão → 🟢 opcional) baseado nos screenshots; entregar classes Tailwind/React aplicáveis; implementar só se pedido.

**Quando usar:** prints de tela mobile anexados; componente/seção "estranha no celular"; antes de publicar feature mobile; comparar layout com heurísticas de usabilidade.

**Não usar quando:** sem screenshot → [`review-design-system`](./review-design-system.md) para auditoria de tokens/hierarquia; bug de lógica → [`debug`](./debug.md); auditoria OWASP → [`security-review`](./security-review.md).

**Restrições:** basear diagnóstico apenas no que é visível no print; não inventar problemas sem evidência; sugerir classes Tailwind reais do projeto (não hex arbitrário); respeitar `prefers-reduced-motion`.

**Done when:** cada problema com elemento + impacto + refatoração Tailwind documentados; todos os críticos cobertos; se implementar — lint/tsc ok.

---

## Critérios de avaliação

### Tipografia e legibilidade
- Texto base ≥ 16px em parágrafos: `text-sm` ou menor em corpo de texto é **crítico** em mobile.
- Hierarquia clara entre título e corpo: diferença de ao menos 1 step de tamanho.
- `leading-relaxed` (≥ 1.5) em blocos de leitura; `leading-snug` aceitável só em títulos curtos.

### Áreas de toque
- Botões, ícones e links: `min-h-[44px] min-w-[44px]` mínimo.
- Espaçamento entre targets adjacentes: `gap-2` mínimo para evitar clique acidental.
- Ícones sem label: `aria-label` obrigatório + área de toque expandida (`p-2` ao redor).

### Espaçamento e respiro
- Padding horizontal do container principal: `px-4` (16px) mínimo em mobile.
- Espaçamento entre seções: `py-8` ou `space-y-6` — layout "espremido" nas bordas é alerta.
- Evitar margens negativas em mobile que causem overflow horizontal.

### Contraste e hierarquia
- Texto sobre imagem/fundo escuro: overlay obrigatório (`bg-gradient-to-t from-black/60`) ou card opaco.
- Textos `text-muted-foreground` sobre foto escura: **crítico** — usar fundo sólido (`bg-card`) ou texto claro.
- WCAG AA: contraste mínimo 4.5:1 em texto, 3:1 em ícones interativos.

---

## Formato do diagnóstico (obrigatório)

```markdown
### 📱 Diagnóstico Mobile — [componente / rota / screenshot]

#### 🔴 [Nome do elemento]
- **Problema:** [o que está visualmente incorreto no print]
- **Impacto na UX:** [efeito concreto no usuário]
- **Refatoração:** alterar `text-sm` → `text-base`; adicionar `px-4` ao container

#### 🟡 [Nome do elemento]
- **Problema:** ...
- **Impacto na UX:** ...
- **Refatoração:** ...

#### 🟢 [Nome do elemento]
...
```

Em **Ask mode**: só relatório. Em **Agent mode**: perguntar se deve aplicar o plano.

---

## Referências

- **Rule do projeto** (carregada automaticamente em TSX): [design-system/rule.mdc](../rules/design-system/rule.mdc)
- **Auditoria de design system completa:** [`review-design-system`](./review-design-system.md)
