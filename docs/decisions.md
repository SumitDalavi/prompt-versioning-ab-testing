# Decisions

## ADR-001: PostgreSQL over MongoDB for Versioning
**Date:** 2026-08-29  
**Status:** Accepted

**Context:**  
Git-like version control requires tracking linear history, commits, and structured relationships (Prompt -> Commit -> Rollout Rule).

**Decision:**  
We use PostgreSQL instead of MongoDB.

**Consequences:**  
- ✅ We can use relational foreign keys to enforce integrity between prompt tags and commits.
- ✅ ACID transactions ensure prompt rollouts don't leave the system in a split state.

## ADR-002: Progressive Credential Loading (PCL) Architecture
- **Context:** Production hardening required live backends (PostgreSQL, Redis, OpenAI, Anthropic), but removing mocks would break CI pipelines and create high developer onboarding friction.
- **Decision:** Implement Progressive Credential Loading. Keep in-memory and local mock heuristics as the default safe baseline, while wrapping external integrations in auto-promoting factory adapters triggered by environment variables.
- **Consequences:** 
  - *Pros:* 100% CI pass rate without requiring external secrets; zero setup friction for new contributors; progressive upgrade to production clusters.
  - *Cons:* Adds lightweight factory abstraction layers and runtime credential detection logic.
