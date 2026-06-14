# Agent guide — <!-- TODO: nome do projeto -->

Referência para assistentes de IA — Go.

## Stack

- **Go version:** <!-- TODO: ex. 1.22+ (ver go.mod) -->
- **HTTP:** <!-- TODO: net/http, chi, gin, echo, fiber -->
- **DB:** <!-- TODO: sqlc, pgx, GORM ou N/A -->
- **Tests:** `go test ./...`

## Where to put code

| Concern | Location |
|---------|----------|
| Entrypoint | `cmd/<binary>/main.go` |
| Domain / use cases | `internal/<feature>/` |
| HTTP handlers | `internal/<feature>/handler.go` ou `internal/transport/` |
| Repositories | `internal/<feature>/repository.go` |
| Shared libs | `pkg/` (só se reutilização externa real) |

Handlers traduzem HTTP ↔ domínio; erros com `%w` e mapeamento de status só na borda.

## Conventions

- `gofmt` / `goimports`; linter <!-- TODO: golangci-lint config -->.
- Queries SQL parametrizadas; sem concatenação de input do usuário.
- Conventional Commits.

## Useful scripts

```bash
go run ./cmd/...          # TODO: ajustar
go test ./...
go vet ./...
golangci-lint run         # se configurado
```

## Onboarding

<!-- TODO: README -->

## Cursor

Rules: `go`, `go-security` · [.cursor/PORTABILITY.md](.cursor/PORTABILITY.md)
