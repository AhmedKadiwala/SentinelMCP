# EXTERNAL INTEGRATIONS ARCHITECTURE & API CONTRACTS

## Project: SentinelMCP — Autonomous AI Agent Security Operations Center & Zero-Trust MCP Firewall
**Document Version:** 1.0.0  
**Date:** October 30, 2026  
**Status:** Approved Integration Design  
**Platform:** NitroStack Framework (`@nitrostack/core`)  

---

## 1. INTEGRATION ECOSYSTEM OVERVIEW

SentinelMCP combines high-speed, sub-millisecond local inspection engines with live external vulnerability intelligence feeds. To adhere strictly to the hackathon's zero-cost and high-reliability rules, all external integrations utilize free, open-access public endpoints backed by aggressive local caching and offline fallbacks:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      SENTINEL INTEGRATION ENGINE                       │
├───────────────────────────────┬────────────────────────────────────────┤
│ Local High-Speed Engines      │ Live External Intelligence Feeds       │
│ • TruffleHog Pattern Bank     │ • GitHub Security Advisory REST API    │
│ • OWASP MCP Threat Signatures │ • NIST National Vulnerability Database │
│ • Zero API latency (< 5ms)    │ • Automated LRU Cache & Offline Guard  │
└───────────────────────────────┴────────────────────────────────────────┘
```

---

## 2. GITHUB SECURITY ADVISORY REST API

### 2.1 Overview & Purpose
Used by the `scan_mcp_server_manifest` tool to query known Common Vulnerabilities and Exposures (CVEs) for npm and PyPI dependencies declared by third-party MCP servers.

* **Base URL:** `https://api.github.com/advisories`
* **Protocol:** HTTPS REST / JSON
* **Authentication:** Optional GitHub Personal Access Token (`GITHUB_TOKEN`) via `Authorization: Bearer <TOKEN>`. Supports unauthenticated access for standard rate tiers.
* **Rate Limits:**
  - Authenticated: 5,000 requests per hour.
  - Unauthenticated: 60 requests per hour.

### 2.2 Request Specification
```http
GET /advisories?ecosystem=npm&package=express&severity=critical HTTP/1.1
Host: api.github.com
Accept: application/vnd.github+json
User-Agent: SentinelMCP-Security-Gateway/1.0
```

### 2.3 Response Specification
```json
[
  {
    "ghsa_id": "GHSA-xxxx-xxxx-xxxx",
    "cve_id": "CVE-2024-XXXXX",
    "summary": "Prototype pollution in package-name",
    "severity": "CRITICAL",
    "vulnerabilities": [
      {
        "package": { "ecosystem": "npm", "name": "express" },
        "vulnerable_version_range": "< 4.19.2",
        "first_patched_version": "4.19.2"
      }
    ]
  }
]
```

### 2.4 Caching & Failure Strategy
* **Cache Policy:** Responses are cached in an in-memory LRU cache (`ttl: 3600000ms` - 1 hour).
* **Failure / Rate Limit Fallback:** If the API returns HTTP `403` (rate limit) or `5xx` (outage), SentinelMCP falls back to a bundled local catalog of the top 50 critical AI framework vulnerabilities (`src/modules/security/data/bundled-cves.json`).

---

## 3. NIST NATIONAL VULNERABILITY DATABASE (NVD) API

### 3.1 Overview & Purpose
Provides authoritative CVE intelligence across global software libraries referenced in agent environments.

* **Base URL:** `https://services.nvd.nist.gov/rest/json/cves/2.0`
* **Protocol:** HTTPS REST / JSON
* **Authentication:** Free public access (API key optional for elevated rate limits).
* **Rate Limits:** 5 requests per 30-second window.

### 3.2 Request Specification
```http
GET /rest/json/cves/2.0?keywordSearch=mcp+server&resultsPerPage=5 HTTP/1.1
Host: services.nvd.nist.gov
Accept: application/json
User-Agent: SentinelMCP-Engine/1.0
```

### 3.3 Caching & Failure Strategy
* **Cache Policy:** Responses cached for 6 hours (`ttl: 21600000ms`).
* **Timeout:** Strict 3,000ms network timeout. If exceeded, immediately returns cached or bundled vulnerability findings without stalling the agent loop.

---

## 4. LOCAL TRUFFLEHOG & GITGUARDIAN PATTERN ENGINE

### 4.1 Overview & Purpose
Performs zero-latency, deterministic credential and secret detection across all tool arguments.

* **Engine:** Pre-compiled ECMAScript `RegExp` objects initialized during server startup.
* **Cost:** 100% Free / Local execution.
* **Latency:** < 3 milliseconds per 50KB payload.
* **Supported Signatures:**
  1. AWS Access Keys (`AKIA`, `ABIA`, `ASIA`)
  2. GitHub Personal Access & Fine-Grained Tokens
  3. Stripe Live & Test API Keys
  4. Slack Bot & User OAuth Tokens
  5. Google Cloud / Gemini API Keys (`AIza[0-9A-Za-z-_]{35}`)
  6. OpenAI API Keys (`sk-proj-[A-Za-z0-9_-]{48,}`)
  7. Anthropic API Keys (`sk-ant-[A-Za-z0-9_-]{48,}`)
  8. Private Key Certificate Blocks (RSA, EC, PGP)

---

## 5. INTEGRATION RESILIENCE & HEALTH CHECKS

All external calls are wrapped inside an asynchronous resilience circuit breaker:

```typescript
export async function resilientFetch<T>(
  url: string,
  options: RequestInit,
  fallbackData: T,
  timeoutMs = 3000
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.warn(`[Integrations] External API error: ${response.status} ${response.statusText}`);
      return fallbackData;
    }
    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn(`[Integrations] External API failed or timed out. Falling back to local data.`, error);
    return fallbackData;
  }
}
```
