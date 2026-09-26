#!/usr/bin/env bash
# Hybrid local setup: api archetype .env, infra via Docker, deps + Prisma migrate.
# Usage: npm run setup:local  (then npm run start:dev)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing prerequisite: ${command_name}"
    exit 1
  fi
}

require_command docker
require_command npm
require_command npx

if ! docker compose version >/dev/null 2>&1; then
  echo "Missing prerequisite: Docker Compose v2 (docker compose)"
  exit 1
fi

INFRA_PORTS=(5432 6379 5672)

infra_port_open() {
  local port="$1"
  if command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 "$port" 2>/dev/null
    return
  fi
  (echo >/dev/tcp/127.0.0.1/"$port") 2>/dev/null
}

count_open_infra_ports() {
  local open=0
  for port in "${INFRA_PORTS[@]}"; do
    if infra_port_open "$port"; then
      open=$((open + 1))
    fi
  done
  echo "$open"
}

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

start_local_infra() {
  local open_count
  open_count="$(count_open_infra_ports)"

  if [[ "$open_count" -eq 3 ]]; then
    echo "Local infra already reachable on localhost:5432, :6379, :5672 — reusing shared stack."
    return 0
  fi

  if [[ "$open_count" -gt 0 ]]; then
    echo "Error: ports 5432/6379/5672 partially in use (${open_count}/3 open)."
    echo "Stop conflicting containers (e.g. another service repo) or free those ports, then retry."
    exit 1
  fi

  echo "Starting postgres, redis, rabbitmq (wait until healthy)..."
  docker compose up -d --wait postgres redis rabbitmq
  ensure_host_ports
}

if [[ ! -f .env ]]; then
  cp archetypes/api.env.example .env
  echo "Created .env from archetypes/api.env.example"
else
  echo ".env already exists — not overwriting (use archetypes/api.env.example if connections fail)"
fi

start_local_infra

if [[ -f .nvmrc ]]; then
  echo "Tip: run 'nvm use' if Node version does not match .nvmrc"
fi

npm ci
npx prisma generate
npx prisma migrate deploy

echo ""
echo "Setup complete. Start the API: npm run start:dev"
echo "Verify: curl -s http://localhost:3000/health"
