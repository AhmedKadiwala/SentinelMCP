import * as crypto from 'crypto';
import { SECRET_PATTERNS, SecretPattern } from '../../../config/regex-patterns.js';

export interface RedactionFinding {
  patternName: string;
  category: string;
  placeholder: string;
  occurrences: number;
  severity: string;
}

export interface DlpScrubResult<T = any> {
  sanitized: T;
  redactedCount: number;
  redactions: RedactionFinding[];
  hasRedactions: boolean;
  payloadHash: string;
  executionDurationMs: number;
}

/**
 * High-Performance Data Loss Prevention (DLP) Engine
 * Recursively scans strings and objects, redacting high-entropy credentials
 * and personal identifiable information.
 */
export class DlpEngine {
  /**
   * Hashes an input payload with SHA-256 for audit non-repudiation
   */
  public static hashPayload(payload: any): string {
    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload ?? {});
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Sanitizes a string or structured object against all registered secret patterns
   */
  public static scrub<T = any>(payload: T, strictMode = true): DlpScrubResult<T> {
    const startTime = performance.now();
    const findingsMap = new Map<string, RedactionFinding>();
    let totalRedacted = 0;

    const sanitizeString = (text: string): string => {
      let result = text;

      for (const pattern of SECRET_PATTERNS) {
        // In non-strict mode, skip low-severity PII like standard email
        if (!strictMode && pattern.severity === 'LOW') {
          continue;
        }

        // Reset regex state
        pattern.regex.lastIndex = 0;
        let matchCount = 0;

        result = result.replace(pattern.regex, (match) => {
          matchCount++;
          totalRedacted++;
          return pattern.placeholder;
        });

        if (matchCount > 0) {
          const existing = findingsMap.get(pattern.name);
          if (existing) {
            existing.occurrences += matchCount;
          } else {
            findingsMap.set(pattern.name, {
              patternName: pattern.name,
              category: pattern.category,
              placeholder: pattern.placeholder,
              occurrences: matchCount,
              severity: pattern.severity,
            });
          }
        }
      }

      return result;
    };

    const traverseAndClean = (value: any): any => {
      if (value === null || value === undefined) {
        return value;
      }
      if (typeof value === 'string') {
        return sanitizeString(value);
      }
      if (Array.isArray(value)) {
        return value.map((item) => traverseAndClean(item));
      }
      if (typeof value === 'object') {
        const cleanedObj: Record<string, any> = {};
        for (const [k, v] of Object.entries(value)) {
          cleanedObj[k] = traverseAndClean(v);
        }
        return cleanedObj;
      }
      return value;
    };

    const sanitized = traverseAndClean(payload);
    const duration = performance.now() - startTime;

    return {
      sanitized,
      redactedCount: totalRedacted,
      redactions: Array.from(findingsMap.values()),
      hasRedactions: totalRedacted > 0,
      payloadHash: this.hashPayload(payload),
      executionDurationMs: Math.round(duration * 100) / 100,
    };
  }
}
