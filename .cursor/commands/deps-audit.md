---
description: Auditoria de dependências, lockfiles e supply chain sem aplicar atualizações automaticamente.
---

**Objetivo:** identificar riscos de dependências e cadeia de suprimentos com evidência e próximos passos seguros.

**Quando usar:** revisão de lockfile, upgrade de dependências, suspeita de CVE, preparação de release.

**Não usar quando:** auditoria de código-fonte da aplicação → [`security-review`](./security-review.md); migração de banco → [`migrate`](./migrate.md).

**Restrições:** não instalar nem atualizar pacotes sem pedido explícito; não enviar lockfile inteiro ao usuário; mascarar tokens de registries privados.

**Done when:** relatório lista ferramenta usada, achados priorizados, impacto, correção sugerida e comando de validação.

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md)

---

# deps-audit — Dependências e supply chain

## Passo 0 — Detectar ecossistema

Ler manifests e lockfiles antes de rodar comandos:

| Arquivo | Ecossistema | Ferramentas preferidas |
|---|---|---|
| `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb` | Node | `npm audit`, `pnpm audit`, `yarn npm audit`, `bun audit` quando disponível |
| `composer.json`, `composer.lock` | PHP | `composer audit` |
| `go.mod`, `go.sum` | Go | `govulncheck ./...` |
| `pyproject.toml`, `requirements*.txt`, `poetry.lock`, `uv.lock` | Python | `pip-audit`, `uv pip audit`, `safety` se já usado |
| `pom.xml`, `build.gradle`, `gradle.lockfile` | JVM | OWASP Dependency Check ou plugin já configurado |
| `Cargo.toml`, `Cargo.lock` | Rust | `cargo audit` |

Se a ferramenta não estiver instalada e não houver script no repo, reportar a limitação antes de instalar algo.

## Passo 1 — Executar auditoria segura

- Preferir scripts existentes (`package.json`, `Makefile`, CI) antes de comandos avulsos.
- Rodar somente comandos read-only de auditoria.
- Não executar postinstall, scripts remotos ou update automático.
- Se houver registry privado, não imprimir tokens nem URLs com credenciais.

## Passo 2 — Classificar achados

Para cada finding confirmado:

```text
[SEV] Pacote: nome@versao
Fonte   : ferramenta e advisory/CVE
Impacto : exploração prática no contexto do repo
Correção: versão segura ou mitigação
Validação: comando para confirmar a correção
```

Se a vulnerabilidade estiver em dependência de desenvolvimento sem caminho de exploração no runtime, marcar como `Baixo` ou `Médio` com justificativa.

## Passo 3 — Recomendar correção mínima

- Preferir upgrade de patch/minor que resolve o advisory.
- Não sugerir major upgrade sem listar breaking changes prováveis.
- Se a correção exigir migração, orientar abrir tarefa separada com plano.
- Para lockfile alterado, pedir validação de testes/lint/build do repo.
