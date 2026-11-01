import { ResourceDecorator as Resource, ExecutionContext } from '@nitrostack/core';
import { AuditService } from './audit.service.js';
import { QuarantineService } from '../quarantine/quarantine.service.js';

export class AuditResources {
  constructor(
    private readonly auditService: AuditService,
    private readonly quarantineService: QuarantineService
  ) {}

  @Resource({
    uri: 'sentinel://audit-feed/live',
    name: 'Live Security Audit Event Stream',
    description: 'Continuous stream of recent tool execution verdicts, risk scores, parameter hashes, and latency metrics.',
    mimeType: 'application/json',
  })
  async getLiveAuditFeed(uri: string, ctx: ExecutionContext) {
    const recentEvents = this.auditService.getRecentEvents(25);
    const metrics = this.auditService.getSummaryMetrics();

    const data = {
      stream_status: 'ACTIVE',
      total_recorded: metrics.totalInspections,
      summary: metrics,
      latest_events: recentEvents,
      emitted_at: new Date().toISOString(),
    };

    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2),
      }],
    };
  }

  @Resource({
    uri: 'sentinel://quarantine/registry',
    name: 'Quarantined Tools Registry',
    description: 'Active blacklist of quarantined MCP tools and servers with timestamps and reasons.',
    mimeType: 'application/json',
  })
  async getQuarantineRegistry(uri: string, ctx: ExecutionContext) {
    const quarantined = this.quarantineService.getQuarantinedTools();
    const data = {
      total_quarantined: quarantined.length,
      quarantined_tools: quarantined,
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
