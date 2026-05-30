# Checklist — breaking changes e riscos de PR

Inspecionar o diff e listar explicitamente. Se não houver item, declarar **"Nenhum"** — não omitir a seção.

## Breaking changes (qualquer um)

- Alteração de assinatura de função/método/export público ou endpoint HTTP público
- Mudança de schema de banco (migration `up` sem `down` correspondente)
- Alteração de contrato de mensageria (payload de fila/tópico)
- Remoção ou renomeação de variável de ambiente obrigatória
- Mudança de contrato de evento/webhook publicado
- Feature flag ou comportamento default que altera consumidores existentes

## Riscos (revisor deve saber)

- Lógica nova sem cobertura de teste
- Dependência adicionada sem audit (`npm audit`, `bun audit`, `trivy`, `govulncheck`)
- Endpoint novo sem autenticação/autorização na borda
- Regressão não óbvia (performance, idempotência, retry)
