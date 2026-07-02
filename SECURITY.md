# Security Policy

## Supported versions

This repository is a **starter template**. Only the latest commit on `main`
receives security fixes. Services scaffolded with `create-service` are
snapshots — they do NOT receive fixes automatically. Track this repo's
`CHANGELOG.md` and apply relevant patches to derived services.

## Reporting a vulnerability

Please do **not** open a public issue for security problems.

- Email: contatodeanderson@gmail.com with subject `[SECURITY] hypatia-nest-starter`
- Include: affected file/endpoint, reproduction steps, and impact assessment.

You will receive an acknowledgement within 72 hours. Coordinated disclosure:
we ask for up to 90 days to ship a fix before public disclosure.

## Baseline expectations for derived services

- Rotate `INTERNAL_API_KEY` and set `ARGUS_JWT_SECRET` (+ `ARGUS_JWT_ISSUER`/
  `ARGUS_JWT_AUDIENCE`) before any deployment.
- Set `TRUST_PROXY` when running behind a gateway/reverse proxy.
- Keep `npm audit --audit-level=high` green in CI (already enforced).
- Never commit `.env` — only `.env.example` and `archetypes/*.env.example`.
