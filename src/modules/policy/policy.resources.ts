import { ResourceDecorator as Resource, ExecutionContext } from '@nitrostack/core';
import { PolicyService } from './policy.service.js';

export class PolicyResources {
  constructor(private readonly policyService: PolicyService) {}

  @Resource({
    uri: 'sentinel://policies/active',
    name: 'Active Security & DLP Policies',
    description: 'Active JSON schema of RBAC rules, DLP regex patterns, and risk thresholds enforced by SentinelMCP.',
    mimeType: 'application/json',
  })
  async getActivePolicies(uri: string, ctx: ExecutionContext) {
    const policies = this.policyService.getAllPolicies();
    const data = {
      total_policies: policies.length,
      policies,
      retrieved_at: new Date().toISOString(),
    };

    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2),
      }],
    };
  }
}
