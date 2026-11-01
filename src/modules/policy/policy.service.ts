import { Injectable, OnModuleInit } from '@nitrostack/core';
import * as fs from 'fs';
import * as path from 'path';

export interface RolePolicy {
  roleName: string;
  allowedTools: string[];
  blockDestructive: boolean;
  maxRiskThreshold: number;
  updatedAt: string;
}

@Injectable()
export class PolicyService implements OnModuleInit {
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly policyFile = path.join(this.dataDir, 'policies.json');
  private readonly policies = new Map<string, RolePolicy>();

  async onModuleInit() {
    this.ensureDataDir();
    this.initDefaultPolicies();
    this.loadFromDisk();
  }

  private ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private initDefaultPolicies() {
    // Default zero-trust role policies
    this.policies.set('admin', {
      roleName: 'admin',
      allowedTools: ['*'],
      blockDestructive: false,
      maxRiskThreshold: 100,
      updatedAt: new Date().toISOString(),
    });

    this.policies.set('agent-developer', {
      roleName: 'agent-developer',
      allowedTools: ['inspect_payload_safety', 'redact_sensitive_context', 'scan_mcp_server_manifest', 'get_firewall_status'],
      blockDestructive: true,
      maxRiskThreshold: 70,
      updatedAt: new Date().toISOString(),
    });

    this.policies.set('soc-analyst', {
      roleName: 'soc-analyst',
      allowedTools: ['*'],
      blockDestructive: false,
      maxRiskThreshold: 85,
      updatedAt: new Date().toISOString(),
    });
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.policyFile)) {
        const raw = fs.readFileSync(this.policyFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const policy of parsed) {
            if (policy.roleName) {
              this.policies.set(policy.roleName, policy);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[PolicyService] Failed to load policies from disk:', err);
    }
  }

  private persistToDisk() {
    try {
      this.ensureDataDir();
      const entries = Array.from(this.policies.values());
      const tempPath = `${this.policyFile}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(entries, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.policyFile);
    } catch (err) {
      console.error('[PolicyService] Failed to persist policies to disk:', err);
    }
  }

  public setPolicy(roleName: string, allowedTools: string[], blockDestructive = true, maxRisk = 70): RolePolicy {
    const policy: RolePolicy = {
      roleName,
      allowedTools,
      blockDestructive,
      maxRiskThreshold: maxRisk,
      updatedAt: new Date().toISOString(),
    };
    this.policies.set(roleName, policy);
    this.persistToDisk();
    return policy;
  }

  public getPolicy(roleName: string): RolePolicy | undefined {
    return this.policies.get(roleName) || this.policies.get('agent-developer');
  }

  public getAllPolicies(): RolePolicy[] {
    return Array.from(this.policies.values());
  }
}
