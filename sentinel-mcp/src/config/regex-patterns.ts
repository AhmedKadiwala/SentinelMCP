/**
 * SentinelMCP - High-Performance DLP & Threat Regex Signatures
 * 
 * Compiled ECMAScript regular expressions for deterministic sub-millisecond detection
 * of credentials, API tokens, PII, prompt injections, and destructive commands.
 */

export interface SecretPattern {
  name: string;
  category: 'CLOUD_CREDENTIAL' | 'API_KEY' | 'PRIVATE_KEY' | 'PII' | 'INJECTION_ATTACK';
  regex: RegExp;
  placeholder: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

export const SECRET_PATTERNS: SecretPattern[] = [
  // 1. AWS Access Key ID
  {
    name: 'AWS Access Key ID',
    category: 'CLOUD_CREDENTIAL',
    regex: /\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g,
    placeholder: '[REDACTED_AWS_KEY]',
    severity: 'CRITICAL',
    description: 'AWS IAM User or STS Temporary Access Key identifier',
  },
  // 2. AWS Secret Access Key (heuristic 40 char base64 after key keyword)
  {
    name: 'AWS Secret Access Key',
    category: 'CLOUD_CREDENTIAL',
    regex: /(?:aws_secret_access_key|aws_secret|secret_key)\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})["']?/gi,
    placeholder: 'aws_secret_access_key="[REDACTED_AWS_SECRET]"',
    severity: 'CRITICAL',
    description: 'AWS 40-character secret access key',
  },
  // 3. GitHub Personal Access Token (classic & fine-grained)
  {
    name: 'GitHub Personal Access Token',
    category: 'API_KEY',
    regex: /\b(ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36,255}\b/g,
    placeholder: '[REDACTED_GITHUB_TOKEN]',
    severity: 'CRITICAL',
    description: 'GitHub personal access or OAuth token',
  },
  {
    name: 'GitHub Fine-Grained Token',
    category: 'API_KEY',
    regex: /\bgithub_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}\b/g,
    placeholder: '[REDACTED_GITHUB_PAT]',
    severity: 'CRITICAL',
    description: 'GitHub modern fine-grained personal access token',
  },
  // 4. Stripe API Keys (Live & Test)
  {
    name: 'Stripe API Key',
    category: 'API_KEY',
    regex: /\b(sk|rk)_(live|test)_[0-9a-zA-Z]{24,99}\b/g,
    placeholder: '[REDACTED_STRIPE_KEY]',
    severity: 'CRITICAL',
    description: 'Stripe financial operations secret API key',
  },
  // 5. Google / Gemini API Keys
  {
    name: 'Google Gemini API Key',
    category: 'API_KEY',
    regex: /\bAIza[0-9A-Za-z\-_]{35}\b/g,
    placeholder: '[REDACTED_GOOGLE_API_KEY]',
    severity: 'CRITICAL',
    description: 'Google Cloud Platform and Gemini developer API key',
  },
  // 6. OpenAI API Key
  {
    name: 'OpenAI API Key',
    category: 'API_KEY',
    regex: /\bsk-(?:proj-|none-)?[A-Za-z0-9\-_]{40,100}\b/g,
    placeholder: '[REDACTED_OPENAI_KEY]',
    severity: 'CRITICAL',
    description: 'OpenAI platform organization API key',
  },
  // 7. Anthropic API Key
  {
    name: 'Anthropic Claude API Key',
    category: 'API_KEY',
    regex: /\bsk-ant-[A-Za-z0-9\-_]{40,100}\b/g,
    placeholder: '[REDACTED_ANTHROPIC_KEY]',
    severity: 'CRITICAL',
    description: 'Anthropic Claude API key',
  },
  // 8. Slack Bot / User OAuth Token
  {
    name: 'Slack OAuth Token',
    category: 'API_KEY',
    regex: /\bxox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,32}\b/g,
    placeholder: '[REDACTED_SLACK_TOKEN]',
    severity: 'HIGH',
    description: 'Slack workspace integration token',
  },
  // 9. Generic Bearer Token
  {
    name: 'Generic Bearer Token',
    category: 'API_KEY',
    regex: /\bBearer\s+([A-Za-z0-9_\-\.]{32,})\b/gi,
    placeholder: 'Bearer [REDACTED_BEARER_TOKEN]',
    severity: 'HIGH',
    description: 'High-entropy OAuth 2.0 or JWT Bearer authorization header',
  },
  // 10. Private Keys (RSA, EC, PGP, OPENSSH)
  {
    name: 'Private Key Block',
    category: 'PRIVATE_KEY',
    regex: /-----BEGIN[ A-Z0-9_-]+PRIVATE KEY-----[\s\S]+?-----END[ A-Z0-9_-]+PRIVATE KEY-----/g,
    placeholder: '[REDACTED_PRIVATE_KEY_BLOCK]',
    severity: 'CRITICAL',
    description: 'Cryptographic PEM-encoded private key block',
  },
  // 11. PII: Email Address
  {
    name: 'Email Address PII',
    category: 'PII',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g,
    placeholder: '[REDACTED_EMAIL]',
    severity: 'LOW',
    description: 'User personally identifiable email address',
  },
  // 12. PII: US Social Security Number
  {
    name: 'US Social Security Number',
    category: 'PII',
    regex: /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g,
    placeholder: '[REDACTED_SSN]',
    severity: 'CRITICAL',
    description: 'US Social Security Number (PII)',
  },
  // 13. PII: Credit Card Number
  {
    name: 'Credit Card Number',
    category: 'PII',
    regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g,
    placeholder: '[REDACTED_CARD_NUMBER]',
    severity: 'CRITICAL',
    description: 'Major credit card number (Visa, MC, Amex, Discover)',
  },
];

export interface ThreatPattern {
  name: string;
  type: 'SQL_INJECTION' | 'PROMPT_INJECTION' | 'SHELL_INJECTION' | 'TOOL_POISONING';
  regex: RegExp;
  score: number;
  description: string;
}

export const THREAT_PATTERNS: ThreatPattern[] = [
  // SQL Injection Destructive Patterns
  {
    name: 'Destructive SQL Drop Table',
    type: 'SQL_INJECTION',
    regex: /\b(?:DROP|TRUNCATE|ALTER)\s+(?:TABLE|DATABASE|SCHEMA|VIEW)\b/i,
    score: 95,
    description: 'Direct SQL schema destruction command',
  },
  {
    name: 'Destructive SQL Delete All',
    type: 'SQL_INJECTION',
    regex: /\bDELETE\s+FROM\s+[a-zA-Z0-9_]+(?:\s*;|\s*$|\s+WHERE\s+(?:1=1|'1'='1'|TRUE))/i,
    score: 90,
    description: 'Unbounded SQL deletion query without proper where clause',
  },
  {
    name: 'SQL Injection Union Exploit',
    type: 'SQL_INJECTION',
    regex: /\bUNION\s+(?:ALL\s+)?SELECT\b/i,
    score: 85,
    description: 'SQL union-based data exfiltration query',
  },
  // Contextual Prompt Injections
  {
    name: 'System Prompt Override',
    type: 'PROMPT_INJECTION',
    regex: /(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|rules|prompts|commands|constraints)/i,
    score: 95,
    description: 'Classic prompt injection overriding agent system constraints',
  },
  {
    name: 'System Role Hijack',
    type: 'PROMPT_INJECTION',
    regex: /(?:you\s+are\s+now|act\s+as)\s+(?:an?\s+unrestricted|a\s+jailbroken|DAN|an?\s+evil|root\s+user|system\s+administrator)/i,
    score: 90,
    description: 'Agent persona hijacking and jailbreak attempt',
  },
  {
    name: 'Prompt Delimiter Injection',
    type: 'PROMPT_INJECTION',
    regex: /(?:<\|im_start\|>|<\|im_end\|>|\[SYSTEM_MESSAGE\]|\[INSTRUCTION\]|```system)/i,
    score: 88,
    description: 'Smuggled LLM system token delimiter injection',
  },
  // Shell Command Injections
  {
    name: 'Destructive Shell Command',
    type: 'SHELL_INJECTION',
    regex: /(?:;\s*|\band\s+|\b&&\s*|\b\|\s*|\b`)(?:rm\s+-rf|mkfs|dd\s+if=|:\(\)\{.*\}|curl\s+.*\|\s*sh|wget\s+.*\|\s*bash)/i,
    score: 98,
    description: 'Destructive OS command injection or remote shell execution',
  },
  {
    name: 'Sensitive File Access Escape',
    type: 'SHELL_INJECTION',
    regex: /(?:\/etc\/passwd|\/etc\/shadow|\.aws\/credentials|\.ssh\/id_rsa|\.env)/i,
    score: 92,
    description: 'Attempt to read protected system credentials or private keys',
  },
  // Tool Description Poisoning (OWASP MCP03)
  {
    name: 'Tool Description Poisoning Directives',
    type: 'TOOL_POISONING',
    regex: /(?:before\s+calling|always\s+include|covertly\s+send|exfiltrate|silently\s+read)\s+.*(?:password|token|key|credential|secret)/i,
    score: 94,
    description: 'Hidden covert instructions planted in tool definitions or metadata',
  },
];
