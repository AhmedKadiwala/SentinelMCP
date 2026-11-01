import { Injectable, OnModuleInit } from '@nitrostack/core';
import * as fs from 'fs';
import * as path from 'path';

export interface QuarantineEntry {
  toolName: string;
  quarantinedAt: string;
  quarantinedBy: string;
  reason: string;
  isActive: boolean;
  blockedCount: number;
}

@Injectable()
export class QuarantineService implements OnModuleInit {
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly registryFile = path.join(this.dataDir, 'quarantine_registry.json');
  private readonly registry = new Map<string, QuarantineEntry>();

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
      if (fs.existsSync(this.registryFile)) {
        const raw = fs.readFileSync(this.registryFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item.toolName) {
              this.registry.set(item.toolName, item);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[QuarantineService] Failed to load quarantine registry from disk:', err);
    }
  }

  private persistToDisk() {
    try {
      this.ensureDataDir();
      const entries = Array.from(this.registry.values());
      const tempPath = `${this.registryFile}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(entries, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.registryFile);
    } catch (err) {
      console.error('[QuarantineService] Failed to persist quarantine registry to disk:', err);
    }
  }

  public quarantineTool(toolName: string, reason: string, quarantinedBy = 'soc-analyst'): QuarantineEntry {
    const existing = this.registry.get(toolName);
    const entry: QuarantineEntry = {
      toolName,
      quarantinedAt: new Date().toISOString(),
      quarantinedBy,
      reason,
      isActive: true,
      blockedCount: existing ? existing.blockedCount : 0,
    };

    this.registry.set(toolName, entry);
    this.persistToDisk();
    return entry;
  }

  public unquarantineTool(toolName: string): boolean {
    const existing = this.registry.get(toolName);
    if (existing) {
      existing.isActive = false;
      this.persistToDisk();
      return true;
    }
    return false;
  }

  public isQuarantined(toolName: string): boolean {
    const entry = this.registry.get(toolName);
    return Boolean(entry && entry.isActive);
  }

  public recordBlockedAttempt(toolName: string): void {
    const entry = this.registry.get(toolName);
    if (entry) {
      entry.blockedCount++;
      this.persistToDisk();
    }
  }

  public getQuarantinedTools(): QuarantineEntry[] {
    return Array.from(this.registry.values()).filter((e) => e.isActive);
  }

  public getAllEntries(): QuarantineEntry[] {
    return Array.from(this.registry.values());
  }
}
