import { Module } from '@nitrostack/core';
import { PolicyService } from './policy.service.js';
import { PolicyTools } from './policy.tools.js';
import { PolicyResources } from './policy.resources.js';
import { PolicyPrompts } from './policy.prompts.js';
import { SentinelAuthGuard } from './policy.guards.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  name: 'policy',
  description: 'Zero-Trust RBAC Policies & Prompt Incident Runbooks',
  imports: [
    AuditModule,
  ],
  providers: [
    PolicyService,
    PolicyTools,
    PolicyResources,
    PolicyPrompts,
    SentinelAuthGuard,
  ],
  exports: [
    PolicyService,
    SentinelAuthGuard,
  ],
})
export class PolicyModule {}
