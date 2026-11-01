import { Injectable, OnModuleInit } from '@nitrostack/core';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface AuditRecord {
  id: string;
  timestamp: string;
  agentId: string;
  toolName: string;
  riskScore: number;
  verdict: 'SAFE' | 'WARNING' | 'BLOCKED';
  payloadHash: string;
  redactedCount: number;
  threats: string[];
  latencyMs: number;
  requiresHumanApproval: boolean;
  sanitizedParams: Record<string, any>;
}

@Injectable()
export class AuditService extends EventEmitter implements OnModuleInit {
  private readonly maxBufferSize = 1000;
  private readonly buffer: AuditRecord[] = [];
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly auditLogFile = path.join(this.dataDir, 'audit_log.json');
  private totalInspections = 0;
  private totalRedactions = 0;
  private totalBlocked = 0;

  async onModuleInit() {
    this.ensureDataDir();
    this.loadFromDisk();
  }

  private ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.auditLogFile)) {
        const raw = fs.readFileSync(this.auditLogFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const record of parsed.slice(-this.maxBufferSize)) {
            this.buffer.push(record);
            this.totalInspections++;
            if (record.redactedCount > 0) this.totalRedactions += record.redactedCount;
            if (record.verdict === 'BLOCKED') this.totalBlocked++;
          }
        }
      }
    } catch (err) {
      console.warn('[AuditService] Failed to load audit records from disk:', err);
    }
  }

  private persistToDisk() {
    try {
      this.ensureDataDir();
      const tempPath = `${this.auditLogFile}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.buffer, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.auditLogFile);
    } catch (err) {
      console.error('[AuditService] Failed to persist audit records to disk:', err);
    }
  }

  public recordEvent(record: Omit<AuditRecord, 'id' | 'timestamp'>): AuditRecord {
    const fullRecord: AuditRecord = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...record,
    };

    this.totalInspections++;
    if (fullRecord.redactedCount > 0) {
      this.totalRedactions += fullRecord.redactedCount;
    }
    if (fullRecord.verdict === 'BLOCKED') {
      this.totalBlocked++;
    }

    this.buffer.push(fullRecord);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    this.persistToDisk();
    this.emit('audit.event', fullRecord);
    return fullRecord;
  }

  public getRecentEvents(limit = 50): AuditRecord[] {
    return this.buffer.slice(-limit).reverse();
  }

  public getEventById(id: string): AuditRecord | undefined {
    return this.buffer.find((e) => e.id === id);
  }

  public getSummaryMetrics() {
    return {
      totalInspections: this.totalInspections,
      totalRedactions: this.totalRedactions,
      totalBlocked: this.totalBlocked,
      bufferSize: this.buffer.length,
    };
  }
}
