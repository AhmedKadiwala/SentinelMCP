# ARCHITECTURE DECISION RECORD: ADR-002
## Implementation of Zero-Trust Interceptor Pipeline for Tool Invocations

### Status: APPROVED
**Date:** October 30, 2026  
**Deciders:** Principal Architect, Security Architect, Lead Developer  

---

### Context
In standard Model Context Protocol servers, tool calls are received and directly routed to backend implementation functions. If an agent passes a compromised argument (such as an indirect prompt injection or raw AWS credentials), execution happens before any detection occurs. We needed an architectural mechanism to trap, inspect, scrub, and score tool arguments before target execution without modifying underlying business logic.

### Decision
We implemented a **NitroStack Interceptor & Pipe Pipeline** (`SentinelInterceptor` + `RedactionPipe`):
1. **Pre-Execution Trapping:** The interceptor intercepts the JSON-RPC execution context prior to invoking the `@Tool` handler.
2. **Deterministic Fast-Path Redaction:** `RedactionPipe` executes high-performance ECMAScript regular expressions (TruffleHog pattern bank) to scrub credentials in `< 5ms`.
3. **Risk Scoring Engine:** Evaluates parameters for destructive SQL commands, shell escapes, and prompt injection heuristics, producing a normalized score (0–100).
4. **Fail-Closed Execution:** If the score exceeds 70 or an unhandled parsing error occurs, execution is blocked immediately with standard MCP JSON-RPC error `-32001`.

### Consequences
* **Positive:** Complete separation of concerns between security enforcement and tool functionality. Sub-35ms average latency overhead. Zero possibility of raw credentials reaching target tools.
* **Negative:** Slightly increased complexity in the tool call lifecycle; requires error handling to differentiate business logic errors from security blocks.
