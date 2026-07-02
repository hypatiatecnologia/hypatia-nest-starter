# Changelog

Serviços derivados via `create-service` são snapshots — acompanhe este arquivo
e aplique nos seus serviços as mudanças marcadas com **[aplicar em derivados]**.

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) ·
versão seguindo o `package.json`.

## [Unreleased]

### Security — [aplicar em derivados]

- NestJS 10 → 11 (Express 5) e Node 20 (EOL) → 22 LTS; `npm audit` high zerado.
- Override `multer@^2.2.0` (o `@nestjs/platform-express` ainda pinna 2.1.1,
  vulnerável a DoS — GHSA-72gw-mp4g-v24j). Remover quando o upstream atualizar.
- ThrottlerGuard agora roda **antes** do JwtAuthGuard: tentativas de auth
  falhas passam a consumir rate limit (antes, brute force não era limitado).
- JWT verificado via `jose` com `alg` pinado em HS256, `exp` obrigatório e
  `iss`/`aud` opcionais (`ARGUS_JWT_ISSUER`/`ARGUS_JWT_AUDIENCE`).
- Comparação do `x-api-key` em tempo constante; header redigido nos logs.
- `TRUST_PROXY` para IP real de cliente atrás de gateway (throttle + logs).
- CI: actions pinadas por SHA, checksum do gitleaks verificado,
  `npm ci --ignore-scripts`, job de docker build.
- Imagem Docker de produção sem devDependencies.

### Added

- `request.user` populado pelo guard + decorator `@CurrentUser()`.
- `GET /health/live` (liveness sem dependências) e `GET /health/ready`
  (readiness); `GET /health` mantido como alias de ready.
- `RedisService.setNx()` e `ping()`.
- Throttler com storage Redis em produção; `THROTTLE_TTL_MS`/`THROTTLE_LIMIT`.
- `configureApp()` compartilhado entre `main.ts` e testes e2e.
- LICENSE (MIT), SECURITY.md, renovate.json, .editorconfig, coverage threshold.

### Changed

- Dedupe de eventos atômico (`SET NX` antes do handler) — sem duplicatas
  entre réplicas concorrentes.
- Fila RabbitMQ bindada às routing keys dos handlers registrados (antes `#`,
  que entregava todos os eventos do ecossistema).
- `HttpClientService` só re-tenta métodos idempotentes (GET/PUT/DELETE) com
  jitter; POST exige `retry: true` explícito.
- Endpoint de exemplo valida `type` contra allowlist (`EXAMPLE_EVENT_TYPES`).
- ESLint passou a cobrir `test/`; script morto `test:ci` removido.

### Fixed

- Typo `HYPIATIA` no banner de startup.
- Mapping de porta do compose quando `PORT ≠ 3000`.
- Docs: credenciais RabbitMQ locais corretas (hypatia/hypatia-rabbitmq-dev)
  e exemplos de curl com `x-api-key`.
