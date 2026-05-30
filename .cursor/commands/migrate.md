---
description: Planeja e executa migration de banco com rollback; confirma antes de rodar em não-local.
---

**Objetivo:** migration reversível com checklist de segurança.

**Quando usar:** mudança de schema em produção/staging.

**Não usar quando:** só spec → [`spec`](./spec.md). **Plan Mode** recomendado antes de editar SQL.

**Done when:** migration + down documentados; confirmação do usuário para executar.

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md)

# /migrate — Migrações de Banco de Dados

Use este command quando for criar, revisar ou executar migrações de banco de dados.

> Seguir [architecture/rule.mdc](../rules/architecture/rule.mdc) — migrações pertencem à camada de Infra; nunca conter lógica de negócio.
> Seguir a rule de segurança da stack para não vazar dados em scripts de migração.

---

## Fase 1 — Reconhecimento (ler antes de qualquer ação)

Identificar o tooling de migração do projeto:

| Arquivo/padrão | Tool | Comando de status |
|---|---|---|
| `prisma/schema.prisma` | Prisma Migrate | `npx prisma migrate status` |
| `drizzle.config.*` | Drizzle Kit | `npx drizzle-kit status` |
| `alembic.ini` / `migrations/` (Python) | Alembic | `alembic current` |
| `src/migrations/` + `typeorm` em `package.json` | TypeORM | `npx typeorm migration:show` |
| `src/*/migrations/` + `@springboot` | Flyway/Liquibase | `./mvnw flyway:info` |
| `migrations/*.sql` sem framework | SQL puro | inspecionar manualmente |
| `db/migrate/*.rb` | Rails/ActiveRecord | `rails db:migrate:status` |

**Obrigatório:** executar o comando de status e reportar o estado atual antes de qualquer proposta.

---

## Fase 2 — Checklist de segurança PRÉ-migração

Responder cada item com ✅ ou ❌ + evidência antes de prosseguir:

- [ ] **Backup existe?** Confirmar que há backup recente do banco de produção (ou que o ambiente não é produção).
- [ ] **Migração é reversível?** Toda migração deve ter `down()` / `downgrade()` / script de rollback equivalente que restaura o estado anterior **sem perda de dados**.
- [ ] **Zero downtime?** Se a tabela tem tráfego ativo: verificar se a operação é `LOCK`-free (ex.: `ADD COLUMN` com default é geralmente seguro; `DROP COLUMN` ou `ALTER TYPE` podem bloquear).
- [ ] **Dados sensíveis no script?** Proibido seeds ou fixtures com PII, senhas reais ou tokens em scripts versionados.
- [ ] **Migração idempotente?** O script pode ser re-executado sem efeito colateral (ex.: `CREATE TABLE IF NOT EXISTS`, `IF NOT EXISTS` em índices)?
- [ ] **Testada em staging?** Confirmar que foi executada em ambiente não-produção com dump representativo.

Se qualquer item for ❌: **parar e reportar** antes de gerar ou executar qualquer script.

---

## Fase 3 — Geração da migração

### Regras obrigatórias para o conteúdo da migração

- **Obrigatório** `up` e `down` (ou `upgrade`/`downgrade`) em toda migração — sem `down` vazio.
- **Proibido** lógica de negócio (cálculos, transformações complexas) inline no SQL — mover para seed script separado ou script de backfill.
- **Proibido** `DROP TABLE` ou `DROP COLUMN` sem migração anterior que preserve os dados (ex.: renomear → copiar → drop em etapas).
- **Proibido** `NOT NULL` em coluna nova sem `DEFAULT` ou backfill prévio em tabelas com dados.
- Nomes de migração: `<timestamp>_<verbo>_<entidade>` — ex.: `20260501120000_add_status_to_invoices`.
- Uma responsabilidade por arquivo de migração — não agrupar alterações não relacionadas.

### Padrão seguro para colunas novas (TypeScript/Prisma):
```typescript
// ✅ Correto — nullable primeiro, backfill, depois NOT NULL
// Passo 1: adicionar como nullable
model Invoice {
  status String? // nullable temporariamente
}
// Passo 2: script de backfill — preencher status para registros existentes
// Passo 3: migração separada para tornar NOT NULL após backfill
```

### Padrão seguro para colunas novas (Drizzle):
```typescript
// Passo 1 — adicionar como nullable
export const invoices = pgTable('invoices', {
  status: text('status'), // nullable temporariamente
})
// Passo 2 — backfill
// Passo 3 — migração separada adicionando .notNull()
```

### Padrão seguro para colunas novas (TypeORM):
```typescript
// Passo 1 — nullable: true
@Column({ nullable: true })
status: string;

// Passo 3 — após backfill, migração separada:
export class MakeStatusNotNull implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "invoice" ALTER COLUMN "status" SET NOT NULL`)
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "invoice" ALTER COLUMN "status" DROP NOT NULL`)
  }
}
```

### Padrão seguro para colunas novas (Alembic/Python):
```python
# Passo 1 — nullable
op.add_column('invoices', sa.Column('status', sa.String(), nullable=True))

# Passo 3 — após backfill
def upgrade():
    op.alter_column('invoices', 'status', nullable=False)

def downgrade():
    op.alter_column('invoices', 'status', nullable=True)
```

### Padrão seguro para renomear coluna (SQL puro):
```sql
-- ❌ Errado — DROP direto
ALTER TABLE invoices DROP COLUMN old_name;
ALTER TABLE invoices ADD COLUMN new_name TEXT;

-- ✅ Correto — 3 migrações sequenciais
-- Migração 1: adicionar nova coluna
ALTER TABLE invoices ADD COLUMN new_name TEXT;
-- Migração 2 (deploy + backfill no app): app lê/escreve em ambas
-- Migração 3: remover coluna antiga após confirmação
ALTER TABLE invoices DROP COLUMN old_name;
```

---

## Fase 4 — Execução

**Obrigatório:** apresentar o comando exato ao usuário e aguardar confirmação explícita antes de executar em qualquer ambiente que não seja desenvolvimento local.

```bash
# Prisma
npx prisma migrate dev --name <nome>          # desenvolvimento
npx prisma migrate deploy                      # produção (sem interatividade)

# Drizzle
npx drizzle-kit generate
npx drizzle-kit migrate

# Alembic (Python)
alembic revision --autogenerate -m "<nome>"
alembic upgrade head

# Flyway (Java/Spring)
./mvnw flyway:migrate -Dflyway.url=... -Dflyway.user=... -Dflyway.password=...
```

**Regra de execução em produção:**
1. Confirmar backup antes.
2. Executar em horário de baixo tráfego se a operação não for zero-downtime.
3. Monitorar métricas de erro e latência por 5 minutos após execução.
4. Ter rollback planejado e documentado antes de executar.

---

## Fase 5 — Checklist pós-migração

- [ ] Migração executou sem erros?
- [ ] Schema atual bate com o esperado (`prisma migrate status` / `alembic current`)?
- [ ] Aplicação funciona corretamente com o novo schema (smoke test)?
- [ ] Métricas de erro não aumentaram?
- [ ] Script de rollback documentado e testado?
- [ ] Commit da migração inclui o script de down/rollback?

---

## Rollback de emergência

Se algo der errado após execução em produção:

```bash
# Prisma — reverter para migration anterior
npx prisma migrate resolve --rolled-back <migration_name>

# Drizzle — não tem comando de rollback nativo
# Executar manualmente o SQL inverso gerado na Fase 3
# ou restaurar o backup

# TypeORM
npx typeorm migration:revert   # reverte a última migration executada

# Alembic
alembic downgrade -1          # uma versão atrás
alembic downgrade <revision>  # versão específica

# Flyway
./mvnw flyway:undo            # requer Flyway Teams/Enterprise

# SQL puro — executar o script down manualmente
psql $DATABASE_URL < migrations/down/<timestamp>_rollback.sql
```

**Após rollback:** abrir incidente, documentar o que falhou, não re-executar sem corrigir a causa raiz.
