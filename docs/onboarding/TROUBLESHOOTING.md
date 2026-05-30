# Troubleshooting — setup local

Soluções para erros frequentes ao instalar e testar o [Hypatia Nest Starter](../../README.md). Roteiro feliz: [PRIMEIROS-PASSOS.md](./PRIMEIROS-PASSOS.md).

## `getaddrinfo ENOTFOUND postgres` ou `ECONNREFUSED` no boot

**Causa:** `.env` com hostnames Docker (`postgres`, `redis`, `rabbitmq`) enquanto a API roda no host (`npm run start:dev`).

**Correção:**

```bash
cp archetypes/api.env.example .env
```

Reinicie o servidor. Para stack 100% Docker, use `.env.example` e `docker compose up --build` — não misture com `start:dev` no host.

---

## `PrismaClientInitializationError` / cannot reach database

**Causas comuns:**

1. Postgres ainda não está pronto — espere o healthcheck ou use `docker compose up -d --wait postgres redis rabbitmq`.
2. Migração não aplicada — `npx prisma migrate deploy` após o Postgres estar up.
3. `DATABASE_URL` aponta para host/porta errados — confira Trilha B em [PRIMEIROS-PASSOS.md](./PRIMEIROS-PASSOS.md).

**Verificar Postgres:**

```bash
docker compose ps postgres
docker compose logs postgres --tail 20
```

---

## Porta 5432 (ou 6379 / 5672 / 3000) já em uso

**Sintoma:** `docker compose up` falha ao publicar porta ou o app não sobe.

**Correção:** pare o processo que usa a porta ou altere o mapeamento em `docker-compose.yml` (somente local) e ajuste `DATABASE_URL` / `REDIS_URL` / `PORT` no `.env`.

```bash
lsof -i :5432
lsof -i :3000
```

---

## `GET /health` retorna 503 `degraded`

| Campo em `checks` | Causa provável | Ação |
| --- | --- | --- |
| `postgres: error` | DB down ou URL errada | Subir `postgres`, conferir `DATABASE_URL` |
| `redis: error` | Redis down ou URL errada | Subir `redis`, conferir `REDIS_URL` |
| `rabbitmq: error` | `RABBITMQ_MODE=publisher` mas Rabbit parado | `docker compose up -d rabbitmq` ou `RABBITMQ_MODE=off` para teste mínimo |

---

## Erros de TypeScript / `@prisma/client` após clone

**Causa:** client Prisma não gerado.

**Correção:**

```bash
npx prisma generate
```

O `postinstall` do projeto também roda `prisma generate` após `npm ci` / `npm install`.

---

## `npm test` falha no pre-push (Husky)

O hook [`.husky/pre-push`](../../.husky/pre-push) executa `npm test`.

- Testes **não** exigem Docker (mocks nos e2e).
- Exigem `npm ci` e `npx prisma generate` (ou `npm install` com postinstall) antes do primeiro `npm test`.

```bash
npm ci
npm test
```

---

## `npm run start:dev` OK mas eventos não publicam

**Causa:** `RABBITMQ_MODE=off` ou RabbitMQ indisponível.

**Correção:** em `.env`, `RABBITMQ_MODE=publisher` e `RABBITMQ_URL=amqp://guest:guest@localhost:5672` com container `rabbitmq` rodando.

---

## `create-service` — serviço novo não conecta

O script já copia `archetypes/<api|worker>.env.example` para `.env` com `localhost`.

**Não** copie o `.env.example` da raiz do starter (hostnames Docker) para o serviço novo.

Siga [Trilha C em PRIMEIROS-PASSOS.md](./PRIMEIROS-PASSOS.md#trilha-c--validar-um-serviço-criado-com-create-service).

---

## Docker Compose: migrate falha na primeira vez

**Causa:** `npx prisma migrate deploy` antes do Postgres healthy.

**Correção:** `docker compose up -d --wait postgres` (ou `--wait postgres redis rabbitmq`) e só então migrar.

No fluxo full stack, o serviço `migrate` no compose depende de `postgres` com `condition: service_healthy`.

---

## Ainda com problema?

1. Confira [README Quick start](../../README.md#quick-start).
2. Rode `/onboard` no Cursor (atalho Hypatia).
3. Abra issue com: SO, versões (`node -v`, `docker compose version`), trecho do erro e qual trilha (A/B/C) você seguiu.
