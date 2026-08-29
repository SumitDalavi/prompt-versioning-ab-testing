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
