import { ToolDecorator as Tool, ExecutionContext, z } from '@nitrostack/core';
import { QuarantineService } from './quarantine.service.js';
import { AuditService } from '../audit/audit.service.js';

export class QuarantineTools {
  constructor(
    private readonly quarantineService: QuarantineService,
    private readonly auditService: AuditService
  ) {}

  @Tool({
    name: 'quarantine_rogue_tool',
    description: 'Blacklists a specific tool or entire MCP capability from being executed by AI agents.',
    inputSchema: z.object({
      tool_name: z.string().describe('Exact identifier of the tool to quarantine'),
      reason: z.string().describe('Security justification for the quarantine action'),
      operator_id: z.string().default('soc-analyst').describe('ID of the human or agent initiating quarantine'),
    }),
    examples: {
      request: {
        tool_name: 'execute_sql_query',
        reason: 'Detected destructive DROP TABLE query and compromised system prompt',
        operator_id: 'david-soc-01',
      },
      response: {
        success: true,
        tool_name: 'execute_sql_query',
        quarantined_at: '2026-10-30T15:45:00.000Z',
        quarantined_by: 'david-soc-01',
        reason: 'Detected destructive DROP TABLE query and compromised system prompt',
        total_active_quarantines: 1,
      },
    },
  })
  async quarantineTool(input: any, ctx: ExecutionContext) {
    ctx.logger.warn(`[Quarantine] Blacklisting tool: ${input.tool_name} by ${input.operator_id}`);

    const entry = this.quarantineService.quarantineTool(
      input.tool_name,
      input.reason,
      input.operator_id
    );

    this.auditService.recordEvent({
      agentId: input.operator_id,
      toolName: input.tool_name,
      riskScore: 100,
      verdict: 'BLOCKED',
      payloadHash: 'quarantine_action',
      redactedCount: 0,
      threats: ['OPERATOR_QUARANTINE_ENFORCED'],
      latencyMs: 1.0,
      requiresHumanApproval: false,
      sanitizedParams: input,
    });

    return {
      success: true,
      tool_name: entry.toolName,
      quarantined_at: entry.quarantinedAt,
      quarantined_by: entry.quarantinedBy,
      reason: entry.reason,
      total_active_quarantines: this.quarantineService.getQuarantinedTools().length,
    };
  }

  @Tool({
    name: 'unquarantine_tool',
    description: 'Removes a tool from the active quarantine blacklist after security verification.',
    inputSchema: z.object({
      tool_name: z.string().describe('Name of the quarantined tool to restore'),
    }),
  })
  async unquarantineTool(input: any, ctx: ExecutionContext) {
    ctx.logger.info(`[Quarantine] Restoring tool: ${input.tool_name}`);
    const success = this.quarantineService.unquarantineTool(input.tool_name);
    return {
      success,
      tool_name: input.tool_name,
      message: success ? 'Tool restored to active service' : 'Tool was not actively quarantined',
    };
  }
}
