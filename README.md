# prompt-versioning-ab-testing

> **Maturity:** Functional Prototype
> _Git-like version control system specifically designed for managing and testing iterative changes to LLM prompts._

## Features
- Fully automated workflow.
- Secure, scalable architecture.
- Built-in telemetry and observability.

## Technologies
- Node.js, PostgreSQL

## Getting Started
Ensure you have the required dependencies installed on your system.

```bash
# Setup & Test
npm install
npm test
```

## Architecture
Please see the [Architecture Document](docs/architecture.md) for sequence diagrams and system design details.


## CI & Reliability Updates (August 2026)

- **CI Pipeline Remediation:** Successfully resolved all CI/CD pipeline failures and established baseline CI workflows.
- **Specific Fix:** Added and configured robust GitHub Actions workflows for automated testing, linting, and formatting.
- **Status:** 🟩 Passing


## Mock Boundaries (Honest Scope)

| What | Status | Details |
|---|---|---|
| Registry API | **Real** | Version control logic is fully implemented. |
| Database | **Real** | PostgreSQL stores prompts and commit history. |
| A/B Routing | **Simulated**| Router logic works, but upstream traffic is simulated via tests. |

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md) — System diagram and component details
- [Runbook](docs/runbook.md) — Setup, commands, and expected outputs
- [Decisions](docs/decisions.md) — ADRs for Postgres over MongoDB
- [Changelog](docs/changelog.md) — Change history
