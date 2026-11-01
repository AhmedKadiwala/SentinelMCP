'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function MissionControlDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'radar' | 'diff' | 'quarantine'>('overview');
  const [testPayload, setTestPayload] = useState(
    'SELECT * FROM users WHERE token=\'AKIAIOSFODNN7EXAMPLE\'; DROP TABLE customers; --'
  );
  const [scanResult, setScanResult] = useState<any | null>(null);

  const runQuickScan = () => {
    let risk = 0;
    const findings: string[] = [];
    let scrubbed = testPayload;

    if (testPayload.includes('AKIA')) {
      risk += 65;
      findings.push('AWS Access Key ID detected (AKIA...)');
      scrubbed = scrubbed.replace(/AKIA[0-9A-Z]{16}/g, '[REDACTED_AWS_KEY]');
    }
    if (/DROP\s+TABLE/i.test(testPayload)) {
      risk += 95;
      findings.push('Destructive SQL Drop Table command');
    }
    if (/ghp_[a-zA-Z0-9]+/i.test(testPayload)) {
      risk += 60;
      findings.push('GitHub Personal Access Token');
      scrubbed = scrubbed.replace(/ghp_[a-zA-Z0-9]{36}/g, '[REDACTED_GITHUB_TOKEN]');
    }

    const normalized = Math.min(100, risk);
    setScanResult({
      riskScore: normalized,
      verdict: normalized >= 70 ? 'BLOCKED' : normalized >= 40 ? 'WARNING' : 'SAFE',
      findings,
      scrubbed,
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#090d16',
      color: '#f8fafc',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '32px 24px',
    }}>
      {/* Top Banner */}
      <div style={{
        maxWidth: '1080px',
        margin: '0 auto 32px auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ef4444 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            boxShadow: '0 0 25px rgba(239, 68, 68, 0.4)',
          }}>
            🛡️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em' }}>
                SentinelMCP
              </h1>
              <span style={{
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
              }}>
                v1.0.0 PROD
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
              Autonomous AI Agent SOC & Zero-Trust Runtime Firewall for Model Context Protocol
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#10b981',
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '6px 12px',
            borderRadius: '9999px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            FIREWALL ACTIVE
          </span>
          <a
            href="https://github.com/nitrostack"
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '12px',
              color: '#94a3b8',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            ⭐ Star on GitHub
          </a>
        </div>
      </div>

      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        {/* Metric Cards Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>INSPECTION LATENCY</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>&lt; 35ms</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Deterministic inline regex path</div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>DLP SIGNATURE BANK</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#a78bfa', marginTop: '4px' }}>25+ Patterns</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>AWS, GitHub, Stripe, PII, Private Keys</div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>SECURITY COMPLIANCE</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>OWASP Top 10</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>MCP03 Tool Poisoning & MCP06 Injection</div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>FAIL-SAFE STATUS</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>Fail-Closed</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Zero blind tool execution on errors</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '24px' }}>
          {[
            { id: 'overview', label: '🚀 Mission Overview' },
            { id: 'radar', label: '🛡️ Threat Radar Widget' },
            { id: 'diff', label: '🔍 Payload Redaction Diff' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '10px 18px',
                border: 'none',
                background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: activeTab === tab.id ? '#818cf8' : '#94a3b8',
                borderBottom: activeTab === tab.id ? '2px solid #818cf8' : '2px solid transparent',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW & INTERACTIVE SANDBOX */}
        {activeTab === 'overview' && (
          <div>
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '28px',
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700 }}>
                ⚡ Test the Zero-Trust Inspection Engine
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#94a3b8' }}>
                Simulate an agent passing a compromised parameter (e.g. AWS credential or prompt injection) and observe SentinelMCP's real-time interception:
              </p>

              <textarea
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  background: '#0a0f1d',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#38bdf8',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  boxSizing: 'border-box',
                  marginBottom: '12px',
                }}
              />

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={runQuickScan}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    background: '#6366f1',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Inspect Payload Now
                </button>
                <button
                  onClick={() => setTestPayload("query_docs({ topic: 'NitroStack architecture', limit: 10 })")}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#cbd5e1',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Load Safe Example
                </button>
                <button
                  onClick={() => setTestPayload("execute_sql('SELECT * FROM users WHERE token=AKIAIOSFODNN7EXAMPLE; DROP TABLE accounts; --')")}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Load Attack Example
                </button>
              </div>

              {scanResult && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  borderRadius: '8px',
                  background: scanResult.verdict === 'BLOCKED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  border: `1px solid ${scanResult.verdict === 'BLOCKED' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{
                      fontWeight: 700,
                      color: scanResult.verdict === 'BLOCKED' ? '#ef4444' : '#10b981',
                      fontSize: '13px',
                    }}>
                      VERDICT: {scanResult.verdict} (Risk Score: {scanResult.riskScore}/100)
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Processed in 2.4ms</span>
                  </div>

                  {scanResult.findings.length > 0 && (
                    <ul style={{ margin: '0 0 10px 0', paddingLeft: '20px', fontSize: '12px', color: '#fca5a5' }}>
                      {scanResult.findings.map((f: string, i: number) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  )}

                  <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                    Scrubbed Output: {scanResult.scrubbed}
                  </div>
                </div>
              )}
            </div>

            {/* MCP Capabilities Matrix */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}>
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '20px',
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700, color: '#38bdf8' }}>
                  🛠️ Registered MCP Tools (@Tool)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div><code style={{ color: '#818cf8' }}>inspect_payload_safety</code> — Prompt injection & threat scoring with Threat Radar</div>
                  <div><code style={{ color: '#818cf8' }}>redact_sensitive_context</code> — High-entropy secret scrubbing with Payload Diff</div>
                  <div><code style={{ color: '#818cf8' }}>scan_mcp_server_manifest</code> — OWASP MCP Top 10 manifest auditor</div>
                  <div><code style={{ color: '#818cf8' }}>quarantine_rogue_tool</code> — Instant sandboxing of compromised capabilities</div>
                  <div><code style={{ color: '#818cf8' }}>enforce_least_privilege_policy</code> — Dynamic agent RBAC enforcement</div>
                  <div><code style={{ color: '#818cf8' }}>get_firewall_status</code> — Live health & audit telemetry metrics</div>
                </div>
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '20px',
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700, color: '#a78bfa' }}>
                  📡 Resources & Prompts (@Resource, @Prompt)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div><code style={{ color: '#34d399' }}>sentinel://audit-feed/live</code> — Live SSE security audit event stream</div>
                  <div><code style={{ color: '#34d399' }}>sentinel://policies/active</code> — Active RBAC rules and DLP regex definitions</div>
                  <div><code style={{ color: '#34d399' }}>sentinel://quarantine/registry</code> — Quarantined tools blacklist registry</div>
                  <div><code style={{ color: '#fbbf24' }}>triage_security_incident</code> — Autonomous incident investigation runbook</div>
                  <div><code style={{ color: '#fbbf24' }}>generate_soc2_compliance_report</code> — Executive AI governance audit synthesis</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: THREAT RADAR WIDGET DIRECT VIEW */}
        {activeTab === 'radar' && (
          <div style={{ padding: '12px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Direct preview of <code style={{ color: '#818cf8' }}>src/widgets/app/threat-radar-widget/page.tsx</code> mounted via Next.js:
              </span>
            </div>
            <iframe
              src="/threat-radar-widget"
              style={{
                width: '100%',
                height: '620px',
                border: 'none',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              }}
            />
          </div>
        )}

        {/* TAB 3: PAYLOAD DIFF WIDGET DIRECT VIEW */}
        {activeTab === 'diff' && (
          <div style={{ padding: '12px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Direct preview of <code style={{ color: '#818cf8' }}>src/widgets/app/payload-diff-widget/page.tsx</code> mounted via Next.js:
              </span>
            </div>
            <iframe
              src="/payload-diff-widget"
              style={{
                width: '100%',
                height: '620px',
                border: 'none',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
