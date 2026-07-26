# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| Latest `0.1.x` release and `main` | Yes |
| Older snapshots | No |

This repository distributes a template, not a runtime service or npm package. A project created with `create-service` is an independent snapshot and does not receive fixes automatically. Owners of derived services must monitor releases and deliberately apply relevant changes.

## Report a vulnerability

Use GitHub's **Report a vulnerability** form in the Security tab. It creates a private advisory visible to the Hypatia maintainers. Do not open a public issue with exploit details, credentials, or personal data.

Include the affected revision, reproduction steps, likely impact, and any suggested mitigation. Hypatia will evaluate reports according to available maintainer capacity; this policy does not promise an acknowledgement or remediation deadline.

## Baseline for derived services

- Replace every example API key, JWT secret, database password, and broker credential.
- Configure issuer, audience, proxy trust, CORS, rate limits, and secret management for the deployment.
- Keep runtime dependency, secret, filesystem, and container scans green.
- Review the application threat model and authorization policy; the examples are not a production certification.
- Never commit `.env` or deployment credentials.
