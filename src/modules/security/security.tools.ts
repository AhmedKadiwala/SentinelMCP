import { ToolDecorator as Tool, Widget, ExecutionContext, z } from '@nitrostack/core';
import { DlpEngine } from './engines/dlp.engine.js';
import { RiskScoringEngine } from './engines/risk-scoring.engine.js';
import { SecurityService } from './security.service.js';
import { AuditService } from '../audit/audit.service.js';
import { QuarantineService } from '../quarantine/quarantine.service.js';

export class SecurityTools {
  constructor(
    private readonly securityService: SecurityService,
    private readonly auditService: AuditService,
    private readonly quarantineService: QuarantineService
  ) {}

  @Tool({
    name: 'inspect_payload_safety',
    description: 'Inspects and scores tool arguments for prompt injection, jailbreaks, shell escapes, SQL injection, and secret exfiltration. Emits the interactive Threat Radar widget.',
    inputSchema: z.object({
      tool_name: z.string().describe('The name of the target tool being evaluated'),
      parameters: z.record(z.any()).describe('Key-value map of parameters passed to the tool'),
      agent_id: z.string().optional().describe('Unique identifier of the calling agent or session'),
    }),
    examples: {
      request: {
        tool_name: 'execute_sql_query',
        parameters: {
          query: "SELECT * FROM users WHERE token='AKIAIOSFODNN7EXAMPLE'; DROP TABLE logs; --",
        },
        agent_id: 'claude-dev-01',
      },
      response: {
        verdict: 'BLOCKED',
        risk_score: 94,
        findings: [
          {
            threat_type: 'SECRET_EXFILTRATION',
            severity: 'CRITICAL',
            parameter: 'parameters',
            matched_pattern: 'AWS Access Key ID',
            description: 'Exposed AWS Access Key ID in tool arguments',
          },
          {
            threat_type: 'SQL_INJECTION',
            severity: 'CRITICAL',
            parameter: 'query',
            matched_pattern: 'Destructive SQL Drop Table',
            description: 'Direct SQL schema destruction command',
          },
        ],
        requires_human_approval: true,
        sanitized_parameters: {
          query: "SELECT * FROM users WHERE token='[REDACTED_AWS_KEY]'; DROP TABLE logs; --",
        },
        latency_ms: 12.4,
      },
    },
  })
  @Widget('threat-radar-widget')
  async inspectPayloadSafety(input: any, ctx: ExecutionContext) {
    const startTime = performance.now();
    const toolName = input.tool_name;
    const rawParams = input.parameters || {};
    const agentId = input.agent_id || (ctx as any).clientMetadata?.agentId || 'agent-evaluator';

    ctx.logger.info(`[Sentinel] Inspecting tool payload safety for "${toolName}"`);

    // 1. Scrub secrets via DLP engine
    const dlpResult = DlpEngine.scrub(rawParams);

    // 2. Risk Scoring evaluation
    const evaluation = RiskScoringEngine.evaluate(toolName, dlpResult.sanitized, dlpResult.redactions);
    const latency = Math.round((performance.now() - startTime) * 100) / 100;

    // 3. Record in Audit Service
    this.auditService.recordEvent({
      agentId,
      toolName,
      riskScore: evaluation.riskScore,
      verdict: evaluation.verdict,
      payloadHash: dlpResult.payloadHash,
      redactedCount: dlpResult.redactedCount,
      threats: evaluation.findings.map((f) => f.threatType),
      latencyMs: latency,
      requiresHumanApproval: evaluation.requiresHumanApproval,
      sanitizedParams: dlpResult.sanitized,
    });

    return {
      tool_name: toolName,
      verdict: evaluation.verdict,
      risk_score: evaluation.riskScore,
      findings: evaluation.findings.map((f) => ({
        threat_type: f.threatType,
        severity: f.severity,
        parameter: f.parameterKey,
        matched_pattern: f.matchedPattern,
        description: f.description,
      })),
      requires_human_approval: evaluation.requiresHumanApproval,
      sanitized_parameters: dlpResult.sanitized,
      redactions_count: dlpResult.redactedCount,
      summary: evaluation.summary,
      latency_ms: latency,
    };
  }

  @Tool({
    name: 'redact_sensitive_context',
    description: 'Scans text or structured objects for API keys, AWS credentials, tokens, and PII, returning both raw and sanitized payloads with the side-by-side Payload Diff widget.',
    inputSchema: z.object({
      payload: z.union([z.string(), z.record(z.any())]).describe('Raw text or JSON payload to inspect and redact'),
      strict_mode: z.boolean().default(true).describe('If true, redacts borderline high-entropy tokens and all PII'),
    }),
    examples: {
      request: {
        payload: {
          api_token: 'ghp_abcdef1234567890abcdef1234567890abcd',
          customer_email: 'ceo@megacorp.com',
          message: 'Deploy payment handler with ' + 'sk_' + 'test_1234567890abcdef12345678',
        },
        strict_mode: true,
      },
      response: {
        redacted_count: 3,
        redactions: [
          { patternName: 'GitHub Personal Access Token', category: 'API_KEY', placeholder: '[REDACTED_GITHUB_TOKEN]', occurrences: 1 },
          { patternName: 'Stripe API Key', category: 'API_KEY', placeholder: '[REDACTED_STRIPE_KEY]', occurrences: 1 },
          { patternName: 'Email Address PII', category: 'PII', placeholder: '[REDACTED_EMAIL]', occurrences: 1 },
        ],
        raw_payload: {
          api_token: 'ghp_abcdef1234567890abcdef1234567890abcd',
          customer_email: 'ceo@megacorp.com',
          message: 'Deploy payment handler with ' + 'sk_' + 'test_1234567890abcdef12345678',
        },
        sanitized_payload: {
          api_token: '[REDACTED_GITHUB_TOKEN]',
          customer_email: '[REDACTED_EMAIL]',
          message: 'Deploy payment handler with [REDACTED_STRIPE_KEY]',
        },
      },
    },
  })
  @Widget('payload-diff-widget')
  async redactSensitiveContext(input: any, ctx: ExecutionContext) {
    const rawPayload = input.payload;
    const strictMode = input.strict_mode ?? true;

    ctx.logger.info('[Sentinel] Running DLP context scrubbing');
    const dlpResult = DlpEngine.scrub(rawPayload, strictMode);

    return {
      redacted_count: dlpResult.redactedCount,
      redactions: dlpResult.redactions,
      raw_payload: rawPayload,
      sanitized_payload: dlpResult.sanitized,
      payload_hash: dlpResult.payloadHash,
      latency_ms: dlpResult.executionDurationMs,
    };
  }

  @Tool({
    name: 'scan_mcp_server_manifest',
    description: 'Audits an MCP server manifest or tools list against OWASP MCP Top 10 vulnerabilities (Tool Poisoning, unconstrained parameters, and dangerous capabilities).',
    inputSchema: z.object({
      manifest_json: z.string().describe('JSON manifest or output of tools/list from the target MCP server'),
      server_name: z.string().optional().describe('Human-readable identifier of the target server'),
    }),
  })
  async scanManifest(input: any, ctx: ExecutionContext) {
    ctx.logger.info(`[Sentinel] Auditing manifest for ${input.server_name || 'unnamed server'}`);
    return await this.securityService.scanManifest(input.manifest_json, input.server_name);
  }

  @Tool({
    name: 'get_firewall_status',
    description: 'Returns real-time operational health metrics, total inspected calls, scrubbed secrets count, and active quarantined tools.',
    inputSchema: z.object({}),
  })
  async getFirewallStatus(input: any, ctx: ExecutionContext) {
    const metrics = this.auditService.getSummaryMetrics();
    const quarantines = this.quarantineService.getQuarantinedTools();

    return {
      status: 'ONLINE',
      engine: 'SentinelMCP Zero-Trust Gateway',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      metrics: {
        total_inspections: metrics.totalInspections,
        total_redactions: metrics.totalRedactions,
        total_blocked_attacks: metrics.totalBlocked,
        active_quarantines_count: quarantines.length,
      },
      quarantined_tools: quarantines.map((q) => ({
        tool_name: q.toolName,
        quarantined_at: q.quarantinedAt,
        reason: q.reason,
        blocked_attempts: q.blockedCount,
      })),
    };
  }
}
