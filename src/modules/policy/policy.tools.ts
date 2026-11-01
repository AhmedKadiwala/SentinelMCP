import { ToolDecorator as Tool, ExecutionContext, z } from '@nitrostack/core';
import { PolicyService } from './policy.service.js';

export class PolicyTools {
  constructor(private readonly policyService: PolicyService) {}

  @Tool({
    name: 'enforce_least_privilege_policy',
    description: 'Registers or updates zero-trust role-based access control policies for specific AI agent roles.',
    inputSchema: z.object({
      role: z.string().describe('Agent role name (e.g., "code-reviewer", "customer-support", "deployer")'),
      allowed_tools: z.array(z.string()).describe('List of explicitly allowed tool name patterns (e.g., ["read_*", "fetch_*"])'),
      block_destructive_tools: z.boolean().default(true).describe('Automatically block tools with drop/delete/write capabilities'),
      max_risk_threshold: z.number().default(70).describe('Cutoff risk score (0-100) above which execution is blocked'),
    }),
    examples: {
      request: {
        role: 'support-agent',
        allowed_tools: ['get_customer_info', 'search_knowledge_base'],
        block_destructive_tools: true,
        max_risk_threshold: 60,
      },
      response: {
        success: true,
        policy: {
          roleName: 'support-agent',
          allowedTools: ['get_customer_info', 'search_knowledge_base'],
          blockDestructive: true,
          maxRiskThreshold: 60,
        },
      },
    },
  })
  async enforcePolicy(input: any, ctx: ExecutionContext) {
    ctx.logger.info(`[Policy] Updating RBAC policy for role "${input.role}"`);
    const policy = this.policyService.setPolicy(
      input.role,
      input.allowed_tools,
      input.block_destructive_tools,
      input.max_risk_threshold
    );

    return {
      success: true,
      message: `Zero-Trust Least-Privilege policy applied for role "${input.role}"`,
      policy,
    };
  }
}
