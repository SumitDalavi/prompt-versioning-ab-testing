# Architecture — prompt-versioning-ab-testing
> Last updated: 2026-08-29 | Maturity: Partial Prototype
> _Prompt registry and A/B router._

## System Diagram
```mermaid
flowchart TD
    Client(["Upstream Service"])
    API["Prompt Registry API"]
    DB[("PostgreSQL")]

    Client -->|"1. GET /prompt?name=welcome"| API
    API -->|"2. Fetch active A/B split"| DB
    DB -.-> API
    API -->|"3. Return v2 (70%)"| Client
```

## Component Table
| Component | File | Responsibility | Tech |
|---|---|---|---|
| Client UI | `client/` | Admin dashboard | React |
| Server | `server/` | A/B router logic | Node.js |
| Database | `docker-compose.yml` | Stores versions | PostgreSQL |

## Dependency Honesty Table
| Dependency | Status | Notes |
|---|---|---|
| PostgreSQL | **Real** | Migrated from MongoDB/SQLite for transactional integrity. |

## Progressive Credential Loading & Production Architecture (v0.2.0)

This service implements the **Progressive Credential Loading (PCL)** pattern, decoupling development speed from external infrastructure provisioning:

```mermaid
graph LR
    Env[Environment Credentials] -->|Detect Keys & URLs| Detector[Credential Detector]
    Detector -->|No Credentials / Missing| Mock[Mock Mode Factory]
    Detector -->|Valid Credentials Present| Live[Live Provider Factory]
    Mock --> Runtime[Application Core & /health]
    Live --> Runtime
```

### Core Architecture Components
1. **Mode Detection Singleton:** Inspects environment configuration at boot time without hard crashes on missing secrets.
2. **Dual-Mode Factory Wrappers:**
   - **Storage / Cache:** In-process maps or SQLite `:memory:` transparently promote to managed Redis or PostgreSQL when connection strings are supplied.
   - **AI Providers:** Deterministic heuristic generators and local embeddings transparently promote to live OpenAI, Anthropic, or Gemini API clients.
3. **Hot-Reload & Dynamic TLS:** File watchers monitor mounted volume paths (Kubernetes ConfigMaps and Secrets) to update certificates and limit configs atomically without process restarts.
4. **Health & Observability:** The `/health` endpoint exposes real-time runtime mode metadata (`mock` vs `live`) across all backing adapters.
