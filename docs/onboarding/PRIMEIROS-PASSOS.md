# Primeiros passos (~10 min)

Roteiro de **mínimo atrito** para validar o starter e um serviço criado com `create-service`. O [roteiro de 4 semanas](./ONBOARDING.md) continua válido para aprendizado profundo.

Problemas comuns: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

## Pré-requisitos

| Ferramenta | Como verificar |
| --- | --- |
| Node.js 20 | `nvm use` e `node -v` (deve ser v20.x) |
| Docker Compose v2 | `docker compose version` |
| Portas livres | 3000, 5432, 6379, 5672 (e 15672 para a UI do RabbitMQ) |

## Qual `.env` usar

| Cenário | Arquivo de origem | Hostnames em `DATABASE_URL` / `REDIS_URL` |
| --- | --- | --- |
| API no host (`npm run start:dev`) | `archetypes/api.env.example` | `localhost` |
| Stack inteira no Docker | `.env.example` (raiz) | `postgres`, `redis`, `rabbitmq` |
| Serviço após `create-service` | Já copiado para `.env` no novo repo | `localhost` (preset do archetype) |

**Erro típico:** copiar `.env.example` da raiz e rodar `npm run start:dev` no host — o Node não resolve o hostname `postgres`.

---

## Trilha A — Testes sem Docker

Confirma que o clone, dependências e suite Jest estão OK antes de subir infra.

```bash
nvm use
npm ci
npx prisma generate
npm test
```

**Sucesso:** todos os testes passam. Os e2e usam mocks de Postgres/Redis/RabbitMQ — não precisam de containers.

---

## Trilha B — API no ar (starter)

Infra no Docker, Nest no host (fluxo recomendado no dia a dia).

```bash
nvm use
cp archetypes/api.env.example .env
docker compose up -d --wait postgres redis rabbitmq
npm ci
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

Atalho equivalente (após `nvm use`): `npm run setup:local` e depois `npm run start:dev`.

**Validar:**

```bash
curl -s http://localhost:3000/health
curl -H 'x-correlation-id: primeiro-passo' http://localhost:3000/health -v
```

Abra http://localhost:3000/docs/api (Swagger).

**Opcional — publicar evento de exemplo:**

```bash
curl -X POST http://localhost:3000/example/events \
  -H 'Content-Type: application/json' \
  -H 'x-correlation-id: primeiro-passo-evento' \
  -d '{"type":"example.created","payload":{"message":"hello"}}'
```

**Modo ainda mais leve:** em `.env`, defina `RABBITMQ_MODE=off` se quiser só Postgres + Redis na primeira subida (health mostra `rabbitmq: disabled`).

---

## Trilha C — Validar um serviço criado com `create-service`

Mesma prioridade que o starter: o scaffold deve subir com o mesmo fluxo.

No diretório do **starter**:

```bash
npm run create-service -- meu-teste api
```

No **novo repositório** (`../meu-teste`):

```bash
cd ../meu-teste
nvm use
# .env já existe (localhost) — não sobrescreva com .env.example da raiz do starter
docker compose up -d --wait postgres redis rabbitmq
npm ci
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

**Checklist:**

- [ ] `curl -s http://localhost:3000/health` retorna `status: ok`
- [ ] Swagger abre em http://localhost:3000/docs/api
- [ ] `.cursor/` presente no novo repo
- [ ] `npm test` passa no novo repo

Remova `ExampleModule` quando começar features reais.

---

## Stack só no Docker

Sem `start:dev` no host:

```bash
cp .env.example .env
docker compose up --build
```

Use quando quiser validar imagem + migrate + API containerizados.

---

## Próximos passos

| Objetivo | Documento |
| --- | --- |
| Referência diária | [GUIA-RAPIDO.md](./GUIA-RAPIDO.md) |
| Aprendizado 4 semanas | [ONBOARDING.md](./ONBOARDING.md) |
| Setup via Cursor | command `/onboard` |
