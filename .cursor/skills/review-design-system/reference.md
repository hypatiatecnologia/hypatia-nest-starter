# Design system review — referência

## Anti-patterns (sinalizar imediatamente)

| Anti-pattern | Impacto | Correção |
|---|---|---|
| `opacity-0` até inView + anchor nav | Seção vazia ao navegar via âncora | Revelar target no evento de nav; ou não esconder com opacity |
| Card glass sobre hero escuro | Texto ilegível por contraste insuficiente | Card opaco ou sem sobreposição no hero |
| Mesma mensagem de confiança em 3 formatos | Ruído cognitivo, CRO enfraquecido | Uma mensagem por etapa do funil (ribbon → mid → pre-CTA) |
| 5 bullets + 4 cards + 3 garantias na mesma seção | Fadiga de leitura, hierarquia achatada | Máx. 2 camadas; mesclar ou realocar itens |
| `text-xs text-secondary` logo após hero display | Parece rodapé em vez de transição | Valor com `text-primary`; label legível no mínimo `text-primary/80` |
| `section[id]` sem `scroll-mt` | Título oculto sob header fixo | `scroll-mt-20` em toda `section` com `id` |
| Copy genérico "Por que nós?" | Não converte | Afirmações específicas, locais e verificáveis |

## Checklist — Tipografia

- [ ] Display font somente em h1–h3 (ou momentos de marca)
- [ ] Parágrafos: 16px+ em mobile
- [ ] Um degrau visual claro entre título do hero e títulos de seção
- [ ] `leading-relaxed` (≥ 1.5) em blocos de texto longo

## Checklist — Tokens

- [ ] Nomes semânticos: `text-primary`, `bg-surface`, `border` — sem hex cru em componentes
- [ ] Todo par surface/text tem equivalente dark mode
- [ ] Papéis documentados: primary (CTA) · secondary (link) · accent (sucesso/alerta)
- [ ] Focus ring via token `ring` da marca

## Checklist — Responsividade

- [ ] Trust strip: grid 2×2 mobile → 4 colunas desktop com dividers
- [ ] Touch targets ≥ 44px em controles de carrossel e nav
- [ ] `<Image>` com prop `sizes` definida (Next) ou equivalente

## Molécula reutilizável: trust signal

```tsx
// TrustSignalItem: ícone em círculo muted, valor em font-display font-bold,
// label com text-primary/80 mínimo em fundos claros.
// Usar no ribbon pós-hero E no bar pré-CTA — nunca duplicar o mesmo texto nos dois.
<TrustSignalItem icon={StarIcon} value="4.9★" label="no Google" />
```

Slots canônicos no funil:

| Slot | Posição | Propósito |
|---|---|---|
| Ribbon | Logo após o hero | Credibilidade rápida (rating, volume, credencial) |
| Mid-page | Seção "por que nós" | Diferenciação (pilares com ícones, 4–6 itens) |
| Pre-CTA | Antes do formulário/botão principal | Reversão de risco (pagamento, cancelamento, tempo de resposta) |
