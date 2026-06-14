---
description: Auditoria de segurança read-only (OWASP/CWE) em arquivo, pasta ou diff de PR; não aplica edits.
---

**Objetivo:** relatório de findings de segurança sem alterar código.

**Quando usar:** revisar diff de PR, módulo sensível, antes de merge.

**Não usar quando:** diagnóstico de sprint/ROI do repo inteiro → [`diagnostico`](./diagnostico.md) (dimensão SEG); hardening Supabase (RLS, Storage, Auth, service_role) → [`supabase-hardening`](./supabase-hardening.md).

**Done when:** relatório no formato dos Passos 2–3; findings ordenados por severidade; sem PII/secrets no texto.

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md)

---

**Alvo:** arquivo(s), pasta(s) ou `diff` — especificar no turno.

**Modo somente leitura:** nunca aplicar edits. Fixes em sessão separada.

Diff de PR: [_shared/git-diff-base.md](./_shared/git-diff-base.md) (não usar `--staged`).

Carregar rule de segurança da stack: TS/JS → [typescript-security](../rules/security/typescript-security.mdc) · Python → [python-security](../rules/security/python-security.mdc) · Go → [go-security](../rules/security/go-security.mdc) · Java/Spring → [java-security](../rules/security/java-security.mdc) + [java-spring](../rules/java-spring/rule.mdc) · PHP → [php-security](../rules/security/php-security.mdc) · PHP + Zend → [php-security](../rules/security/php-security.mdc) + [zend-framework](../rules/zend-framework/rule.mdc).

---

## Passo 0 — Sanitização obrigatória antes de qualquer análise

Se o alvo contiver secrets, tokens, CPFs, senhas, chaves de API, dados de produção ou PII: **mascarar imediatamente** e não reproduzir esses valores em nenhuma parte do relatório. Substituir por `[REDACTED]`. Continuar a análise com os valores mascarados.

---

## Passo 1 — Checklist de análise por categoria

Inspecionar o alvo em cada categoria abaixo. Registrar cada problema encontrado como um finding. Se não houver evidência suficiente para confirmar, registrar como `[hipótese]` com o que seria necessário para confirmar.

### Autenticação e autorização (OWASP A01/A07)
- [ ] Endpoint acessível sem autenticação onde deveria exigir
- [ ] Verificação de autorização ausente ou bypassável (ex.: checar só o papel, não o recurso)
- [ ] Token ou sessão sem expiração definida
- [ ] JWT aceito sem verificar assinatura ou com algoritmo `none`
- [ ] `@PreAuthorize` / middleware de auth ausente em rota sensível (JVM/Node)
- [ ] Mass assignment: bind de campos do request direto na entidade sem allowlist

### Injeção (OWASP A03)
- [ ] Query SQL construída por concatenação de string com input do usuário
- [ ] Comando shell construído com input não sanitizado (`exec`, `spawn`, `os.system`)
- [ ] Template engine recebendo input do usuário sem escape (SSTI)
- [ ] LDAP / XPath / NoSQL query construída com input direto
- [ ] XML/HTML gerado com input sem sanitização (XSS/XXE)

### Exposição de dados sensíveis (OWASP A02/A09)
- [ ] Secret ou credencial hardcoded no código ou em arquivo não ignorado pelo git
- [ ] PII (CPF, e-mail, senha, token) em log estruturado ou payload de fila
- [ ] Stack trace ou detalhe interno vazando na resposta de erro para o cliente
- [ ] Resposta de API incluindo campos que não deveriam ser expostos (over-fetching)
- [ ] Dados em trânsito via HTTP onde deveria ser HTTPS

### Dependências e configuração (OWASP A06/A05)
- [ ] Dependência com CVE conhecido — verificar com `npm audit`, `trivy`, `govulncheck`, `safety check`, `bundle audit`
- [ ] CORS configurado com `*` em produção ou com `allowedOrigins` aceitando qualquer origem
- [ ] CSRF sem proteção em endpoints que modificam estado
- [ ] Actuator / debug endpoints expostos em produção (Spring, Django debug, `/metrics` público)
- [ ] `.env.example` ausente ou com valores reais commitados

### Validação e limites (OWASP A03/A04)
- [ ] Input do usuário usado sem validação de tipo, tamanho ou formato
- [ ] Upload de arquivo sem restrição de tipo MIME ou tamanho
- [ ] Rate limiting ausente em endpoints públicos ou de autenticação
- [ ] Operação destrutiva (delete, update em massa) sem confirmação ou limite de escopo

### SSRF e chamadas externas (OWASP A10)
- [ ] URL construída a partir de input do usuário sem allowlist de domínios
- [ ] Redirecionamento para URL fornecida pelo usuário sem validação
- [ ] Requisição a serviço interno disparada por input externo

### Específico para JVM/Spring
- [ ] Deserialização insegura (Java ObjectInputStream, Jackson com polimorfismo sem restrição)
- [ ] SpEL injection em `@Value` ou `@Query` com input do usuário
- [ ] Actuator endpoints sem autenticação (`/actuator/env`, `/actuator/beans`)

---

## Passo 2 — Formato de cada finding

Para cada problema confirmado, gerar uma entrada neste formato exato:

```
[SEV] CWE-NNN · OWASP A0X — {categoria curta}
Local   : path/arquivo.ts:linha
Risco   : {uma frase — o que pode acontecer se explorado}
Evidência: {trecho mínimo do código, sem secrets — ou [hipótese: o que confirmar]}
Remediação: {1–2 frases técnicas — o que mudar e como}
```

**Severidade:**
- **Crítico** — exploração direta sem autenticação, perda de dados, RCE, vazamento de credencial em produção
- **Alto** — requer autenticação ou condição específica, impacto significativo
- **Médio** — difícil de explorar ou impacto limitado, mas real
- **Baixo** — defense-in-depth, boas práticas, sem impacto direto imediato

Ordenar os findings: Crítico → Alto → Médio → Baixo. Dentro de cada nível, ordenar por facilidade de exploração (mais fácil primeiro).

---

## Passo 3 — Estrutura completa do relatório

```
## Relatório de Segurança — {alvo} — {DATA_ISO}

**Stack:** {linguagem + framework detectados}
**Escopo:** {arquivos / diff analisado}
**Total de findings:** {n} ({n} Crítico · {n} Alto · {n} Médio · {n} Baixo)

---

{findings ordenados conforme Passo 2}

---

## Resumo executivo

{2–3 frases: qual é o risco mais urgente, o padrão de problema mais recorrente,
e se o código é seguro para ir a produção no estado atual.}

## Próximos passos
{ver seção abaixo}
```

Se não houver nenhum finding: registrar explicitamente:

```
Nenhum problema identificado no escopo analisado em {DATA_ISO}.
Escopo: {lista do que foi lido}
Limitações: {o que não foi coberto — ex.: sem acesso ao banco, sem testes de integração}
```

---

## Passo 4 — Próximos passos por severidade máxima

### Se houver achado Crítico
1. **Não abrir o PR.** Corrigir antes de qualquer merge.
2. Abrir sessão separada, apontar para `path:linha` do finding e corrigir diretamente.
3. Se o código já está em produção: avaliar rotação de credenciais, revogação de tokens ou invalidação de sessões — reportar ao responsável de segurança do time.
4. Após corrigir, rodar `/security-review` novamente no mesmo alvo para confirmar resolução.

### Se houver achado Alto
1. Abrir o PR é permitido, mas criar uma issue imediatamente para fix antes da próxima release.
2. Descrever o achado na seção **Breaking Changes / Riscos** da descrição do PR.
3. Rodar `/security-review` novamente após o fix antes de fechar a issue.

### Se houver apenas achados Médio/Baixo
1. Registrar como issue no backlog com label `security`.
2. Mencionar no PR como risco conhecido e aceito, com prazo de resolução estimado.
