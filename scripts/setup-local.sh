#!/usr/bin/env bash
# Hybrid local setup: api archetype .env, infra via Docker, deps + Prisma migrate.
# Usage: npm run setup:local  (then npm run start:dev)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

host_port_published() {
  local service="$1"
  local container_port="$2"
  docker compose port "$service" "$container_port" 2>/dev/null | grep -q .
}

ensure_host_ports() {
  local recreated=0
  for mapping in postgres:5432 redis:6379 rabbitmq:5672; do
    local service="${mapping%%:*}"
    local port="${mapping##*:}"
    if ! host_port_published "$service" "$port"; then
      recreated=1
    fi
  done
  if [[ "$recreated" -eq 1 ]]; then
    echo "Host port mapping missing — recreating infra containers..."
    docker compose up -d --force-recreate postgres redis rabbitmq
    docker compose up -d --wait postgres redis rabbitmq
  fi
}

if [[ ! -f .env ]]; then
  cp archetypes/api.env.example .env
  echo "Created .env from archetypes/api.env.example"
else
  echo ".env already exists — not overwriting (use archetypes/api.env.example if connections fail)"
fi

echo "Starting postgres, redis, rabbitmq (wait until healthy)..."
docker compose up -d --wait postgres redis rabbitmq
ensure_host_ports

if [[ -f .nvmrc ]]; then
  echo "Tip: run 'nvm use' if Node version does not match .nvmrc"
fi

npm ci
npx prisma generate
npx prisma migrate deploy

echo ""
echo "Setup complete. Start the API: npm run start:dev"
echo "Verify: curl -s http://localhost:3000/health"
