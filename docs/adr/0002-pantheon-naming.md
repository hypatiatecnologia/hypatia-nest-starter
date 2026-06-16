# ADR 0002: Nomenclatura Pantheon (mitologia grega)

**Status:** Aceito  
**Data:** 2026-06-16  
**Contexto:** microserviços Hypatia organizados como "The Pantheon".

## Contexto

O ecossistema Hypatia adota nomes de figuras da mitologia grega (e do universo clássico) como **codinomes** dos serviços. O conjunto de backends é chamado de **Pantheon**. O nome do ecossistema, **Hypatia**, remete à filósofa e matemática de Alexandria — conhecimento, rigor e engenharia.

Repositórios e código permanecem em **inglês descritivo** (`argus-auth`, `cerberus-gateway`). Os codinomes mitológicos são o vocabulário do time, da documentação e da operação.

## Decisão

Usar nomes mitológicos como metáfora da **responsabilidade** de cada serviço, não como nome técnico de pacote ou módulo.

| Nome | Papel na mitologia | Serviço | Repositório típico | Responsabilidade |
| --- | --- | --- | --- | --- |
| **Cerberus** | Guardião da entrada do submundo | API Gateway | `cerberus-gateway` | Único ponto de entrada HTTP externo |
| **Argus** | Gigante de muitos olhos | Auth | `argus-auth` | JWT, RBAC, identidade |
| **Hades** | Deus do submundo, reino oculto | Data Vault (LGPD) | `data-vault` | Único serviço com PII em claro |
| **Athena** | Estratégia e sabedoria | Core de vendas | `athena-core` | Pedidos, estoque, locks |
| **Midas** | Tudo vira ouro | Pagamentos | `midas-payment` | PIX, webhooks, reconciliação |
| **Hermes** | Mensageiro dos deuses | Notificações | `hermes-worker` | E-mails/push assíncronos (RabbitMQ) |
| **Nemesis** | Retribuição / justiça | Antifraude | `nemesis-antifraud` | Score de risco, regras heurísticas |
| **Morpheus** | Deus dos sonhos | App mobile B2C | `morpheus-mobile` | Interface do cliente |
| **Olympus** | Morada dos deuses | Backoffice | `olympus-backoffice` | Admin, métricas, operação |
| **Tartarus** | Abismo do submundo | Infra local | `tartarus-infra` | Postgres, Redis, RabbitMQ em dev |

## Motivos

1. **Identidade e vocabulário compartilhado** — frases como "só no Hades" ou "publica pro Hermes" comunicam regras de arquitetura de forma memorável.
2. **Metáfora funcional** — o nome antecipa o papel do serviço para quem entra no ecossistema.
3. **Namespaces estáveis** — filas (`hermes-worker.events`), exchange (`hypatia.events`) e bancos (`hermes`) ganham prefixos consistentes.
4. **Separação codinome vs. código** — repos em inglês (`argus-auth`); codinome mitológico na documentação e no dia a dia do time.
5. **Onboarding** — o [GLOSSARIO](../onboarding/GLOSSARIO.md) e este ADR funcionam como mapa mental do Pantheon.

## Consequências

### Positivas

- Comunicação mais clara entre devs, ops e produto.
- Novos serviços entram no "panteão" com nome que já sugere o papel.
- Menos colisão com nomes genéricos (`auth-service`, `payment-api`).

### Negativas

- Curva de aprendizado para quem não conhece a mitologia ou o mapa.
- Exige glossário/ADR para novos membros (este documento).

## Regras

- **Não** usar codinome mitológico como nome de variável, classe ou tabela sem necessidade — preferir termos de domínio em inglês.
- **Não** criar serviço com PII fora do **Hades** (regra transversal do Pantheon).
- Novo microserviço Pantheon: escolher nome mitológico alinhado à responsabilidade; registrar no glossário e em `AGENT.md`.

## Referências

- [AGENT.md](../../AGENT.md) — topologia Pantheon (workspace root)
- [GLOSSARIO.md](../onboarding/GLOSSARIO.md) — termos do ecossistema
- [.cursor/rules/hypatia-ecosystem/rule.mdc](../../.cursor/rules/hypatia-ecosystem/rule.mdc) — regras transversais
