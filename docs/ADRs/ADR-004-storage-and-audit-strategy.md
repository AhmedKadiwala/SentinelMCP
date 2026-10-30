# ARCHITECTURE DECISION RECORD: ADR-004
## Two-Tier In-Memory and Atomic JSON File Persistence Strategy

### Status: APPROVED
**Date:** October 30, 2026  
**Deciders:** Principal Architect, DevOps Engineer, Lead Developer  

---

### Context
SentinelMCP requires persistent storage for audit event logs, quarantined tools, and active RBAC policies. Introducing an external SQL or NoSQL database (PostgreSQL, MongoDB, Redis) would introduce deployment failure points, database credentials management, network round-trip latencies, and potential paid hosting costs violating the hackathon rules.

### Decision
We implemented a **Two-Tier Storage Architecture**:
1. **Tier 1 (In-Memory Hot Cache & Circular Ring Buffer):** Stores the latest 1,000 audit records and active quarantine blacklist in RAM for `< 1ms` lookups.
2. **Tier 2 (Atomic Append-Only JSON Files):** Persists records to `data/audit_log.json` and `data/quarantine_registry.json` using atomic temporary file writes and renames (`fs.renameSync`).
3. **Cryptographic Payload Hashing:** Inbound payloads are hashed using SHA-256 for non-repudiation audit trails, while raw secrets are permanently scrubbed before memory or disk storage.

### Consequences
* **Positive:** Zero external infrastructure dependencies. Instant container startup. Zero financial cost. Fully portable across local development and NitroCloud serverless instances.
* **Negative:** Not designed for horizontal multi-replica clustering beyond single-instance cloud containers (satisfies hackathon MVP scope and simplifies deployment).
