# Multi-stage build — see docker-compose.yml for the full local stack.
#
# Stages:
#   builder   — installs all deps, generates Prisma client, compiles TypeScript
#   prod-deps — installs production dependencies only (no devDependencies)
#   runner    — production image with dist/ + pruned node_modules
#
# npm ci runs with --ignore-scripts (supply-chain hardening); prisma generate
# is invoked explicitly in the builder stage instead of via postinstall.

FROM node:22-bookworm-slim@sha256:813a7480f28fdadac1f7f5c824bcdad435b5bc1322a5968bbbdef8d058f9dff4 AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npx prisma generate && npm run build

FROM node:22-bookworm-slim@sha256:813a7480f28fdadac1f7f5c824bcdad435b5bc1322a5968bbbdef8d058f9dff4 AS prod-deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

FROM node:22-bookworm-slim@sha256:813a7480f28fdadac1f7f5c824bcdad435b5bc1322a5968bbbdef8d058f9dff4 AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=prod-deps /app/node_modules ./node_modules
# Generated Prisma client (query engine included) from the builder stage.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Liveness only — readiness (dependency reachability) is the orchestrator's
# concern via GET /health/ready; restarting the container does not fix Redis.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS "http://localhost:${PORT:-3000}/health/live" || exit 1

USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
