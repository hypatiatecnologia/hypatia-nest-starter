# examples/ — Testes de Comportamento das Rules

Esta pasta documenta o comportamento **esperado** do agente para cada rule crítica do ecossistema.

## Como usar

Cada arquivo `<rule>.example.md` contém:
- **Prompt de entrada** — o que o desenvolvedor envia ao agente.
- **Output esperado (correto)** — o que o agente DEVE gerar quando a rule está ativa.
- **Output incorreto (proibido)** — o que o agente NÃO deve gerar.
- **Rules ativas** — quais rules são responsáveis pelo comportamento correto.

## Para validar manualmente

1. Abra o Cursor com as rules instaladas no projeto.
2. Envie o **Prompt de entrada** ao Agent.
3. Compare o output gerado com o **Output esperado**.
4. Se o output bater com o **incorreto**, a rule correspondente não está funcionando.

## Arquivos

| Arquivo | Rule testada | Foco |
|---|---|---|
| `01-architecture.example.md` | `architecture` | Separação de camadas, DIP |
| `02-security-ts.example.md` | `typescript-security` | Validação de entrada, IDOR |
| `03-cognitive-complexity.example.md` | `cognitive-complexity` | Funções simples, guard clauses |
| `04-errors-and-logging.example.md` | `errors-and-logging` | DomainError, RFC 7807 |
| `05-tester.example.md` | `tester` | Cenários de teste, AAA |
| `06-gitflow.example.md` | `gitflow` | Conventional Commits |
| `07-go.example.md` | `go` + `go-security` | Error handling, queries parametrizadas |
| `08-java-spring.example.md` | `java-spring` + `java-security` | Controller magro, JPA, IDOR |
| `09-php.example.md` | `php` + `laravel` + `php-security` | Controller magro, FormRequest, Policy, paginação |
| `10-nestjs-patterns.example.md` | `nestjs-patterns` | Controller magro, DTO class-validator, service + Prisma |
| `11-remix-fsd.example.md` | `remix-fsd` | Rota magra, action/loader, FSD, Zod, Supabase SSR |
