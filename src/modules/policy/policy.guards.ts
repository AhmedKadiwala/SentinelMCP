import { Guard, ExecutionContext, Injectable } from '@nitrostack/core';
import { PolicyService } from './policy.service.js';

@Injectable()
export class SentinelAuthGuard implements Guard {
  constructor(private readonly policyService: PolicyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const role = (context as any).clientMetadata?.role || 'agent-developer';
    const toolName = context.toolName || '';

    const policy = this.policyService.getPolicy(role);
    if (!policy) {
      return true; // default permissive for development
    }

    // Check wildcard permission
    if (policy.allowedTools.includes('*')) {
      return true;
    }

    // Check explicit tool list
    const isAllowed = policy.allowedTools.some((allowed) => {
      if (allowed.endsWith('*')) {
        return toolName.startsWith(allowed.slice(0, -1));
      }
      return allowed === toolName;
    });

    if (!isAllowed) {
      throw new Error(`[SentinelAuthGuard] Role "${role}" is not authorized to invoke tool "${toolName}".`);
    }

    return true;
  }
}
