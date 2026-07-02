#!/usr/bin/env bash
# Scaffolds a new Hypatia microservice repo from this starter.
#
# Usage:
#   npm run create-service -- athena-core api
#   npm run create-service -- hermes-worker worker
#
# Creates ../<service-name> with the chosen archetype env, renames placeholders,
# and runs git init. Does NOT push to remote — add origin manually.

set -euo pipefail

usage() {
  echo "Usage: $0 <service-name> [api|worker]"
  echo "  api    REST API with RabbitMQ publisher (default)"
  echo "  worker RabbitMQ consumer with minimal HTTP (health only)"
  exit 1
}

[[ $# -lt 1 ]] && usage

SERVICE_NAME="$1"
ARCHETYPE="${2:-api}"
TARGET_DIR="$(cd "$(dirname "$0")/.." && pwd)/../${SERVICE_NAME}"
STARTER_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [[ "$ARCHETYPE" != "api" && "$ARCHETYPE" != "worker" ]]; then
  echo "Invalid archetype: $ARCHETYPE"
  usage
fi

if [[ -e "$TARGET_DIR" ]]; then
  echo "Target already exists: $TARGET_DIR"
  exit 1
fi

echo "Creating ${SERVICE_NAME} (${ARCHETYPE}) at ${TARGET_DIR}"

rsync -a \
  --exclude node_modules \
  --exclude dist \
  --exclude coverage \
  --exclude .env \
  --exclude .git \
  "$STARTER_DIR/" "$TARGET_DIR/"

ENV_SOURCE="${STARTER_DIR}/archetypes/${ARCHETYPE}.env.example"
cp "$ENV_SOURCE" "${TARGET_DIR}/.env.example"
cp "$ENV_SOURCE" "${TARGET_DIR}/.env"

replace() {
  local file="$1"
  if [[ -f "$file" ]]; then
    sed -i.bak \
      -e "s/hypatia-nest-starter/${SERVICE_NAME}/g" \
      -e "s/hypatia-service/${SERVICE_NAME}/g" \
      -e "s/hypatia-worker/${SERVICE_NAME}/g" \
      -e "s/SERVICE_NAME=hypatia-service/SERVICE_NAME=${SERVICE_NAME}/g" \
      -e "s/SERVICE_NAME=hypatia-worker/SERVICE_NAME=${SERVICE_NAME}/g" \
      -e "s/hypatia-service\.events/${SERVICE_NAME}.events/g" \
      -e "s/hypatia-worker\.events/${SERVICE_NAME}.events/g" \
      "$file"
    rm -f "${file}.bak"
  fi
}

replace "${TARGET_DIR}/package.json"
replace "${TARGET_DIR}/.env.example"
replace "${TARGET_DIR}/.env"
replace "${TARGET_DIR}/README.md"

# Unique local API key per service — the shared placeholder always ends up
# forgotten in some .env. The .env.example keeps the placeholder on purpose.
if command -v openssl >/dev/null 2>&1; then
  GENERATED_KEY="$(openssl rand -hex 32)"
  sed -i.bak "s/INTERNAL_API_KEY=change-me-local-dev/INTERNAL_API_KEY=${GENERATED_KEY}/" "${TARGET_DIR}/.env"
  rm -f "${TARGET_DIR}/.env.bak"
  echo "Generated unique INTERNAL_API_KEY in .env"
fi

cd "$TARGET_DIR"
git init -q
echo "Done. Next steps (see docs/onboarding/PRIMEIROS-PASSOS.md — Trilha C):"
echo "  cd ${TARGET_DIR}"
echo "  # Open in Cursor — .cursor/ config included; .env already has localhost hostnames"
echo "  nvm use"
echo "  docker compose up -d --wait postgres redis rabbitmq"
echo "  npm ci"
echo "  npx prisma generate"
echo "  npx prisma migrate deploy"
echo "  npm run start:dev"
echo "  curl -s http://localhost:3000/health"
