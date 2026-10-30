# ARCHITECTURE DECISION RECORD: ADR-001
## Selection of NitroStack Framework & TypeScript for MCP Core Engine

### Status: APPROVED
**Date:** October 30, 2026  
**Deciders:** CTO, Principal Architect, Lead Full-Stack Developer  

---

### Context
We are competing in the **NitroStack × MCP To The Moon Hackathon**. The core requirement is to build a production-quality, technically impressive Model Context Protocol (MCP) application. We needed to choose the primary programming language and framework for building the server, security interceptors, and user-facing components.

### Decision
We selected **TypeScript** and the official **NitroStack Framework** (`@nitrostack/core`, `@nitrostack/cli`, `@nitrostack/widgets`):
1. **First-Class Decorator Support:** `@nitrostack/core` provides clean declarative decorators (`@Tool`, `@Resource`, `@Prompt`, `@Widget`, `@UseGuards`, `@UseInterceptors`) that mirror enterprise architecture (NestJS/Angular) rather than low-level raw protocol boilerplate.
2. **Generative UI Synergy:** `@nitrostack/widgets` is built natively on Next.js/React, allowing bidirectional synchronization between backend tool outputs and rich frontend widgets.
3. **Verified Tooling:** `@nitrostack/cli@1.1.2` is actively installed and verified in our local Node.js v24 environment.
4. **NitroStudio Compatibility:** TypeScript decorators map 1:1 with NitroStudio visual inspection, Ops Canvas, and real-time execution tracing.

### Consequences
* **Positive:** Rapid scaffolding via `nitrostack init`, unified language across backend server and Next.js frontend widgets, compile-time Zod type safety, zero impedance mismatch with NitroCloud deployment.
* **Negative:** Requires dual-port development running both core server (port 3000) and Next.js widget server (port 3001), handled automatically by `nitrostack dev`.
