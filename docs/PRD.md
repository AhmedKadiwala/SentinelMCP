# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Project: SentinelMCP — Autonomous AI Agent Security Operations Center & Zero-Trust MCP Firewall
**Document Version:** 1.0.0  
**Date:** October 30, 2026  
**Status:** Implementation-Ready Specification  
**Author:** Principal Product Manager & Senior Technical Product Owner  
**Platform:** NitroStack Framework (`@nitrostack/core`, `@nitrostack/widgets`, `@nitrostack/cli`)  
**Target Hackathon:** NitroStack × MCP To The Moon at Fronthyre  

---

## 1. PRODUCT OVERVIEW

### 1.1 Vision & Positioning
**SentinelMCP** is the first protocol-native runtime firewall and AI-native Security Operations Center (SOC) copilot engineered specifically for the **Model Context Protocol (MCP)**. As enterprises transition from passive chat interfaces to autonomous tool-calling agents with direct access to production databases, cloud infrastructure, and private APIs, SentinelMCP provides the missing zero-trust defense layer.

It operates seamlessly as a security-enforcing MCP server and transparent proxy gateway, intercepting tool calls in real time to scrub sensitive credentials, neutralize prompt injection attacks, enforce role-based access control (RBAC), and surface interactive Generative UI widgets (`@nitrostack/widgets`) directly in the developer or analyst workflow.

### 1.2 Core Product Principles
1. **Zero-Trust by Default:** Never trust an agent prompt or tool parameter, regardless of whether it originates from a human user, an LLM, or a third-party server return.
2. **Invisible Latency:** Security analysis must execute in sub-50 milliseconds to preserve natural, interactive agent execution loops.
3. **Fail-Closed Architecture:** If an inspection pipeline or external dependency fails, sensitive tool calls are blocked, never executed blindly.
4. **Human-in-the-Loop Supremacy:** High-risk actions (quarantines, overrides, destructive operations) must present clear, actionable Generative UI widgets allowing humans to make the final determination.
5. **Native Protocol Alignment:** Adhere strictly to the Model Context Protocol 2024-11-05 JSON-RPC specification, ensuring 100% interoperability with NitroStudio, Cursor, Claude Desktop, and enterprise MCP clients.

---

## 2. USER PERSONAS & ROLE-BASED ACCESS CONTROL (RBAC)

### 2.1 Personas Definition

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            USER PERSONAS MATRIX                             │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ Persona              │ Primary Focus        │ Key Interactions              │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ Elena Rostova        │ CISO / DevSecOps     │ Defines zero-trust policies,  │
│ (Security Admin)     │ Compliance & Gov     │ reviews SOC2 audit logs,      │
│                      │                      │ approves global overrides     │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ Marcus Chen          │ Principal AI Eng     │ Scans MCP server manifests,   │
│ (Platform Developer) │ Architecture & Tools │ registers tools, inspects     │
│                      │                      │ payload diffs in NitroStudio  │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ David Vance          │ SOC Incident Analyst │ Monitors live threat radar,   │
│ (SecOps Analyst)     │ Incident Response    │ quarantines rogue tools,      │
│                      │                      │ triggers incident runbooks    │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

### 2.2 Permissions Matrix

| Capability / Action | Security Admin (Elena) | Platform Developer (Marcus) | SecOps Analyst (David) | Untrusted Agent |
|:---|:---:|:---:|:---:|:---:|
| `scan_mcp_server_manifest` | Full | Full | Read-Only | Denied |
| `inspect_payload_safety` | Full | Full | Full | Automated |
| `redact_sensitive_context` | Full | Full | Full | Automated |
| `quarantine_rogue_tool` | Full | Denied | Full | Denied |
| `unquarantine_tool` | Full (MFA) | Denied | Denied | Denied |
| `enforce_least_privilege_policy` | Full | Read-Only | Read-Only | Denied |
| Read `sentinel://audit-feed/live` | Full | Read (Filtered) | Full | Denied |
| Read `sentinel://policies/active` | Full | Read | Read | Denied |
| Execute High-Risk Tool Override | Full | Denied | Denied | Denied |

---

## 3. FUNCTIONAL REQUIREMENTS (FR-001 TO FR-018)

### 3.1 Core Inspection & Defense

#### FR-001: Real-Time Tool Call Interception
* **Description:** The system must intercept every JSON-RPC `tools/call` message before execution using a NitroStack Interceptor (`@UseInterceptors(SentinelInterceptor)`).
* **System Behaviour:** Extracts tool name, parameters, caller metadata, and session tokens. Passes arguments to the sanitization and risk scoring pipeline. If the risk score is below the rejection threshold (<70), allows execution; otherwise, blocks execution and triggers the interactive Generative UI widget.
* **Input:** Standard MCP `CallToolRequest` payload.
* **Output:** Either forwarded tool execution result or standardized MCP JSON-RPC Error (`code: -32001`, `message: "Blocked by SentinelMCP Zero-Trust Policy"`).

#### FR-002: High-Entropy Credential & Secret Scrubbing (DLP Engine)
* **Description:** The system must inspect all string parameters in tool calls for sensitive enterprise secrets and credentials.
* **Supported Patterns:**
  - AWS Access Keys (`AKIA[0-9A-Z]{16}`) and Secret Keys.
  - GitHub Personal Access Tokens (`ghp_[a-zA-Z0-9]{36}`, `gho_`, `github_pat_`).
  - Stripe Secret Keys (`sk_test_[0-9a-zA-Z]{24}`).
  - Generic High-Entropy API Keys (`Bearer [A-Za-z0-9_\-\.]{32,}`).
  - Private Keys (`-----BEGIN RSA PRIVATE KEY-----`).
* **System Behaviour:** Replaces matched tokens with semantic placeholders (e.g., `[REDACTED_AWS_KEY]`, `[REDACTED_GITHUB_TOKEN]`) before tool execution or context serialization.
* **Error State:** If scrubbing encounters malformed non-UTF8 buffers, sanitizes to base64 or flags as an unparseable anomaly.

#### FR-003: Personally Identifiable Information (PII) Masking
* **Description:** The system must detect and redact common PII entities (Email addresses, US Social Security Numbers, Credit Card numbers with Luhn validation).
* **System Behaviour:** Masks sensitive strings with compliant tokens (e.g., `[REDACTED_EMAIL]`, `[REDACTED_CARD_NUMBER]`).

#### FR-004: Semantic & Heuristic Prompt Injection Defense
* **Description:** The system must score tool arguments for contextual prompt injections, jailbreaks, and destructive commands.
* **Detection Vectors:**
  - Delimiter and instruction overriding (e.g., `"Ignore previous instructions"`, `"System prompt override"`).
  - Destructive SQL injection keywords (e.g., `DROP TABLE`, `TRUNCATE`, `UNION SELECT --`).
  - OS command injection escapes (e.g., `; rm -rf`, `| /bin/sh`, `$(curl ...)`).
  - Tool description poisoning attempts.
* **Scoring:** Outputs a normalized integer Risk Score between `0` (Completely Safe) and `100` (Catastrophic Attack).

#### FR-005: Risk Level Categorization
* **Tiers:**
  - `SAFE` (0–39): Normal tool operation. Execute silently and log.
  - `WARNING` (40–69): Suspicious patterns or PII detected. Execute with redacted secrets, log warning in audit stream.
  - `CRITICAL` (70–100): Direct prompt injection, destructive command, or critical API key exfiltration detected. Intercept and block execution immediately; mount Generative UI Threat Radar widget for human review.

### 3.2 Manifest Auditing & Tool Governance

#### FR-006: MCP Server Manifest Security Scanner
* **Description:** The system must provide a dedicated MCP tool (`scan_mcp_server_manifest`) that audits a target MCP server's exposed tools and JSON schemas against the OWASP MCP Top 10 vulnerabilities.
* **Checks:**
  - Detects oversized or excessively permissive input schemas.
  - Scans natural language tool descriptions for hidden prompt injection payloads (Tool Poisoning - OWASP MCP03).
  - Flags dangerous tool names (e.g., `exec_shell`, `eval_code`, `raw_query`) lacking security guards.
* **Output:** Structured JSON report with a letter grade (`A`, `B`, `C`, `F`), vulnerability breakdown, and remediation advice.

#### FR-007: Active Quarantine Engine
* **Description:** The system must provide an administrative tool (`quarantine_rogue_tool`) that dynamically sandboxes or bans a tool from execution across all agent sessions.
* **System Behaviour:** Adds the tool identifier to an in-memory and persisted `QuarantineRegistry`. Subsequent tool call attempts return immediate access denial without invoking the backend service.

#### FR-008: Least-Privilege Policy Generation & Enforcement
* **Description:** The system must provide a tool (`enforce_least_privilege_policy`) that accepts an agent role and automatically restricts tool access to safe read operations, requiring explicit human approval tokens for write or delete operations.

### 3.3 Generative UI & Observability

#### FR-009: Interactive Threat Radar Widget
* **Description:** The system must implement a Next.js Generative UI client component (`threat-radar-widget`) built with `@nitrostack/widgets` and TailwindCSS.
* **Component Features:**
  - Live animated visual radar displaying intercepted tool calls classified by risk level.
  - Dynamic risk gauge (0–100) with color-coded status (Green, Yellow, Crimson).
  - Breakdown of detected threats (e.g., "AWS Key Detected", "SQL Drop Detected").
  - Embedded interactive button: `"Quarantine Tool"` that triggers the quarantine action directly from the widget.

#### FR-010: Side-by-Side Payload Diff Widget
* **Description:** The system must implement an interactive Generative UI component (`payload-diff-widget`) showing code comparisons.
* **Component Features:**
  - Left pane: Raw inbound payload showing the attacker's/agent's dangerous parameters highlighted in red.
  - Right pane: Sanitized outbound payload showing redacted secrets in green.
  - Summary metadata: Latency, character count reduction, and threat classification.

#### FR-011: Live Audit Feed Stream Resource
* **Description:** The system must expose a standard MCP resource endpoint (`sentinel://audit-feed/live`).
* **System Behaviour:** Streams real-time JSON log entries via Server-Sent Events (SSE). Each log contains: `id`, `timestamp`, `agentId`, `toolName`, `riskScore`, `verdict` (`ALLOWED`, `REDACTED`, `BLOCKED`), and `sanitizedParams`.

#### FR-012: Active Policies Resource
* **Description:** The system must expose an MCP resource endpoint (`sentinel://policies/active`) returning the current active RBAC rules, DLP regex patterns, and blacklist registries in JSON format.

### 3.4 Automated Workflows & Prompts

#### FR-013: Incident Triage Prompt Template
* **Description:** The system must expose an MCP prompt (`triage_security_incident`) with argument `incidentId`.
* **System Behaviour:** Formulates an agent instruction to query recent audit logs, identify the originating IP/agent, assess the blast radius, and generate a recommended mitigation plan.

#### FR-014: SOC2 Compliance Audit Report Prompt
* **Description:** The system must expose an MCP prompt (`generate_soc2_compliance_report`) with argument `timeWindowHours`.
* **System Behaviour:** Generates a structured Markdown governance audit report summarizing total tool calls, detected injection attempts, redacted secrets, and quarantine actions for compliance review.

---

## 4. NON-FUNCTIONAL REQUIREMENTS (NFRs)

### 4.1 Performance & Latency
* **NFR-PERF-01:** Average tool interception overhead must be **< 35ms** (p95 **< 50ms**) on standard developer hardware.
* **NFR-PERF-02:** Regex and pattern-based secret redaction must process payloads up to 100KB in **< 5ms**.
* **NFR-PERF-03:** The Generative UI widgets (`threat-radar-widget`, `payload-diff-widget`) must mount and render in **< 300ms** inside NitroStudio or web iframe containers.

### 4.2 Reliability & Fault Tolerance
* **NFR-REL-01:** System must maintain **99.9% uptime** during hackathon evaluation.
* **NFR-REL-02:** Fail-Safe Default: If the inspection engine encounters an internal unhandled exception, it must block the tool call and return an informative error rather than allowing uninspected execution.
* **NFR-REL-03:** In-memory registries must serialize to disk periodically to survive server restarts.

### 4.3 Security & Cryptography
* **NFR-SEC-01:** Zero Raw Secret Logging: Redacted secrets must never be written to logs, disk files, or unencrypted resource endpoints.
* **NFR-SEC-02:** Input Validation: All tool arguments must be strictly validated against Zod schemas. Payloads with unparseable or malicious JSON formatting must be rejected with JSON-RPC error `-32700`.
* **NFR-SEC-03:** Transport Security: Live cloud deployments must enforce HTTPS/WSS with TLS 1.3.

### 4.4 Observability & Maintainability
* **NFR-OBS-01:** Structured Logging: All system operations must output structured JSON logs with correlation IDs.
* **NFR-OBS-02:** Health Endpoint: The server must expose a `/health` endpoint returning system status, uptime, and active tool counts.

### 4.5 Accessibility & UX
* **NFR-ACC-01:** UI components must support dark and light mode automatically using CSS variables aligned with NitroStudio theme tokens.
* **NFR-ACC-02:** Interactive buttons must provide clear hover, active, and disabled loading states.

---

## 5. UI/UX REQUIREMENTS & GENERATIVE UI DESIGN

### 5.1 Design Language & Palette
* **Theme Support:** Dark mode native (default), compatible with NitroStudio's zinc/slate color palette.
* **Color Accents:**
  - *Emerald Green (`#10B981`):* Safe score (0–39), clean parameters, successful actions.
  - *Amber Yellow (`#F59E0B`):* Warning score (40–69), redacted secrets, cautious warnings.
  - *Crimson Red (`#EF4444`):* Critical score (70–100), prompt injection, blocked execution, active quarantine.
  - *Indigo Accent (`#6366F1`):* NitroStack framework branding and primary interactive buttons.
* **Typography:** System monospaced font for code diffs (`Fira Code`, `JetBrains Mono`, `Consolas`) and clean sans-serif for dashboard titles (`Inter`).

### 5.2 Widget Specifications (`@nitrostack/widgets`)

#### 1. Threat Radar Widget (`threat-radar-widget`)
```
┌────────────────────────────────────────────────────────────────────────┐
│  🛡️ SENTINEL MCP — THREAT RADAR                       [ CRITICAL: 94 ] │
├────────────────────────────────────────────────────────────────────────┤
│  Tool Name: execute_database_query                                     │
│  Caller:    agent-worker-04 (Claude 3.5 Sonnet)                        │
│  Timestamp: 2026-10-30T15:32:04Z                                       │
├────────────────────────────────────────────────────────────────────────┤
│  THREAT DETECTION MATRIX:                                              │
│  [!] AWS Access Key Detected in parameter 'query'                      │
│  [!] SQL Injection Keyword Detected: 'DROP TABLE customers'            │
│  [!] Prompt Injection Confidence: 96.2%                                │
├────────────────────────────────────────────────────────────────────────┤
│  STATUS: EXECUTION INTERCEPTED & BLOCKED                               │
│                                                                        │
│  [ 🚫 Quarantine Tool ]       [ 📝 View Payload Diff ]   [ ⚠️ Override ]│
└────────────────────────────────────────────────────────────────────────┘
```

#### 2. Payload Diff Widget (`payload-diff-widget`)
```
┌──────────────────────────────────┬──────────────────────────────────┐
│  RAW INBOUND PAYLOAD (MALICIOUS) │  SANITIZED OUTBOUND PAYLOAD      │
├──────────────────────────────────┼──────────────────────────────────┤
│  {                               │  {                               │
│    "query": "SELECT * FROM users │    "query": "SELECT * FROM users │
│    WHERE token='AKIAIOSFODNN7'   │    WHERE token='[REDACTED_AWS]'  │
│    ; DROP TABLE logs; --"        │    /* INJECTION REMOVED */"      │
│  }                               │  }                               │
└──────────────────────────────────┴──────────────────────────────────┘
```

---

## 6. DATA MODELS & LIFECYCLE

```mermaid
erDiagram
    ToolCallAuditRecord ||--o{ ThreatFinding : contains
    ToolCallAuditRecord {
        string id PK
        timestamp createdAt
        string agentId
        string toolName
        int riskScore
        string verdict
        string rawPayloadHash
        json sanitizedPayload
        float executionLatencyMs
    }
    ThreatFinding {
        string id PK
        string auditRecordId FK
        string threatType
        string severity
        string patternMatched
        string description
    }
    SecurityPolicyRule {
        string id PK
        string roleName
        string allowedTools
        boolean requireHumanApproval
        json parameterConstraints
    }
    QuarantineRegistry {
        string toolName PK
        string quarantinedBy
        timestamp quarantinedAt
        string reason
        boolean isActive
    }
```

### Data Retention & Lifecycle
- **Audit Records:** Stored in circular in-memory buffer (latest 1,000 records) and flushed to local persistent JSON file storage (`data/audit_log.json`).
- **Quarantine Registry:** Persisted in `data/quarantine_registry.json` for persistence across process restarts.
- **Privacy:** Payloads are hashed with SHA-256 for non-repudiation; sensitive tokens are permanently scrubbed before memory storage.

---

## 7. EXTERNAL INTEGRATIONS

| External Service / API | Integration Type | Auth Method | Rate Limits | Fallback Strategy |
|:---|:---|:---|:---|:---|
| **GitHub Security Advisory REST API** | REST API (`api.github.com/advisories`) | Public / Bearer GitHub Token | 60 req/hr (unauth) / 5,000 (auth) | Cached local top 50 AI package vulnerability definitions |
| **NIST NVD CVE API** | REST API (`services.nvd.nist.gov/rest/json/cves/2.0`) | Public HTTP GET | 5 req/30 sec | Local static vulnerability catalog |
| **TruffleHog Regex Rule Set** | Native compiled regex library | Local execution | Unlimited / Zero API cost | High-performance compiled ECMAScript RegExp patterns |

---

## 8. MVP PRIORITISATION (P0 TO P3)

* **P0 — Critical for Hackathon Submission (October 30 - November 1):**
  - Full `@nitrostack/core` MCP server runtime setup.
  - Interceptor for tool calls (`SentinelInterceptor`).
  - Secret redaction pipe (AWS, GitHub, Stripe, PII).
  - Risk scoring engine (heuristic + prompt injection checks).
  - Core tools: `inspect_payload_safety`, `redact_sensitive_context`, `quarantine_rogue_tool`.
  - Next.js Generative UI widgets: `threat-radar-widget` and `payload-diff-widget`.
  - Live resource: `sentinel://audit-feed/live`.
  - Prompt templates: `triage_security_incident` and `generate_soc2_compliance_report`.
  - NitroCloud deployment bundle and local NitroStudio verification.
* **P1 — Important Enhancements:**
  - `scan_mcp_server_manifest` tool with live GitHub Advisory integration.
  - Least-privilege policy generation (`enforce_least_privilege_policy`).
  - Active policies resource: `sentinel://policies/active`.
* **P2 — Optional Stretch Goals:**
  - Voice-assisted alert narration for NitroStudio audio mode.
  - Multi-tenant client API key dashboard.
* **P3 — Future Post-Hackathon Roadmap:**
  - Automated enterprise Slack/Teams incident webhooks.
  - Hardware Security Module (HSM) key isolation.

---

## 9. TRACEABILITY MATRIX (BRD TO PRD)

| PRD Requirement ID | PRD Feature Name | Corresponding BRD ID | Priority | Test Verification Method |
|:---|:---|:---:|:---:|:---|
| **FR-001** | Tool Call Interceptor | BR-001 | P0 | Interceptor test suite verifying call interception |
| **FR-002** | Credential Scrubbing (DLP) | BR-002 | P0 | Pattern matching unit test with 10+ key variants |
| **FR-003** | PII Redaction | BR-002 | P0 | Regex test for emails, SSNs, credit cards |
| **FR-004** | Prompt Injection Scoring | BR-003 | P0 | Threat scoring suite with adversarial payloads |
| **FR-005** | Risk Categorization | BR-003 | P0 | Boundary condition tests for Safe/Warn/Critical |
| **FR-006** | Manifest Scanner Tool | BR-005 | P1 | Tool test evaluating a simulated MCP server manifest |
| **FR-007** | Active Quarantine Engine | BR-006 | P0 | Functional test blocking a quarantined tool |
| **FR-008** | Least-Privilege Policies | BR-004 | P1 | RBAC guard permission verification test |
| **FR-009** | Threat Radar Widget | BR-007 | P0 | Visual component render and button click test |
| **FR-010** | Payload Diff Widget | BR-008 | P0 | Visual side-by-side component test |
| **FR-011** | Live Audit Feed Resource | BR-009 | P0 | SSE subscription test verifying log events |
| **FR-012** | Active Policies Resource | BR-009 | P1 | Resource read test returning JSON schema |
| **FR-013** | Incident Triage Prompt | BR-010 | P1 | Prompt execution test returning runbook |
| **FR-014** | SOC2 Compliance Prompt | BR-011 | P1 | Prompt execution test returning markdown audit |
| **NFR-PERF-01** | Latency Overhead < 50ms | BR-013 | P0 | Performance benchmark measuring pipeline time |
| **NFR-SEC-01** | Zero Raw Secret Logging | BR-008 | P0 | Disk log inspection test verifying no leaked tokens |

---

### PRODUCT MANAGEMENT SIGN-OFF
The PRD is complete, authoritative, and implementation-ready. Proceeding to companion specifications.
