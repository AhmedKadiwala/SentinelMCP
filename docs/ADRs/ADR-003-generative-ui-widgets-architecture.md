# ARCHITECTURE DECISION RECORD: ADR-003
## Decoupled Generative UI Widgets Architecture via `@nitrostack/widgets`

### Status: APPROVED
**Date:** October 30, 2026  
**Deciders:** UI/UX Designer, Principal Architect, Full-Stack Lead  

---

### Context
Standard AI security tools return dry JSON outputs or plain text alerts that are difficult for judges and operators to quickly interpret. To win the hackathon's "Presentation and User Experience" judging pillar, we needed visual, interactive widgets that mount inside modern MCP hosts (NitroStudio, web client) without requiring custom desktop GUI installations.

### Decision
We chose the official **NitroStack Widgets SDK** (`@nitrostack/widgets`):
1. **Next.js 15 Client Components:** Widgets live in `src/widgets/app/[widget-name]/page.tsx` styled with TailwindCSS.
2. **Hook-Based Data Ingestion:** Components use `useWidgetSDK()` to consume structured JSON tool outputs (`getToolOutput<T>()`) reactively.
3. **Interactive Control Loop:** The widget does not merely display data; it features interactive action buttons (e.g., `"Quarantine Tool"`, `"Override Approval"`) that call back into the MCP server.

### Consequences
* **Positive:** Visually stunning Generative UI. Seamless rendering inside NitroStudio's canvas and web hosts. Dark/light mode theme inheritance.
* **Negative:** Next.js build step must be maintained alongside the core backend build.
