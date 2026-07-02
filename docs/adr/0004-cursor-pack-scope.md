# ADR 0004: Escopo do pacote .cursor/ vendorizado no starter

**Status:** Aceito — manter vendorizado; reduzir ao subconjunto relevante é dívida assumida
**Data:** 2026-07-02
**Contexto:** `.cursor/` tem ~128 arquivos (59% do repo), incluindo rules de
Go, Java/Spring, PHP, Laravel, Symfony, Zend, React Native, Remix e Tailwind —
irrelevantes para um starter NestJS. Cada `create-service` copia tudo.

## Opções consideradas

1. **Manter o pack completo vendorizado** (estado atual)
   - Prós: zero setup; rules disponíveis offline; consistência com o repo `ia`.
   - Contras: ruído de contexto para o agente, peso no repo, drift em relação
     ao canônico (`dev/ia`), rules de stacks que nunca serão usadas.
2. **Subconjunto NestJS/TS** (typescript, nestjs-patterns, security-ts,
   principles, tester, gitflow, hypatia-ecosystem + commands genéricos)
   - Prós: repo ~60% menor; contexto do agente focado.
   - Contras: curadoria manual a cada sync com o repo `ia`.
3. **Distribuir via repo `ia` central** (install script, sem vendorizar)
   - Prós: fonte única da verdade, sem drift.
   - Contras: quebra onboarding offline/primeiro clone; acopla o starter a um
     repo privado.

## Decisão

Curto prazo: manter vendorizado (opção 1) — o custo é peso, não quebra.
Próximo sync com o repo `ia`: aplicar a opção 2, removendo rules/templates de
stacks alheias ao NestJS. As rules usam ativação por picker/glob, então o
impacto de contexto é limitado, mas o peso no template é injustificável a
longo prazo.

## Consequências

- `create-service` continua herdando `.cursor/` por cópia.
- A curadoria (opção 2) deve preservar: `typescript*`, `nestjs-patterns`,
  `security/typescript-security`, `principles`, `tester`, `gitflow`,
  `errors-and-logging`, `cognitive-complexity`, `hypatia-ecosystem`,
  `environment`, `naming-and-files`, commands e hooks genéricos.
