# Changelog

## [2026-08-29] — Phase 2 Evidence
### Added
- Created `tests/e2e/test_postgres_integration.sh` to validate Postgres A/B routing.
- Standardized documentation (`runbook.md`, `decisions.md`, `ARCHITECTURE.md`).
- Added maturity badge and mock boundaries to `README.md`.
### Changed
- Replaced MongoDB references in README with PostgreSQL to match infrastructure.


---

## [v0.1.0] — 2026-10-20
### Added
- **Release Automation:** Added `.github/workflows/release.yml` with automated catalog validation, tarball packaging, and SPDX SBOM generation.
- **Supply Chain Security:** Generated Anchore Syft SPDX JSON SBOM and cryptographic SHA-256 checksums.
- **Release Verification:** Added release verification documentation, badges, and operational runbook.
