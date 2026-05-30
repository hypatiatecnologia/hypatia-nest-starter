#!/usr/bin/env bash
# Hybrid local setup: api archetype .env, infra via Docker, deps + Prisma migrate.
# Usage: npm run setup:local  (then npm run start:dev)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  cp archetypes/api.env.example .env
  echo "Created .env from archetypes/api.env.example"
else
  echo ".env already exists — not overwriting (use archetypes/api.env.example if connections fail)"
fi

echo "Starting postgres, redis, rabbitmq (wait until healthy)..."
docker compose up -d --wait postgres redis rabbitmq

if [[ -f .nvmrc ]]; then
  echo "Tip: run 'nvm use' if Node version does not match .nvmrc"
fi

npm ci
npx prisma generate
npx prisma migrate deploy

echo ""
echo "Setup complete. Start the API: npm run start:dev"
echo "Verify: curl -s http://localhost:3000/health"
