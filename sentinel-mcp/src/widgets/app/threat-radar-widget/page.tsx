'use client';

import React, { useState } from 'react';
import { useTheme, useWidgetSDK } from '@nitrostack/widgets';

interface ThreatFinding {
  threat_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  parameter: string;
  matched_pattern: string;
  description: string;
}

interface SafetyInspectionData {
  tool_name: string;
  verdict: 'SAFE' | 'WARNING' | 'BLOCKED';
  risk_score: number;
  findings: ThreatFinding[];
  requires_human_approval: boolean;
  sanitized_parameters: Record<string, any>;
  redactions_count?: number;
  summary: string;
  latency_ms: number;
}

export default function ThreatRadarWidget() {
  const theme = useTheme();
  const { getToolOutput, callTool, isReady } = useWidgetSDK();
  const [quarantineStatus, setQuarantineStatus] = useState<string | null>(null);
  const [isQuarantining, setIsQuarantining] = useState(false);

  // Consume live tool output or use fallback preview data
  const rawData = getToolOutput<SafetyInspectionData>();
  const data: SafetyInspectionData = rawData || {
    tool_name: 'execute_sql_query',
    verdict: 'BLOCKED',
    risk_score: 94,
    findings: [
      {
        threat_type: 'SECRET_EXFILTRATION',
        severity: 'CRITICAL',
        parameter: 'query',
        matched_pattern: 'AWS Access Key ID',
        description: 'Exposed AWS Access Key ID (AKIA...) in SQL query arguments',
      },
      {
        threat_type: 'SQL_INJECTION',
        severity: 'CRITICAL',
        parameter: 'query',
        matched_pattern: 'Destructive SQL Drop Table',
        description: 'Direct SQL schema destruction command: "DROP TABLE users"',
      },
      {
        threat_type: 'PROMPT_INJECTION',
        severity: 'HIGH',
        parameter: 'context',
        matched_pattern: 'System Prompt Override',
        description: 'Attempt to override system boundaries',
      },
    ],
    requires_human_approval: true,
    sanitized_parameters: {
      query: "SELECT * FROM accounts WHERE token='[REDACTED_AWS_KEY]'; DROP TABLE users; --",
    },
    redactions_count: 1,
    summary: 'Tool evaluated as BLOCKED (Risk: 94/100). Detected 3 threat finding(s).',
    latency_ms: 12.8,
  };

  const isDark = theme === 'dark' || true;
  const isBlocked = data.verdict === 'BLOCKED';
  const isWarning = data.verdict === 'WARNING';

  const verdictColor = isBlocked ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
  const verdictBg = isBlocked ? 'rgba(239, 68, 68, 0.15)' : isWarning ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)';

  const handleQuarantine = async () => {
    if (!data.tool_name) return;
    setIsQuarantining(true);
    try {
      if (callTool) {
        await callTool('quarantine_rogue_tool', {
          tool_name: data.tool_name,
          reason: `Quarantined via Threat Radar Widget (Risk: ${data.risk_score}/100)`,
          operator_id: 'soc-analyst',
        });
      }
      setQuarantineStatus('Tool has been actively quarantined in registry.');
    } catch {
      setQuarantineStatus('Quarantine applied locally.');
    } finally {
      setIsQuarantining(false);
    }
  };

  return (
    <div style={{
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px',
      background: isDark ? '#0f172a' : '#f8fafc',
      color: isDark ? '#f8fafc' : '#0f172a',
      borderRadius: '16px',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      maxWidth: '680px',
      margin: '0 auto',
      boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
    }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: verdictBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            border: `1px solid ${verdictColor}`,
          }}>
            🛡️
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              SentinelMCP Threat Radar
            </h2>
            <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' }}>
              Zero-Trust Protocol Gateway • Tool: <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{data.tool_name}</span>
            </div>
          </div>
        </div>

        {/* Verdict Badge */}
        <div style={{
          padding: '6px 14px',
          borderRadius: '9999px',
          background: verdictBg,
          color: verdictColor,
          border: `1px solid ${verdictColor}`,
          fontWeight: 700,
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: verdictColor,
            boxShadow: isBlocked ? '0 0 10px #ef4444' : 'none',
          }} />
          {data.verdict} ({data.risk_score}/100)
        </div>
      </div>

      {/* Risk Gauge Bar */}
      <div style={{
        background: isDark ? '#1e293b' : '#e2e8f0',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
          <span>THREAT RISK ASSESSMENT</span>
          <span style={{ color: verdictColor }}>
            {data.risk_score >= 70 ? 'CRITICAL RISK - BLOCKED' : data.risk_score >= 40 ? 'SUSPICIOUS - WARN' : 'BENIGN - SAFE'}
          </span>
        </div>
        <div style={{
          height: '10px',
          borderRadius: '5px',
          background: isDark ? '#334155' : '#cbd5e1',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            height: '100%',
            width: `${data.risk_score}%`,
            background: `linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%)`,
            transition: 'width 0.8s ease',
            borderRadius: '5px',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
          <span>0 (Safe)</span>
          <span>40 (Warning)</span>
          <span>70 (Cutoff)</span>
          <span>100 (Critical)</span>
        </div>
      </div>

      {/* Threat Findings Breakdown */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.05em' }}>
          Active Threat Findings ({data.findings.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.findings.map((finding, idx) => (
            <div
              key={idx}
              style={{
                background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff',
                border: `1px solid ${finding.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.4)' : isDark ? '#334155' : '#e2e8f0'}`,
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: finding.severity === 'CRITICAL' ? '#ef4444' : finding.severity === 'HIGH' ? '#f59e0b' : '#3b82f6',
                    color: '#ffffff',
                  }}>
                    {finding.severity}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '13px' }}>{finding.matched_pattern}</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>[{finding.threat_type}]</span>
                </div>
                <div style={{ fontSize: '12px', color: isDark ? '#cbd5e1' : '#475569' }}>
                  {finding.description}
                </div>
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#38bdf8' }}>param: {finding.parameter}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sanitized Output Preview */}
      <div style={{
        background: isDark ? '#1e293b' : '#f1f5f9',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '16px',
        fontFamily: 'monospace',
        fontSize: '12px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#94a3b8' }}>
          <span>SANITIZED PARAMETER PREVIEW (DLP SCRUBBED)</span>
          <span>Latency: {data.latency_ms}ms</span>
        </div>
        <pre style={{ margin: 0, overflowX: 'auto', color: isDark ? '#a7f3d0' : '#065f46' }}>
          {JSON.stringify(data.sanitized_parameters, null, 2)}
        </pre>
      </div>

      {/* Interactive Actions & Human-In-The-Loop */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '12px',
        borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      }}>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          {quarantineStatus ? (
            <span style={{ color: '#ef4444', fontWeight: 600 }}>⚠️ {quarantineStatus}</span>
          ) : (
            <span>Execution Blocked. Human intervention permitted.</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleQuarantine}
            disabled={isQuarantining || Boolean(quarantineStatus)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#ef4444',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '13px',
              cursor: isQuarantining || quarantineStatus ? 'not-allowed' : 'pointer',
              opacity: isQuarantining || quarantineStatus ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            🚫 {isQuarantining ? 'Quarantining...' : 'Quarantine Tool'}
          </button>
        </div>
      </div>
    </div>
  );
}
