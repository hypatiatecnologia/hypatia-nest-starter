# ADR 0005: Estratégia de atualização de serviços derivados do starter

**Status:** Aceito — CHANGELOG + merge dirigido via remote `starter`; extração de pacote npm adiada
**Data:** 2026-07-02
**Contexto:** `create-service` copia um snapshot e roda `git init`. Serviços
derivados nunca recebem correções do starter — vulnerabilidades corrigidas
aqui (ex.: multer DoS, ordem dos guards) permanecem nos derivados.

## Opções consideradas

1. **Snapshot puro** (estado anterior): sem caminho de atualização. Inaceitável
   para correções de segurança.
2. **Remote `starter` + merge dirigido**: cada derivado adiciona
   `git remote add starter <url>` e faz cherry-pick/merge das mudanças marcadas
   no CHANGELOG.
   - Prós: sem infra nova; histórico preservado; o dev escolhe o que aplicar.
   - Contras: merge manual; conflitos em arquivos muito customizados.
3. **Pacote npm `@hypatia/nest-core`**: extrair `common/`, `rabbitmq/`,
   `redis/`, `http/`, auth e config para uma lib versionada.
   - Prós: update = bump de versão; sem conflito de merge.
   - Contras: exige registry privado, pipeline de release e versionamento
     disciplinado; abstrai código que hoje serve de material de onboarding
     (o time aprende lendo o starter).

## Decisão

Adotar a opção 2 agora:

- `CHANGELOG.md` na raiz marca mudanças com **[aplicar em derivados]**.
- `SECURITY.md` documenta que derivados são snapshots.
- Fluxo no derivado:
  `git remote add starter git@github.com:<org>/hypatia-nest-starter.git &&
  git fetch starter && git cherry-pick <commits>` (ou merge squash dirigido).

Reavaliar a opção 3 quando houver ≥4 serviços ativos derivados OU quando o
mesmo patch de segurança precisar ser aplicado manualmente pela terceira vez —
o que ocorrer primeiro. Nesse ponto o custo do registry passa a ser menor que
o custo do patch manual multiplicado.

## Consequências

- Toda mudança de segurança/infra no starter DEVE atualizar o CHANGELOG.
- `create-service` permanece o caminho de scaffolding; nenhum passo novo no
  onboarding.
- Releases do starter passam a ser taggeadas (`v0.x.y`) para facilitar
  `git fetch starter --tags` nos derivados.
