---
description: Audita e propõe melhorias de design system (tokens, hierarquia, trust signals, seções, a11y, animações). Use em landing pages, marketing sites e apps com UI.
---

**Objetivo:** relatório priorizado (crítico → sugestão → opcional) + plano de implementação; corrigir no código só se o usuário pedir.

**Quando usar:** revisar DS de uma app; seção "estranha"; antes de refactor visual; após redesign parcial; comparar tela com boas práticas.

**Não usar quando:** só copy/texto → editar i18n; auditoria OWASP → [`security-review`](./security-review.md); refactor de arquitetura backend sem UI.

**Restrições:** ler tokens e componentes reais do repo antes de sugerir; não inventar paleta; respeitar `prefers-reduced-motion`; mudanças mínimas salvo pedido explícito de redesign.

**Done when:** inventário do DS documentado; problemas com evidência (arquivo/trecho); recomendações acionáveis; redundâncias mapeadas; se implementar — lint/typecheck do escopo ok.

**Escopo (informar no chat se quiser limitar):** página inteira, rota, seção (`@components/...`) ou screenshot.

---

## Passo 1 — Inventário (read-only)

1. **Tokens:** `tailwind.config.*`, `globals.css` / `@theme`, CSS variables, temas claro/escuro.
2. **Tipografia:** famílias (display/body), escala h1–h6, tamanhos em componentes vs base.
3. **Componentes:** átomos (Button, Badge…), moléculas, templates de seção; convenções de nome e pasta.
4. **Padrões de layout:** `container`, padding de seção (`py-*`), alternância de fundo (`background` / `surface` / `card`).
5. **Navegação:** header sticky, âncoras `#id`, `scroll-mt-*`, scroll programático.
6. **Motion:** Framer/CSS — o conteúdo começa invisível (`opacity: 0`) antes do `inView`?

Registrar em tabela mental: token → uso real → desvio.

---

## Passo 2 — Auditoria por dimensão

### Hierarquia e densidade
- Hero vs corpo: contraste tipográfico suficiente?
- Blocos com mesma hierarquia visual competindo (card + card + barra iguais)?
- Máximo **4–6** pontos por lista "why choose"; valor **destaque + rótulo** onde couber.

### Confiança (trust) e funil
- **Acima da dobra:** 3–4 sinais rápidos (nota, volume, credencial, idioma).
- **Meio da página:** diferenciais (por que nós).
- **Perto do CTA/contato:** pagamento, cancelamento, SLA — **não repetir** no meio.
- Mapear repetições (mesma mensagem em 2+ seções) → consolidar.

### Layout de faixas
| Padrão | Uso |
|---|---|
| **Ribbon full-width** | Trust strip logo após hero; fundo opaco; conteúdo no `container` |
| **Card no container** | Destaques isolados; cuidado com overlap em foto escura |
| **Glass / blur** | Só se contraste AA garantido; preferir opaco em hero escuro |

### Legibilidade e contraste
- Texto secundário não pode ser o único peso após hero display.
- Semi-transparente sobre imagem escura → falha previsível; usar `bg-card` sólido.
- WCAG AA em texto e ícones interativos.

### Alinhamento e navegação
- Colunas iguais: `flex-1` + `divide-x` ou grid com padding simétrico; desktop `justify-start` para alinhar ícones.
- `scroll-mt-*` em todo `section[id]` usado no menu.
- Animação: scroll = fade-in; clique em âncora = **revelar destino sem esperar inView** (evitar "vácuo" bege).

### Conteúdo
- Benefício para o usuário, não feature brochure.
- Tom consistente (B2C viagem vs B2B evento no mesmo bloco = alerta).

Classificar achados:
- 🔴 **Crítico** — legibilidade, contraste, conteúdo invisível, redundância que confunde
- 🟡 **Sugestão** — hierarquia, ritmo, posição no funil
- 🟢 **Opcional** — polish visual, microcopy

---

## Passo 3 — Relatório (formato obrigatório)

```markdown
# Revisão de design system — [projeto / escopo]

## Resumo executivo
[2–4 frases: estado geral + maior risco]

## Inventário resumido
| Área | Onde está | Observação |
|---|---|---|

## Achados
### 🔴 Críticos
- [problema] — evidência: `caminho` — recomendação

### 🟡 Sugestões
...

### 🟢 Opcionais
...

## Redundâncias no funil
| Mensagem | Onde aparece | Manter em |
|---|---|---|

## Plano recomendado (ordem)
1. ...
2. ...

## Se implementar agora
- Arquivos prováveis: ...
- Fora de escopo: ...
```

Em **Ask mode**: só relatório. Em **Agent mode**: perguntar se deve aplicar o plano.

---

## Passo 4 — Implementação (somente se pedido)

Ordem sugerida:
1. Tokens / contraste (sem redesign total).
2. Remover redundâncias de copy e seções.
3. Unificar padrão de faixa (ribbon vs card).
4. Ajustar `AnimatedSection` ou equivalente (nav reveal + scroll).
5. `scroll-mt-*` e padding entre hero e faixas.
6. Extrair molécula compartilhada (`TrustSignalItem`, etc.) se houver duplicação.

Validar: lint, `tsc`, preview visual nas larguras sm / lg.

---

## Referências

- **Rule do projeto** (carregada automaticamente em TSX): [design-system/rule.mdc](../rules/design-system/rule.mdc)
- **Skill completa** (checklists + anti-patterns): `@review-design-system` → `~/.cursor/skills/review-design-system/reference.md`
