---
description: Auditoria read-only de hardening Supabase (RLS, Storage, Auth, service_role, Postgres, frontend) com score antes de produção.
---

**Objetivo:** relatório de hardening Supabase com score de segurança, findings priorizados e correções sugeridas — sem alterar código nem banco.

**Quando usar:** pré-deploy em produção, revisão periódica, após mudança em RLS/policies/buckets/auth, onboarding de projeto Supabase existente.

**Não usar quando:** auditoria genérica de código (não Supabase) → [`security-review`](./security-review.md); dependências e CVEs → [`deps-audit`](./deps-audit.md); diagnóstico de sprint/ROI → [`diagnostico`](./diagnostico.md).

**Restrições:** modo somente leitura; mascarar chaves/PII como `[REDACTED]`; SQL apenas `SELECT` em catálogos; nunca `INSERT`/`UPDATE`/`DELETE`/`DROP` via MCP ou CLI; não reproduzir valores de secrets no relatório.

**Done when:** relatório com score 0–100, findings por severidade (Crítico → Baixo), resumo executivo, código vulnerável vs. corrigido por achado relevante, go/no-go para produção e limitações documentadas.

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md)

**Referências normativas:** OWASP Top 10 · OWASP API Security Top 10 · PostgreSQL Security Best Practices · [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod) · skill `supabase` do plugin (carregar quando disponível).

---

**Alvo:** projeto Supabase inteiro (código + ambiente remoto quando acessível). Especificar escopo no turno se for parcial (ex.: só Storage).

**Modo somente leitura:** nunca aplicar edits, migrations ou alterações no Dashboard. Fixes em sessão separada.

---

## Passo 0 — Sanitização e descoberta de fontes

### 0.1 Sanitização obrigatória

Se o alvo contiver secrets, tokens, CPFs, senhas, chaves de API, dados de produção ou PII: **mascarar imediatamente** e não reproduzir esses valores no relatório. Substituir por `[REDACTED]`. Continuar a análise com valores mascarados.

### 0.2 Inventário de fontes de evidência

Detectar e registrar no relatório quais fontes estão disponíveis:

| Fonte | Como detectar | Uso |
|---|---|---|
| MCP Supabase | plugin instalado e autenticado | `get_advisors`, `list_tables`, `execute_sql` (read-only) |
| Supabase CLI | `supabase --version` | `supabase inspect db`, `supabase projects list` |
| Migrations locais | `supabase/migrations/*.sql` | RLS, policies, grants, functions |
| Código da app | `src/`, `app/`, `supabase/functions/` | clients, queries, service_role |
| Env / secrets | `.env*`, `.gitignore`, histórico git | exposição de chaves |

Detectar stack frontend:

- **Next.js:** `next.config.*`
- **Remix / React Router v7:** `react-router.config.ts`, `app/routes/`
- **Vite/React SPA:** `vite.config.*`

### 0.3 Baseline oficial (quando MCP disponível)

Rodar `get_advisors` com foco em **security** e incorporar achados como findings (ou confirmar ausência). Não duplicar o mesmo problema — referenciar o advisor como evidência adicional.

---

## Passo 1 — Segredos e variáveis de ambiente

### Verificar

- [ ] `SUPABASE_SERVICE_ROLE_KEY` ou `service_role` em código cliente, Client Components, bundles browser
- [ ] Chave exposta via prefixo público: `NEXT_PUBLIC_*`, `VITE_*`, `PUBLIC_*`
- [ ] Chaves hardcoded (regex: `eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+`)
- [ ] `.env`, `.env.local`, `.env.production` commitados ou não listados em `.gitignore`
- [ ] Secrets no histórico git (`git log -p -S "service_role"`, `git log -p -S "SUPABASE_SERVICE_ROLE"`)
- [ ] URL de produção apontando para projeto de dev/staging em build de produção
- [ ] `anon` key usada onde deveria haver validação server-side adicional

### Greps sugeridos

```bash
rg -i "SUPABASE_SERVICE_ROLE|service_role|SERVICE_ROLE_KEY" --glob "!node_modules"
rg -i "NEXT_PUBLIC_.*SUPABASE|VITE_.*SUPABASE" --glob "!node_modules"
rg "eyJ[a-zA-Z0-9_-]{20,}" --glob "!node_modules" --glob "!*.lock"
```

### Paths de alto risco (frontend)

- `**/*.client.{ts,tsx,js,jsx}`
- `**/components/**` sem `"use server"`
- `app/**` com `'use client'` (Next.js)
- `src/lib/supabase/client.ts`, `createBrowserClient`

### Exemplo vulnerável vs. corrigido

```ts
// Vulnerável — service role no browser
const supabase = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!)

// Corrigido — apenas anon no cliente; operações privilegiadas no servidor
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
```

---

## Passo 2 — Row Level Security (RLS)

### SQL de auditoria — tabelas sem RLS

```sql
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'auth', 'storage', 'realtime', 'extensions', 'vault', 'pgsodium', 'graphql', 'graphql_public', 'supabase_migrations')
  AND rowsecurity = false
ORDER BY schemaname, tablename;
```

### SQL — policies excessivamente permissivas

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  AND (
    qual ILIKE '%true%'
    OR with_check ILIKE '%true%'
    OR (qual ILIKE '%auth.uid() is not null%' AND qual NOT ILIKE '%auth.uid() =%')
    OR (with_check ILIKE '%auth.uid() is not null%' AND with_check NOT ILIKE '%auth.uid() =%')
  )
ORDER BY schemaname, tablename, policyname;
```

### SQL — tabelas expostas via API sem nenhuma policy

```sql
SELECT t.schemaname, t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON p.schemaname = t.schemaname AND p.tablename = t.tablename
WHERE t.schemaname IN ('public')
  AND t.rowsecurity = true
  AND p.policyname IS NULL
ORDER BY t.schemaname, t.tablename;
```

### Verificar em migrations

```bash
rg -i "ENABLE ROW LEVEL SECURITY|CREATE POLICY|USING \(true\)|WITH CHECK \(true\)" supabase/migrations/
```

### Padrões perigosos

| Padrão | Risco |
|---|---|
| `USING (true)` | Leitura/escrita global para o role da policy |
| `WITH CHECK (true)` | Inserção/atualização sem restrição |
| `auth.uid() IS NOT NULL` sem filtro de ownership | Qualquer usuário autenticado acessa todos os registros |
| RLS desabilitado em tabela `public` | PostgREST expõe todos os dados via anon/authenticated |
| Policy só para `SELECT`, sem `INSERT`/`UPDATE`/`DELETE` | Operações de escrita sem controle |

### Exemplo vulnerável vs. corrigido

```sql
-- Vulnerável
CREATE POLICY "users_read" ON profiles FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Corrigido
CREATE POLICY "users_read_own" ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
```

---

## Passo 3 — Ownership e multi-tenant

### SQL — tabelas com colunas de ownership

```sql
SELECT table_schema, table_name, column_name
FROM information_schema.columns
WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'auth', 'storage')
  AND column_name IN ('user_id', 'owner_id', 'created_by', 'tenant_id', 'organization_id', 'org_id', 'workspace_id')
ORDER BY table_schema, table_name, column_name;
```

### Para cada tabela identificada

- [ ] Policies de `SELECT` filtram por ownership (`column = auth.uid()` ou subquery de membership)
- [ ] Policies de `INSERT`/`UPDATE` validam ownership no `WITH CHECK`
- [ ] `tenant_id`/`organization_id` não é controlável pelo cliente sem validação server-side
- [ ] JWT custom claims (`app_metadata`, `user_metadata`) não são fonte única de autorização sem RLS
- [ ] Tabelas de junção (membership) impedem adicionar usuário a tenant alheio

### SQL — cruzar ownership com policies

```sql
SELECT c.table_schema, c.table_name, c.column_name, p.policyname, p.cmd, p.qual, p.with_check
FROM information_schema.columns c
JOIN pg_policies p ON p.schemaname = c.table_schema AND p.tablename = c.table_name
WHERE c.column_name IN ('user_id', 'owner_id', 'created_by', 'tenant_id', 'organization_id')
  AND c.table_schema = 'public'
ORDER BY c.table_name, p.cmd;
```

### Risco cross-tenant

Marcar **Crítico** se: usuário autenticado consegue ler/escrever registros de outro tenant via API REST ou Realtime.

---

## Passo 4 — Buckets de Storage

### SQL — buckets públicos

```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
ORDER BY public DESC, name;
```

### SQL — policies permissivas em storage

```sql
SELECT *
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND (qual ILIKE '%true%' OR with_check ILIKE '%true%');
```

### Verificar

- [ ] Buckets `public = true` contêm apenas assets realmente públicos (avatars genéricos, marketing)
- [ ] Upload permitido sem autenticação em bucket que deveria ser privado
- [ ] Policy de download permite acesso a pasta de outro usuário (`storage.foldername` mal aplicado)
- [ ] `file_size_limit` e `allowed_mime_types` definidos onde aplicável
- [ ] Signed URLs com TTL curto para conteúdo privado
- [ ] Path traversal: nome de arquivo controlado pelo usuário sem sanitização

### Greps

```bash
rg -i "storage\.from|getPublicUrl|createSignedUrl" --glob "!node_modules"
rg -i "public.*bucket|bucket.*public" supabase/
```

### Exemplo vulnerável vs. corrigido

```sql
-- Vulnerável — qualquer autenticado lê qualquer arquivo
CREATE POLICY "objects_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'private-docs');

-- Corrigido — pasta = user id
CREATE POLICY "objects_read_own" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'private-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## Passo 5 — Auth

### Configuração (Dashboard / Management API / MCP)

- [ ] Confirmação de e-mail habilitada em produção
- [ ] MFA (TOTP) disponível e documentado para admins
- [ ] Leaked password protection (HaveIBeenPwned) habilitado
- [ ] OTP expiry razoável (não excessivamente longo)
- [ ] Redirect URLs sem wildcard perigoso (`*`, domínios não confiáveis)
- [ ] Site URL e redirect URLs de produção corretos
- [ ] Signup aberto sem necessidade (considerar invite-only ou captcha)
- [ ] Password mínimo e política de complexidade adequados

### Enumeração de usuários

- [ ] Signup/login/reset retornam mensagens genéricas (não revelar "e-mail não cadastrado" vs. "senha incorreta")
- [ ] Timing attack: respostas com latência similar para usuário existente/inexistente
- [ ] Endpoint custom de verificação de e-mail expõe existência de conta

### Greps no código

```bash
rg -i "signUp|signInWithPassword|resetPasswordForEmail|auth\.admin" --glob "!node_modules"
rg -i "email.*(not found|não encontrado|already registered|já cadastrado)" --glob "!node_modules" -i
```

### Exemplo vulnerável vs. corrigido

```ts
// Vulnerável — enumera usuários
if (error?.message.includes('Invalid login credentials')) {
  return { error: 'E-mail ou senha incorretos' }
}
if (error?.message.includes('User not found')) {
  return { error: 'E-mail não cadastrado' }
}

// Corrigido — mensagem única
return { error: 'Credenciais inválidas. Verifique e-mail e senha.' }
```

---

## Passo 6 — APIs públicas e queries no código

### Verificar

- [ ] Uso de `createClient` / `createBrowserClient` com queries sem filtro
- [ ] `.select('*')` em tabelas com PII ou dados financeiros
- [ ] Schemas expostos além de `public` (`db_schema` no config)
- [ ] Views sobre `auth.users` acessíveis via API
- [ ] Over-fetching: colunas sensíveis retornadas ao cliente sem necessidade
- [ ] Filtros apenas no frontend (bypass trivial via API direta)

### Greps

```bash
rg "\.from\(['\"]" --glob "!node_modules" -A 2
rg "\.select\(['\"]?\*['\"]?\)" --glob "!node_modules"
rg "createClient|createBrowserClient|createServerClient" --glob "!node_modules"
```

### Classificação de risco

| Padrão | Severidade típica |
|---|---|
| `select('*')` em tabela com PII sem RLS | Crítico |
| Query sem filtro em tabela com RLS fraca (`auth.uid() IS NOT NULL`) | Alto |
| `select('*')` em tabela com RLS forte por ownership | Médio |
| Select explícito de colunas não sensíveis com RLS correto | Baixo / OK |

### Exemplo vulnerável vs. corrigido

```ts
// Vulnerável
const { data } = await supabase.from('users').select('*')

// Corrigido
const { data } = await supabase
  .from('profiles')
  .select('id, display_name, avatar_url')
  .eq('user_id', userId)
```

---

## Passo 7 — Edge Functions

### Verificar em `supabase/functions/` e `config.toml`

- [ ] Funções sensíveis **não** usam `verify_jwt = false` sem substituto robusto
- [ ] JWT validado manualmente quando `verify_jwt` desabilitado (`auth.getUser(jwt)`)
- [ ] CORS não usa `Access-Control-Allow-Origin: *` em produção com dados autenticados
- [ ] Secrets via `Deno.env.get()`, nunca hardcoded
- [ ] Rate limiting ou throttling em endpoints públicos
- [ ] Input validado (Zod/Yup) antes de operações com service_role
- [ ] Respostas de erro não vazam stack ou SQL

### Greps

```bash
rg -i "verify_jwt|Access-Control-Allow-Origin|Deno\.env" supabase/
rg "service_role|createClient" supabase/functions/
```

### Exemplo vulnerável vs. corrigido

```ts
// Vulnerável — CORS aberto + sem auth
return new Response(JSON.stringify(data), {
  headers: { 'Access-Control-Allow-Origin': '*' },
})

// Corrigido
const user = await verifyJwt(req)
if (!user) return new Response('Unauthorized', { status: 401 })
return new Response(JSON.stringify(data), {
  headers: { 'Access-Control-Allow-Origin': allowedOrigin },
})
```

---

## Passo 8 — Dados sensíveis (PII / LGPD)

### SQL — colunas com nomes sensíveis

```sql
SELECT table_schema, table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    column_name ILIKE '%cpf%'
    OR column_name ILIKE '%rg%'
    OR column_name ILIKE '%passport%'
    OR column_name ILIKE '%passaporte%'
    OR column_name ILIKE '%phone%'
    OR column_name ILIKE '%telefone%'
    OR column_name ILIKE '%card%'
    OR column_name ILIKE '%cartao%'
    OR column_name ILIKE '%credit%'
    OR column_name ILIKE '%address%'
    OR column_name ILIKE '%endereco%'
    OR column_name ILIKE '%ssn%'
    OR column_name ILIKE '%bank%'
    OR column_name ILIKE '%salary%'
    OR column_name ILIKE '%salario%'
  )
ORDER BY table_name, column_name;
```

### Verificar

- [ ] Colunas sensíveis com RLS restritiva (não só `auth.uid() IS NOT NULL`)
- [ ] Criptografia em repouso (pgsodium, Vault) para dados altamente sensíveis
- [ ] Mascaramento em views expostas à API
- [ ] Retenção e exclusão (direito ao esquecimento) documentados
- [ ] Backups e logs não expõem PII em texto claro

---

## Passo 9 — Auditoria de uso de service_role

### Greps

```bash
rg -i "service_role|SUPABASE_SERVICE_ROLE|createClient\([^)]*service" --glob "!node_modules"
```

### Classificar cada ocorrência

| Classificação | Critério |
|---|---|
| **Necessário** | Job admin isolado (cron, webhook server-side), sem alternativa RLS, escopo mínimo |
| **Suspeito** | Poderia usar client autenticado + RLS; uso em route handler sem validação extra |
| **Crítico** | Exposto ao browser, serializado em loader, ou usado para bypassar auth do usuário final |

### Para cada uso Suspeito/Crítico

Sugerir substituição por: client com JWT do usuário + RLS, ou Edge Function com validação + operação mínima privilegiada.

---

## Passo 10 — Segurança do PostgreSQL

### SQL — functions SECURITY DEFINER

```sql
SELECT n.nspname AS schema, p.proname AS function_name, p.prosecdef AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.prosecdef = true
  AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'extensions')
ORDER BY n.nspname, p.proname;
```

### SQL — views (security invoker vs definer)

```sql
SELECT schemaname, viewname, definition
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;
```

Verificar se views usam `security_invoker = true` (Postgres 15+) ou se `SECURITY DEFINER` bypassa RLS.

### SQL — grants excessivos

```sql
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee IN ('anon', 'authenticated', 'public')
  AND table_schema = 'public'
ORDER BY table_name, grantee, privilege_type;
```

### SQL — Realtime publications

```sql
SELECT pubname, schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;
```

### Verificar

- [ ] `SECURITY DEFINER` functions com `SET search_path = ''` ou schema fixo
- [ ] Triggers que alteram `user_id`/`tenant_id` sem validar caller
- [ ] Extensões no schema `public` (mover para `extensions`)
- [ ] Tabelas na publication Realtime têm RLS habilitado e policies corretas
- [ ] `GRANT ALL` para `anon` ou `authenticated` em tabelas sensíveis

### Greps em migrations

```bash
rg -i "SECURITY DEFINER|SECURITY INVOKER|CREATE TRIGGER|GRANT ALL|supabase_realtime" supabase/migrations/
```

---

## Passo 11 — Rate limiting

### Verificar

- [ ] Limites de Auth configurados (e-mails/hora, SMS, verificações OTP)
- [ ] Captcha ou proteção anti-bot em signup/login público
- [ ] Edge Functions e route handlers custom sem throttling
- [ ] Password reset não permite spam de e-mails
- [ ] APIs públicas vulneráveis a brute force e scraping em massa

### Evidência

- Dashboard → Auth → Rate Limits
- Código: ausência de middleware de rate limit em rotas sensíveis
- Marcar **Alto** endpoints de auth custom sem proteção

---

## Passo 12 — Exposição de dados em logs

### Greps

```bash
rg "console\.(log|debug|info|warn)\(.*(user|session|jwt|token|password|cpf)" --glob "!node_modules" -i
rg "logger\.(info|debug|warn)\(.*(user|session|jwt|token)" --glob "!node_modules" -i
```

### Verificar

- [ ] Logs de produção com tokens, e-mails, PII
- [ ] `console.log` em loaders/actions server-side que vazam para stdout em produção
- [ ] Integração com [errors-and-logging](../rules/errors-and-logging/rule.mdc): redaction de campos sensíveis
- [ ] Error boundaries e handlers não serializam `error.cause` com SQL interno

---

## Passo 13 — Segurança frontend (Next.js / Remix / React Router)

### Next.js

- [ ] `SUPABASE_SERVICE_ROLE` em Client Components ou `NEXT_PUBLIC_*`
- [ ] Server Actions sem revalidação de sessão (`getUser()` no servidor)
- [ ] Route Handlers (`app/api/**`) expõem dados sem auth
- [ ] Middleware (`middleware.ts`) protege rotas `/app`, `/admin`
- [ ] Dados sensíveis em props serializadas para o cliente

### Remix / React Router v7

- [ ] Service role apenas em `actions.ts`/`loaders.ts` server-side — nunca em componentes
- [ ] `loader` retorna apenas campos necessários ao cliente
- [ ] `getSession()` substituído por `getUser()` ou `getClaims()` no servidor ([doc Supabase SSR](https://supabase.com/docs/guides/auth/server-side))
- [ ] Rotas `/app` e `/admin` com gate de auth no loader

### Greps

```bash
rg "'use client'" -l --glob "*.tsx" | xargs rg -l "service_role|SERVICE_ROLE" 2>/dev/null
rg "getSession\(\)" --glob "!node_modules"
rg "loaderData|useLoaderData" --glob "!node_modules" -A 1
```

### Exemplo vulnerável vs. corrigido (Remix/React Router)

```ts
// Vulnerável — confia em sessão do cookie sem validar JWT no servidor
const { data: { session } } = await supabase.auth.getSession()

// Corrigido — valida JWT com o Auth server
const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) throw redirect('/login')
```

---

## Passo 14 — Relatório final

### Formato de cada finding

```
[SEV] · {área} — {categoria}
Local    : {path/arquivo:linha ou tabela.policy do banco}
Risco    : {uma frase — impacto se explorado na internet pública}
Evidência: {trecho mínimo, sem secrets — ou [hipótese: o que confirmar]}
Remediação: {1–2 frases técnicas}
Correção :
  // vulnerável
  {código}
  // corrigido
  {código}
```

**Severidade:**

- **Crítico** — bypass de auth, vazamento em massa, service_role no cliente, RLS ausente em dados sensíveis, bucket privado público
- **Alto** — cross-tenant possível, policy `true`, enumeração de usuários, SECURITY DEFINER perigoso
- **Médio** — `select('*')` com RLS ok, logging de PII, rate limit ausente em endpoint secundário
- **Baixo** — defense-in-depth, hardening recomendado sem exploração imediata

Ordenar: Crítico → Alto → Médio → Baixo. Dentro do nível, por facilidade de exploração.

### Score de segurança (determinístico)

```
Score = max(0, 100 - (Crítico × 15) - (Alto × 7) - (Médio × 3) - (Baixo × 1))
```

### Estrutura completa do relatório

```
## Supabase Hardening — {projeto} — {DATA_ISO}

**Stack:** {framework detectado}
**Fontes:** {MCP / CLI / migrations / código — o que foi usado}
**Supabase Security Score:** {NN}/100

| Severidade | Quantidade |
|---|---|
| Crítico    | {n}        |
| Alto       | {n}        |
| Médio      | {n}        |
| Baixo      | {n}        |

**Veredito produção:** {NO-GO se ≥1 Crítico · GO com ressalvas se ≥1 Alto · GO se apenas Médio/Baixo}

---

{findings ordenados}

---

## Resumo executivo

{2–4 frases: risco mais urgente, padrão recorrente, prontidão para produção}

## Próximos passos

{conforme severidade máxima — ver abaixo}

## Limitações

{o que não foi verificado — ex.: sem MCP, auth config inacessível, sem acesso ao Dashboard}
```

### Próximos passos por severidade máxima

**Se houver achado Crítico**

1. **Não fazer deploy.** Corrigir antes de qualquer release.
2. Abrir sessão separada por finding; apontar `path:linha` ou migration/policy.
3. Se já em produção: rotacionar chaves (`service_role`, `anon` se comprometida), revisar logs de acesso.
4. Rodar `/supabase-hardening` novamente após correções.

**Se houver achado Alto**

1. Deploy bloqueado até plano de correção com prazo definido (idealmente antes do deploy).
2. Criar issues com label `security` para cada achado.
3. Re-auditar após fix.

**Se houver apenas Médio/Baixo**

1. Registrar no backlog com label `security`.
2. Deploy permitido com ressalvas documentadas no PR/release notes.

### Se nenhum finding

```
Nenhum problema identificado no escopo analisado em {DATA_ISO}.
Escopo: {lista do que foi lido e consultado}
Limitações: {o que não foi coberto}
```

---

## Verificações adicionais (rigor máximo)

Incluir quando aplicável — vulnerabilidades sutis frequentemente ignoradas:

- [ ] `auth.users` ou `auth.identities` acessíveis via views/funções em `public`
- [ ] Webhooks (Stripe, etc.) sem verificação de assinatura
- [ ] SQL dinâmico em RPC/functions com concatenação de input
- [ ] Políticas que usam `current_setting('request.jwt.claims')` sem validar assinatura
- [ ] Replicação lógica ou exports expõem tabelas sensíveis
- [ ] Branching/preview deploys com dados de produção reais
- [ ] RLS testada apenas com um usuário de teste (não valida cross-tenant)
- [ ] `supabase link` / project ref de produção em repo público
- [ ] Dependências `@supabase/*` desatualizadas com advisories conhecidos → cruzar com [`deps-audit`](./deps-audit.md)
