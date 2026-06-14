---
name: review-design-system
description: >-
  Audita design systems de UI — tokens, tipografia, hierarquia de seções,
  posicionamento de trust signals, contraste, animações de scroll e funis de
  landing page. Usar quando o usuário pedir revisão de design system, correção
  de layout de seção, melhoria de trust bars, auditoria de consistência visual
  ou mencionar design-system / hierarquia de UI / seções de conversão.
---

# Review Design System

Carregar quando o usuário executar `/review-design-system` ou pedir uma revisão de design system.

## Fluxo de trabalho

1. Inventariar tokens e componentes de seção (ler arquivos do repo).
2. Auditar hierarquia, funil de confiança, contraste, motion e redundâncias.
3. Entregar relatório usando o template do command global `review-design-system.md`.
4. Implementar mudanças **somente** se o usuário solicitar explicitamente.

## Funil de confiança (padrão)

| Etapa | Propósito | Exemplos |
|---|---|---|
| Ribbon pós-hero | Credibilidade rápida | rating, volume, credencial, idiomas |
| Mid-page | Diferenciação | por que nós, pilares com ícones |
| Pré-conversão | Reversão de risco | pagamento, cancelamento, tempo de resposta |

**Proibido** repetir a mesma afirmação em três formatos (bullet + card + bar).

## Padrões de seção

- **Valor + label** para escaneabilidade (ex.: `4.9★` / `no Google`).
- **Ribbon full-width** após o hero: fundo opaco, conteúdo em `container`, `border-t`.
- **4 pillar cards** com ícones; um CTA por bloco narrativo.
- Alternar `background` / `surface` entre seções principais.

## Regra de motion

Scroll: fade-in permitido. Navegação por âncora: a seção-alvo deve estar visível imediatamente — não deixar `opacity-0` durante smooth scroll para `#id` (usar evento customizado ou `navRevealed`).

## Detalhes adicionais

Ver [reference.md](reference.md) para checklists completos e anti-patterns.
