# Public release gate — 2026-07-26

## Current decision

**Pending remote evidence.** Local application and exposure gates pass. Visibility, template mode, metadata, release, and profile integration are authorized by the owner but must wait for three consecutive green CI executions on the release branch.

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
| 1 | Pending | Pending |
| 2 | Pending | Pending |
| 3 | Pending | Pending |

The gate stays closed until all required jobs pass three times consecutively. Any failure resets the sequence.

## Authorized rollout after gate

1. Merge the reviewed branch into `main`.
2. Change visibility to public and enable template mode.
3. Apply the metadata in `docs/public-release.md`.
4. Enable private vulnerability reporting and upload the social preview.
5. Create release `v0.1.0`.
6. Validate repository contents without authenticated access.
7. Add the repository to Anderson's profile alongside Prosa.
