import { HealthCheck, HealthCheckInterface, HealthCheckResult } from '@nitrostack/core';
import { AuditService } from '../modules/audit/audit.service.js';
import { QuarantineService } from '../modules/quarantine/quarantine.service.js';

@HealthCheck({
  name: 'sentinel_firewall',
  description: 'SentinelMCP Runtime Firewall & Threat Inspection Engine Status',
  interval: 15,
})
export class SentinelFirewallHealthCheck implements HealthCheckInterface {
  private startTime = Date.now();

  constructor(
    private readonly auditService: AuditService,
    private readonly quarantineService: QuarantineService
  ) {}

  async check(): Promise<HealthCheckResult> {
    const uptimeSec = Math.floor((Date.now() - this.startTime) / 1000);
    const metrics = this.auditService.getSummaryMetrics();
    const quarantines = this.quarantineService.getQuarantinedTools();

    return {
      status: 'up',
      message: 'SentinelMCP Firewall Engine Active & Guarding',
      details: {
        uptime: `${uptimeSec}s`,
        total_inspected: metrics.totalInspections,
        total_redacted: metrics.totalRedactions,
        total_blocked: metrics.totalBlocked,
        active_quarantines: quarantines.length,
        version: '1.0.0',
      },
    };
  }
}
