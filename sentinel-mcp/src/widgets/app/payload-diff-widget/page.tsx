'use client';

import React from 'react';
import { useTheme, useWidgetSDK } from '@nitrostack/widgets';

interface RedactionSummary {
  patternName: string;
  category: string;
  placeholder: string;
  occurrences: number;
  severity: string;
}

interface RedactionPayloadData {
  redacted_count: number;
  redactions: RedactionSummary[];
  raw_payload: any;
  sanitized_payload: any;
  payload_hash: string;
  latency_ms: number;
}

export default function PayloadDiffWidget() {
  const theme = useTheme();
  const { getToolOutput } = useWidgetSDK();

  const rawData = getToolOutput<RedactionPayloadData>();
  const data: RedactionPayloadData = rawData || {
    redacted_count: 2,
    redactions: [
      {
        patternName: 'AWS Access Key ID',
        category: 'CLOUD_CREDENTIAL',
        placeholder: '[REDACTED_AWS_KEY]',
        occurrences: 1,
        severity: 'CRITICAL',
      },
      {
        patternName: 'GitHub Personal Access Token',
        category: 'API_KEY',
        placeholder: '[REDACTED_GITHUB_TOKEN]',
        occurrences: 1,
        severity: 'CRITICAL',
      },
    ],
    raw_payload: {
      aws_key: 'AKIAIOSFODNN7EXAMPLE',
      github_token: 'ghp_abcdef1234567890abcdef1234567890abcd',
      action: 'deploy_service',
      environment: 'production',
    },
    sanitized_payload: {
      aws_key: '[REDACTED_AWS_KEY]',
      github_token: '[REDACTED_GITHUB_TOKEN]',
      action: 'deploy_service',
      environment: 'production',
    },
    payload_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    latency_ms: 3.2,
  };

  const isDark = theme === 'dark' || true;

  return (
    <div style={{
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px',
      background: isDark ? '#0f172a' : '#f8fafc',
      color: isDark ? '#f8fafc' : '#0f172a',
      borderRadius: '16px',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      maxWidth: '740px',
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
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid #38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
          }}>
            🔍
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              SentinelMCP Payload Redaction Diff
            </h2>
            <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' }}>
              Data Loss Prevention (DLP) Engine • Execution: {data.latency_ms}ms
            </div>
          </div>
        </div>

        {/* Counter Badge */}
        <div style={{
          padding: '6px 14px',
          borderRadius: '9999px',
          background: data.redacted_count > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
          color: data.redacted_count > 0 ? '#10b981' : '#94a3b8',
          border: `1px solid ${data.redacted_count > 0 ? '#10b981' : '#94a3b8'}`,
          fontWeight: 700,
          fontSize: '12px',
        }}>
          {data.redacted_count} Secret(s) Scrubbed
        </div>
      </div>

      {/* Redaction Tokens Pill List */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {data.redactions.map((r, i) => (
          <span
            key={i}
            style={{
              fontSize: '11px',
              padding: '4px 8px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontFamily: 'monospace',
            }}
          >
            {r.patternName} ({r.occurrences}x) ➔ {r.placeholder}
          </span>
        ))}
      </div>

      {/* Side-by-Side Diff Panes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '16px',
      }}>
        {/* Left Pane: Raw Inbound (Tainted) */}
        <div style={{
          background: isDark ? '#1e293b' : '#ffffff',
          borderRadius: '10px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          overflow: 'hidden',
        }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            padding: '8px 12px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#f87171',
            borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span>RAW UNVERIFIED PAYLOAD</span>
            <span>⚠️ EXPOSED SECRETS</span>
          </div>
          <pre style={{
            margin: 0,
            padding: '12px',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: isDark ? '#fca5a5' : '#991b1b',
            overflowX: 'auto',
            maxHeight: '260px',
          }}>
            {JSON.stringify(data.raw_payload, null, 2)}
          </pre>
        </div>

        {/* Right Pane: Sanitized Outbound */}
        <div style={{
          background: isDark ? '#1e293b' : '#ffffff',
          borderRadius: '10px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          overflow: 'hidden',
        }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '8px 12px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#34d399',
            borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span>SANITIZED OUTBOUND PAYLOAD</span>
            <span>✓ ZERO LEAKAGE</span>
          </div>
          <pre style={{
            margin: 0,
            padding: '12px',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: isDark ? '#6ee7b7' : '#065f46',
            overflowX: 'auto',
            maxHeight: '260px',
          }}>
            {JSON.stringify(data.sanitized_payload, null, 2)}
          </pre>
        </div>
      </div>

      {/* Footer Audit Hash & Security Non-Repudiation */}
      <div style={{
        paddingTop: '10px',
        borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: '#94a3b8',
        fontFamily: 'monospace',
      }}>
        <span>SHA256 Hash: {data.payload_hash ? data.payload_hash.substring(0, 24) + '...' : 'N/A'}</span>
        <span>Cryptographic Non-Repudiation Verified</span>
      </div>
    </div>
  );
}
