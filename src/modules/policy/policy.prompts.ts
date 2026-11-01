import { PromptDecorator as Prompt, ExecutionContext } from '@nitrostack/core';
import { AuditService } from '../audit/audit.service.js';

export class PolicyPrompts {
  constructor(private readonly auditService: AuditService) {}

  @Prompt({
    name: 'triage_security_incident',
    description: 'Guides an autonomous security agent through investigating a flagged tool call, correlating audit logs, and formulating containment actions.',
    arguments: [
      { name: 'incident_id', description: 'The unique ID of the security event in the audit store', required: true },
    ],
  })
  async getTriagePrompt(args: { incident_id: string }, ctx: ExecutionContext) {
    const record = this.auditService.getEventById(args.incident_id);
    const contextSnippet = record
      ? JSON.stringify(record, null, 2)
      : `Incident ID ${args.incident_id} not found in memory buffer; check persistent audit log.`;

    return [
      {
        role: 'user' as const,
        content: `You are Sentinel-SOC, the Autonomous Incident Response Commander.
An incident alert has been triggered with ID: "${args.incident_id}".

Incident Audit Record:
\`\`\`json
${contextSnippet}
\`\`\`

Your Task:
1. Review the tool name, risk score, and threat categories.
2. Determine if the payload indicates an indirect prompt injection or credential exfiltration.
3. Assess the blast radius on enterprise data and connected infrastructure.
4. If risk score >= 70, recommend calling the tool "quarantine_rogue_tool".
5. Provide a blameless root-cause analysis and an executive summary ready for the CISO.`,
      },
    ];
  }

  @Prompt({
    name: 'generate_soc2_compliance_report',
    description: 'Generates a formal executive AI Governance and SOC2 Type II compliance audit report based on historical runtime tool logs.',
    arguments: [
      { name: 'time_window_hours', description: 'Time window in hours to audit (default: 24)', required: false },
    ],
  })
  async getSoc2ReportPrompt(args: { time_window_hours?: string }, ctx: ExecutionContext) {
    const hours = args.time_window_hours || '24';
    const metrics = this.auditService.getSummaryMetrics();
    const recentEvents = this.auditService.getRecentEvents(10);

    return [
      {
        role: 'user' as const,
        content: `You are an enterprise AI Governance & Compliance Auditor.
Generate a formal SOC2 Type II and ISO 27001 Security Audit Report for the last ${hours} hours.

SentinelMCP System Telemetry:
- Total Tool Invocations Inspected: ${metrics.totalInspections}
- Total Sensitive Credentials / PII Scrubbed: ${metrics.totalRedactions}
- Total Malicious Attacks Blocked: ${metrics.totalBlocked}
- Recent Log Sample: ${JSON.stringify(recentEvents, null, 2)}

Format the output in clear, professional Markdown with:
1. Executive Summary & Attestation of Non-Repudiation.
2. OWASP Top 10 for LLMs Threat Defense Summary.
3. Cryptographic Proof of Zero Raw Secret Leakage.
4. Action Items for Security Operations.`,
      },
    ];
  }
}
