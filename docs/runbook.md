# Runbook — prompt-versioning-ab-testing
> Last updated: 2026-08-29

## Quick Start
```bash
docker-compose up -d --build
```
API runs on `http://localhost:4002`.
Dashboard runs on `http://localhost:8082`.

## Environment Variables
| Variable | Default | Purpose |
|---|---|---|
| DB_HOST | `postgres` | Postgres connection |
| DB_NAME | `prompts` | Postgres DB name |

## Common Failure Modes
| Symptom | Cause | Fix |
|---|---|---|
| API crash | Postgres not ready | Ensure `depends_on` wait script is active or restart server |


---

## Release Runbook

### Release Trigger
Tag push matching `v*.*.*` (e.g., `v0.1.0`).

### Automated Pipeline Stages
1. **Quality & Validation Gate:** Validates policy syntax, manifest schemas, and configuration integrity.
2. **Distribution Packaging:** Bundles clean production manifests into `prompt-versioning-ab-testing-<tag>.tar.gz` and calculates SHA256 checksums.
3. **Syft Source SBOM:** Generates `sbom.spdx.json` adhering to SPDX 2.3 standard.
4. **GitHub Release:** Publishes release assets and release notes.

### Verification
```bash
gh release view v0.1.0 --repo SumitDalavi/prompt-versioning-ab-testing
gh release download v0.1.0 --repo SumitDalavi/prompt-versioning-ab-testing --pattern "checksums.txt"
```

### Failure Modes & Remediation
- **Linter / Test Failure:** Inspect policy syntax, configurations, or module arguments locally before tagging.
- **Checksum Mismatch:** Ensure file was completely downloaded without network truncation.
