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
