# Public release gate — 2026-07-26

## Current decision

**Pass.** Local application and exposure gates pass, and three consecutive remote CI executions are green. Visibility, template mode, metadata, release, and profile integration are authorized by the owner.

## Local evidence

| Gate | Result |
| --- | --- |
| Lint | Pass |
| Type-check | Pass |
| Nest build | Pass |
| Jest | 17 suites, 110 tests passed |
| Script contracts | 6 tests passed |
| Runtime npm audit | 0 vulnerabilities |
| Full-history gitleaks | 24 commits scanned, no leaks |
| Docker / Trivy | Delegated to GitHub Actions because the local daemon was unavailable |

## Remote executions

| Run | Revision | Result |
| --- | --- | --- |
| [30211622037](https://github.com/hypatiatecnologia/hypatia-nest-starter/actions/runs/30211622037) | `ba4c524` | Pass |
| [30211732379](https://github.com/hypatiatecnologia/hypatia-nest-starter/actions/runs/30211732379) | `c2fd0ff` | Pass |
| [30211864014](https://github.com/hypatiatecnologia/hypatia-nest-starter/actions/runs/30211864014) | `92cb479` | Pass |

All required jobs passed three times consecutively. Any later regression closes the gate again.

## Authorized rollout after gate

1. Merge the reviewed branch into `main`.
2. Change visibility to public and enable template mode.
3. Apply the metadata in `docs/public-release.md`.
4. Enable private vulnerability reporting and upload the social preview.
5. Create release `v0.1.0`.
6. Validate repository contents without authenticated access.
7. Add the repository to Anderson's profile alongside Prosa.
