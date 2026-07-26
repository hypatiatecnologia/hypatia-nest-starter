# Public release contract

## Status

Hypatia Nest Starter `0.1.x` is an open-source reference template for evaluating and bootstrapping Node.js 22 / NestJS 11 services. It is not an npm package, hosted service, production certification, or automatic update channel.

## Supported use

- Explore secure-by-default NestJS patterns.
- Create an `api` or `worker` snapshot with `create-service`.
- Adapt the examples after completing a project-specific architecture and security review.

Public issues are suitable for reproducible defects and documentation gaps. Pull requests may be considered, but Hypatia makes no triage or response-time commitment.

## Quick evaluation

```bash
nvm use
npm ci
npm run lint:ci
npm run type-check
npm test -- --runInBand
npm run test:scripts
npm run build
```

Docker Compose is needed only for the full local infrastructure flow. See the root README for endpoints and archetypes.

## Proposed GitHub metadata

- Description: `NestJS 11 template for observable, event-driven services with PostgreSQL, Redis and RabbitMQ.`
- Topics: `nestjs`, `typescript`, `nodejs`, `microservices`, `rabbitmq`, `prisma`, `redis`, `starter-template`
- Template repository: enabled
- Social preview: `assets/social-preview.png`
- Security: private vulnerability reporting enabled
- Release: `v0.1.0`

## Derived projects

Each generated service owns its upgrades, secrets, threat model, deployment configuration, and incident response. Follow `CHANGELOG.md` and apply relevant fixes deliberately.
