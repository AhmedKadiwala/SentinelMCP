import { InterceptorInterface, ExecutionContext, Injectable } from '@nitrostack/core';
import { DlpEngine } from '../engines/dlp.engine.js';
import { RiskScoringEngine } from '../engines/risk-scoring.engine.js';
import { QuarantineService } from '../../quarantine/quarantine.service.js';
import { AuditService } from '../../audit/audit.service.js';

@Injectable()
export class SentinelInterceptor implements InterceptorInterface {
  constructor(
    private readonly quarantineService: QuarantineService,
    private readonly auditService: AuditService
  ) {}

  async intercept(context: ExecutionContext, next: () => Promise<unknown>): Promise<unknown> {
    const startTime = performance.now();
    const toolName = context.toolName || 'unknown_tool';
    const rawArgs = (context as any).input || (context as any).args || {};
    const agentId = (context as any).clientMetadata?.agentId || 'default-agent';

    // 1. Pre-Check: Active Quarantine Blacklist
    if (this.quarantineService.isQuarantined(toolName)) {
      this.quarantineService.recordBlockedAttempt(toolName);
      const latency = Math.round((performance.now() - startTime) * 100) / 100;

      this.auditService.recordEvent({
        agentId,
        toolName,
        riskScore: 100,
        verdict: 'BLOCKED',
        payloadHash: DlpEngine.hashPayload(rawArgs),
        redactedCount: 0,
        threats: ['TOOL_QUARANTINED'],
        latencyMs: latency,
        requiresHumanApproval: true,
        sanitizedParams: rawArgs,
      });

      throw new Error(`[SentinelMCP] Access Denied: Tool "${toolName}" is actively quarantined by Security Operations.`);
    }

    // 2. Deterministic Secret Scrubbing (DLP Engine)
    const dlpResult = DlpEngine.scrub(rawArgs);

    // 3. Risk Evaluation (Threat & Injection Scoring)
    const riskEval = RiskScoringEngine.evaluate(toolName, dlpResult.sanitized, dlpResult.redactions);
    const latency = Math.round((performance.now() - startTime) * 100) / 100;

    // 4. Critical Risk Gate (Fail-Closed)
    if (riskEval.verdict === 'BLOCKED') {
      this.auditService.recordEvent({
        agentId,
        toolName,
        riskScore: riskEval.riskScore,
        verdict: 'BLOCKED',
        payloadHash: dlpResult.payloadHash,
        redactedCount: dlpResult.redactedCount,
        threats: riskEval.findings.map((f) => f.threatType),
        latencyMs: latency,
        requiresHumanApproval: true,
        sanitizedParams: dlpResult.sanitized,
      });

      throw new Error(
        `[SentinelMCP Zero-Trust Firewall] Tool execution blocked! Risk Score: ${riskEval.riskScore}/100. ` +
        `Detected: ${riskEval.findings.map((f) => f.description).join('; ')}`
      );
    }

    // 5. Mutate parameters in-place to ensure target tool only receives sanitized parameters
    if (context && typeof (context as any).input === 'object') {
      (context as any).input = dlpResult.sanitized;
    }

    // 6. Forward Execution
    let result: any;
    try {
      result = await next();
    } catch (err: any) {
      const errLatency = Math.round((performance.now() - startTime) * 100) / 100;
      this.auditService.recordEvent({
        agentId,
        toolName,
        riskScore: riskEval.riskScore,
        verdict: riskEval.verdict,
        payloadHash: dlpResult.payloadHash,
        redactedCount: dlpResult.redactedCount,
        threats: [...riskEval.findings.map((f) => f.threatType), 'EXECUTION_ERROR'],
        latencyMs: errLatency,
        requiresHumanApproval: false,
        sanitizedParams: dlpResult.sanitized,
      });
      throw err;
    }

    const totalLatency = Math.round((performance.now() - startTime) * 100) / 100;

    // 7. Audit Logging for Successful / Redacted Execution
    this.auditService.recordEvent({
      agentId,
      toolName,
      riskScore: riskEval.riskScore,
      verdict: riskEval.verdict,
      payloadHash: dlpResult.payloadHash,
      redactedCount: dlpResult.redactedCount,
      threats: riskEval.findings.map((f) => f.threatType),
      latencyMs: totalLatency,
      requiresHumanApproval: false,
      sanitizedParams: dlpResult.sanitized,
    });

    // 8. Attach Sentinel Security Metadata to Output
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      return {
        ...result,
        _sentinel: {
          verdict: riskEval.verdict,
          riskScore: riskEval.riskScore,
          redactedSecretsCount: dlpResult.redactedCount,
          latencyMs: totalLatency,
          inspectedAt: new Date().toISOString(),
        },
      };
    }

    return result;
  }
}
