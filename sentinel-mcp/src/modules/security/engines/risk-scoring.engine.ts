import { THREAT_PATTERNS, ThreatPattern } from '../../../config/regex-patterns.js';
import { RedactionFinding } from './dlp.engine.js';

export interface ThreatEvaluationFinding {
  threatType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  parameterKey: string;
  matchedPattern: string;
  description: string;
  scoreContribution: number;
}

export interface RiskEvaluationResult {
  riskScore: number;
  verdict: 'SAFE' | 'WARNING' | 'BLOCKED';
  findings: ThreatEvaluationFinding[];
  requiresHumanApproval: boolean;
  summary: string;
}

/**
 * Real-Time Threat & Risk Scoring Engine
 * Evaluates tool parameters for prompt injection, jailbreaks, shell escapes,
 * and dangerous database queries, returning a normalized 0-100 score.
 */
export class RiskScoringEngine {
  public static evaluate(
    toolName: string,
    parameters: Record<string, any>,
    dlpFindings: RedactionFinding[] = []
  ): RiskEvaluationResult {
    const findings: ThreatEvaluationFinding[] = [];
    let cumulativeScore = 0;

    // 1. Evaluate DLP Findings
    for (const dlp of dlpFindings) {
      let scoreForDlp = 0;
      let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

      if (dlp.severity === 'CRITICAL') {
        scoreForDlp = 65; // High base risk if raw cloud credentials are leaked
        severity = 'CRITICAL';
      } else if (dlp.severity === 'HIGH') {
        scoreForDlp = 45;
        severity = 'HIGH';
      } else if (dlp.severity === 'MEDIUM') {
        scoreForDlp = 25;
        severity = 'MEDIUM';
      } else {
        scoreForDlp = 10;
        severity = 'LOW';
      }

      cumulativeScore += scoreForDlp;
      findings.push({
        threatType: 'SECRET_EXFILTRATION',
        severity,
        parameterKey: 'parameters',
        matchedPattern: dlp.patternName,
        description: `Exposed ${dlp.patternName} (${dlp.occurrences} occurrence(s)) in tool arguments`,
        scoreContribution: scoreForDlp,
      });
    }

    // 2. Evaluate String Parameters for Injection & Destructive Threat Patterns
    const inspectValue = (key: string, val: any) => {
      if (typeof val === 'string') {
        for (const pattern of THREAT_PATTERNS) {
          pattern.regex.lastIndex = 0;
          if (pattern.regex.test(val)) {
            let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'HIGH';
            if (pattern.score >= 90) severity = 'CRITICAL';
            else if (pattern.score >= 75) severity = 'HIGH';
            else if (pattern.score >= 50) severity = 'MEDIUM';

            cumulativeScore += pattern.score;
            findings.push({
              threatType: pattern.type,
              severity,
              parameterKey: key,
              matchedPattern: pattern.name,
              description: pattern.description,
              scoreContribution: pattern.score,
            });
          }
        }
      } else if (typeof val === 'object' && val !== null) {
        for (const [subKey, subVal] of Object.entries(val)) {
          inspectValue(`${key}.${subKey}`, subVal);
        }
      }
    };

    if (parameters && typeof parameters === 'object') {
      for (const [paramKey, paramVal] of Object.entries(parameters)) {
        inspectValue(paramKey, paramVal);
      }
    }

    // 3. Normalization: Clamp score between 0 and 100
    const normalizedScore = Math.min(100, Math.max(0, cumulativeScore));

    // 4. Determine Verdict
    let verdict: 'SAFE' | 'WARNING' | 'BLOCKED' = 'SAFE';
    let requiresHumanApproval = false;

    if (normalizedScore >= 70) {
      verdict = 'BLOCKED';
      requiresHumanApproval = true;
    } else if (normalizedScore >= 40) {
      verdict = 'WARNING';
      requiresHumanApproval = false;
    }

    // 5. Generate Diagnostic Summary
    let summary = `Tool "${toolName}" evaluated as ${verdict} (Risk: ${normalizedScore}/100).`;
    if (findings.length > 0) {
      summary += ` Detected ${findings.length} threat finding(s): ${findings.map((f) => f.matchedPattern).join(', ')}.`;
    } else {
      summary += ' Clean parameters; no adversarial patterns or secrets detected.';
    }

    return {
      riskScore: normalizedScore,
      verdict,
      findings,
      requiresHumanApproval,
      summary,
    };
  }
}
