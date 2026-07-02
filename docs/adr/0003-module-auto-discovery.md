# ADR 0003: Auto-discovery de feature modules vs import explícito

**Status:** Aceito — manter auto-discovery, com limites documentados
**Data:** 2026-07-02
**Contexto:** auditoria técnica questionou o glob em runtime de `src/modules/*/*.module.ts`.

## Contexto

`discoverFeatureModules()` (src/common/module-discovery/module-discovery.ts) varre
`modules/*/*.module.ts` com glob e registra os módulos via `createRequire`, sem
import manual no `AppModule`. A alternativa idiomática NestJS é uma linha de
import explícito por módulo.

Custos conhecidos do auto-discovery:

- Erro de export vira falha de **boot**, não de compilação (mitigado: a
  validação em `resolveModuleExport` falha rápido com mensagem clara).
- "Find usages" do IDE não enxerga o registro.
- Ordem de carga é alfabética e implícita.
- `dist/` obsoleto pode registrar módulo já deletado (mitigado:
  `deleteOutDir: true` no nest-cli).
- Dependência `glob` em produção.

## Decisão

Manter o auto-discovery. Racional: no ecossistema Pantheon os serviços são
pequenos (1–4 módulos de domínio) e o starter é usado por devs em onboarding —
eliminar o passo "editar AppModule" reduz erro de scaffolding e o custo dos
trade-offs acima é baixo nessa escala. A convenção
`src/modules/<feature>/<feature>.module.ts` é verificada por teste
(`module-discovery.spec.ts`).

## Consequências

- Módulos de domínio **somente** em `src/modules/` — infra continua explícita
  no `AppModule.register()`.
- Se um serviço crescer além de ~10 módulos ou precisar de ordem de carga
  determinística entre features, migre para imports explícitos (mudança
  local: substituir `...featureModules` pela lista de módulos).
- Nunca colocar código não-módulo casando com `*.module.ts` em `src/modules/`.
