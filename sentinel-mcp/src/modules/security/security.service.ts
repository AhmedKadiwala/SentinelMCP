import { Injectable } from '@nitrostack/core';
import { THREAT_PATTERNS } from '../../config/regex-patterns.js';

export interface ManifestVulnerability {
  toolName: string;
  owaspCode: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  remediation: string;
}

export interface ManifestScanReport {
  serverName: string;
  securityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  totalToolsScanned: number;
  vulnerabilities: ManifestVulnerability[];
  recommendedAction: 'ALLOW' | 'REQUIRE_RESTRICTION' | 'QUARANTINE';
  summary: string;
  timestamp: string;
}

@Injectable()
export class SecurityService {
  /**
   * Audits an MCP server manifest or tools/list JSON output against OWASP MCP Top 10
   */
  public async scanManifest(manifestJson: string, serverName = 'target-mcp-server'): Promise<ManifestScanReport> {
    let parsed: any;
    try {
      parsed = typeof manifestJson === 'string' ? JSON.parse(manifestJson) : manifestJson;
    } catch (e: any) {
      throw new Error(`Invalid JSON manifest provided: ${e.message}`);
    }

    const tools: any[] = Array.isArray(parsed) ? parsed : (parsed.tools || parsed.manifest?.tools || []);
    const vulnerabilities: ManifestVulnerability[] = [];

    for (const tool of tools) {
      const name = tool.name || 'unnamed_tool';
      const description = tool.description || '';
      const inputSchema = tool.inputSchema || {};

      // 1. OWASP MCP03: Tool Description Poisoning
      for (const pattern of THREAT_PATTERNS) {
        if (pattern.regex.test(description)) {
          vulnerabilities.push({
            toolName: name,
            owaspCode: 'MCP03: Tool Poisoning',
            severity: 'CRITICAL',
            description: `Tool description contains suspicious directive matching ${pattern.name}.`,
            remediation: 'Sanitize tool natural language descriptions. Remove covert instructions.',
          });
        }
      }

      // 2. Dangerous High-Impact Capabilities without confirmation
      const dangerousKeywords = ['shell', 'exec', 'bash', 'terminal', 'raw_query', 'eval', 'delete_all'];
      if (dangerousKeywords.some((kw) => name.toLowerCase().includes(kw))) {
        vulnerabilities.push({
          toolName: name,
          owaspCode: 'MCP02: Excessive Agency',
          severity: 'HIGH',
          description: `Tool "${name}" exposes arbitrary code execution or unconstrained system access.`,
          remediation: 'Wrap tool in Least-Privilege Guard and enforce human-in-the-loop authorization.',
        });
      }

      // 3. Unbounded String Input Schema
      if (inputSchema && inputSchema.properties) {
        for (const [propName, propDef] of Object.entries<any>(inputSchema.properties)) {
          if (propDef.type === 'string' && !propDef.maxLength && !propDef.enum) {
            vulnerabilities.push({
              toolName: name,
              owaspCode: 'MCP06: Injection via Contextual Payloads',
              severity: 'MEDIUM',
              description: `Parameter "${propName}" is an unbounded string without maxLength or regex constraints.`,
              remediation: 'Define strict schema validation with maxLength or enum boundaries.',
            });
          }
        }
      }
    }

    // Calculate Grade
    let securityGrade: 'A' | 'B' | 'C' | 'D' | 'F' = 'A';
    let recommendedAction: 'ALLOW' | 'REQUIRE_RESTRICTION' | 'QUARANTINE' = 'ALLOW';

    const criticalCount = vulnerabilities.filter((v) => v.severity === 'CRITICAL').length;
    const highCount = vulnerabilities.filter((v) => v.severity === 'HIGH').length;

    if (criticalCount > 0) {
      securityGrade = 'F';
      recommendedAction = 'QUARANTINE';
    } else if (highCount >= 2) {
      securityGrade = 'D';
      recommendedAction = 'REQUIRE_RESTRICTION';
    } else if (highCount === 1) {
      securityGrade = 'C';
      recommendedAction = 'REQUIRE_RESTRICTION';
    } else if (vulnerabilities.length > 0) {
      securityGrade = 'B';
      recommendedAction = 'ALLOW';
    }

    return {
      serverName,
      securityGrade,
      totalToolsScanned: tools.length,
      vulnerabilities,
      recommendedAction,
      summary: `Scanned ${tools.length} tool(s). Found ${vulnerabilities.length} security finding(s). Grade: ${securityGrade}.`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Fetches real-time GitHub security advisories for AI ecosystem packages
   */
  public async checkPackageAdvisories(packageName: string): Promise<any[]> {
    const url = `https://api.github.com/advisories?ecosystem=npm&package=${encodeURIComponent(packageName)}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'SentinelMCP-Security-Gateway/1.0',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        return (await res.json()) as any[];
      }
    } catch {
      // Fallback
    }
    return [];
  }
}
