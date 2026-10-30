import { McpApp, Module, ConfigModule } from '@nitrostack/core';
import { SecurityModule } from './modules/security/security.module.js';
import { QuarantineModule } from './modules/quarantine/quarantine.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { PolicyModule } from './modules/policy/policy.module.js';
import { SystemHealthCheck } from './health/system.health.js';
import { SentinelFirewallHealthCheck } from './health/sentinel.health.js';

/**
 * Root Application Module for SentinelMCP
 * 
 * Orchestrates the Zero-Trust Security Gateway, DLP Scrubbing,
 * Threat Scoring, Quarantine Registry, and Live Audit Streaming.
 */
@McpApp({
  module: AppModule,
  server: {
    name: 'sentinel-mcp',
    version: '1.0.0',
  },
  logging: {
    level: 'info',
  },
})
@Module({
  name: 'app',
  description: 'SentinelMCP - Zero-Trust AI Agent Firewall & SOC Copilot',
  imports: [
    ConfigModule.forRoot(),
    SecurityModule,
    QuarantineModule,
    AuditModule,
    PolicyModule,
  ],
  providers: [
    SystemHealthCheck,
    SentinelFirewallHealthCheck,
  ],
})
export class AppModule {}
