# DEPLOYMENT, INFRASTRUCTURE & RUNTIME OPERATIONS

## Project: SentinelMCP — Autonomous AI Agent Security Operations Center & Zero-Trust MCP Firewall
**Document Version:** 1.0.0  
**Date:** October 30, 2026  
**Status:** Approved Deployment Blueprint  
**Primary Platform:** NitroCloud (`nitrostack.ai`)  
**Fallback Platform:** Docker / Node.js Containerized Hosting  

---

## 1. DEPLOYMENT TOPOLOGY & ENVIRONMENTS

SentinelMCP is designed for multi-target deployment, excelling both in local development mode (paired with NitroStudio desktop IDE) and live cloud production on **NitroCloud**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      SENTINEL DEPLOYMENT TIERS                         │
├─────────────────────┬───────────────────┬──────────────────────────────┤
│ Tier 1: Local Dev   │ Tier 2: Staging   │ Tier 3: NitroCloud Prod      │
│ • nitrostack dev    │ • Local Pack Test │ • Git-triggered deploy       │
│ • Dual hot-reload   │ • npm run build   │ • Scale-to-zero serverless   │
│ • NitroStudio test  │ • E2E attack test │ • Automated SSL/TLS 1.3      │
└─────────────────────┴───────────────────┴──────────────────────────────┘
```

---

## 2. NITROCLOUD PRODUCTION DEPLOYMENT WORKFLOW

### 2.1 Git-Triggered Deployment Pipeline
1. **Repository Push:** Code is pushed to the verified GitHub repository branch (`main`).
2. **NitroCloud Build Engine:** Detects NitroStack project manifest (`package.json`), automatically installs root dependencies and `src/widgets/` dependencies via `nitrostack install`.
3. **Optimized Compilation:** Executes `nitrostack build`, generating production artifacts:
   - MCP Server bundle in `dist/`.
   - Next.js Generative UI static & SSR output in `src/widgets/.next/`.
4. **Serverless Provisioning:** Deploys containerized instance with automatic scale-to-zero compute (saving quota when idle) and sub-second scale-up upon receiving JSON-RPC tool requests.
5. **SSL & Domain Termination:** Issues automatic Let's Encrypt TLS 1.3 certificate for the custom domain (`https://sentinel-mcp.nitrostack.app`).

### 2.2 Manual CLI Deployment (`nitrostack pack`)
If manual bundle upload is preferred:
```bash
# 1. Install all dependencies across server and widgets
npx @nitrostack/cli install

# 2. Compile production build
npx @nitrostack/cli build

# 3. Create optimized zip bundle (excluding node_modules and dev artifacts)
npx @nitrostack/cli pack
# Outputs: dist/sentinel-mcp-bundle.zip
```

---

## 3. ENVIRONMENT VARIABLES & SECRETS CONFIGURATION

All environment variables must be declared in a local `.env` file that is strictly git-ignored:

```ini
# ==============================================================================
# SENTINEL MCP RUNTIME CONFIGURATION
# ==============================================================================
NODE_ENV=production
PORT=3000
WIDGETS_PORT=3001
HOST=0.0.0.0

# ==============================================================================
# NITROSTACK & MODEL ROUTER SETTINGS
# ==============================================================================
NITRO_API_KEY=nitro_live_your_hackathon_token_here
NITRO_STUDIO_ENABLED=true
MCP_TRANSPORT=sse

# ==============================================================================
# SECURITY ENGINE CONFIGURATION
# ==============================================================================
DLP_STRICT_MODE=true
MAX_PAYLOAD_SIZE_KB=500
PROMPT_INJECTION_THRESHOLD=70
FAIL_CLOSED=true
DATA_DIR=./data

# ==============================================================================
# OPTIONAL INTEGRATION KEYS (Free Tier)
# ==============================================================================
GITHUB_TOKEN=ghp_optional_token_for_rate_limits
```

---

## 4. HEALTH CHECK & MONITORING

### 4.1 Health Check Endpoint (`GET /health`)
Exposed on the core HTTP server:
```http
GET /health HTTP/1.1
Host: localhost:3000
```

**Response (`200 OK`):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 1428.5,
  "mcp": {
    "tools_registered": 6,
    "resources_registered": 3,
    "prompts_registered": 2,
    "widgets_registered": 2
  },
  "security": {
    "total_inspections": 342,
    "total_redactions": 14,
    "total_blocked_attacks": 3,
    "active_quarantines": 1
  },
  "memory": {
    "rss_mb": 48.2,
    "heap_used_mb": 26.8
  }
}
```

### 4.2 Real-Time Observability & SSE Log Streaming
* Administrators can inspect live Server-Sent Events via `GET /sse` or by subscribing to the MCP resource `sentinel://audit-feed/live`.
* NitroCloud provides built-in SSE log streaming through the web console for live container performance monitoring.

---

## 5. ZERO FINANCIAL COST VERIFICATION

* **Compute:** Operates within the NitroCloud Hackathon Pro Tier allocation (zero billing charges).
* **Models:** Uses sponsored 1.5M participant tokens routed via NitroStack Router.
* **Storage:** Local lightweight atomic file storage requiring zero external paid database instances.
* **Auto-Charge:** Confirm that "Auto-charge overages" remains permanently disabled in the NitroStack account dashboard.
