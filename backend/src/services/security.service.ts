// Security Monitoring Service - STANNEL Platform
// Detects and alerts on suspicious activities

import { emailService } from './email.service.js';

interface SecurityEvent {
  type: 'BRUTE_FORCE' | 'UNAUTHORIZED_ACCESS' | 'SUSPICIOUS_UPLOAD' | 'SQL_INJECTION' | 'XSS_ATTEMPT' | 'RATE_LIMIT_EXCEEDED' | 'INVALID_TOKEN' | 'SUSPICIOUS_ACTIVITY';
  ip: string;
  userAgent?: string;
  userId?: string;
  endpoint: string;
  details: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Admin emails for security alerts
const SECURITY_ADMIN_EMAILS = [
  'orenshp77@gmail.com',
];

// In-memory tracking for rate limiting and brute force detection
const failedLoginAttempts = new Map<string, { count: number; lastAttempt: Date }>();
const requestCounts = new Map<string, { count: number; windowStart: Date }>();
const suspiciousIps = new Set<string>();

// Thresholds
const FAILED_LOGIN_THRESHOLD = 5;
const FAILED_LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const REQUEST_SPIKE_THRESHOLD = 200;

// Suspicious patterns
const SUSPICIOUS_PATTERNS = [
  // SQL Injection
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b.*\b(FROM|INTO|TABLE|WHERE|SET)\b)/i,
  /(--|\/\*|\*\/|@@)/,  // Removed single @ to allow email addresses
  /(\bOR\b|\bAND\b)\s*[\d'"=]/i,
  // XSS
  /<script[\s\S]*?>[\s\S]*?<\/script>/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /<iframe/i,
  // Path traversal
  /\.\.\//,
  /\.\.\\/,
];

const SUSPICIOUS_FILE_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.php', '.asp', '.aspx', '.jsp', '.py', '.rb',
];

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf',
];

export const securityService = {
  recordFailedLogin(ip: string, email: string, userAgent?: string): void {
    const key = `${ip}:${email}`;
    const now = new Date();
    const record = failedLoginAttempts.get(key);

    if (record) {
      if (now.getTime() - record.lastAttempt.getTime() > FAILED_LOGIN_WINDOW_MS) {
        failedLoginAttempts.set(key, { count: 1, lastAttempt: now });
      } else {
        record.count++;
        record.lastAttempt = now;

        if (record.count >= FAILED_LOGIN_THRESHOLD) {
          this.reportSecurityEvent({
            type: 'BRUTE_FORCE',
            ip,
            userAgent,
            endpoint: '/api/v1/auth/login',
            details: `${record.count} failed login attempts for email: ${email.substring(0, 3)}***`,
            severity: record.count >= 10 ? 'HIGH' : 'MEDIUM',
          });
          suspiciousIps.add(ip);
        }
      }
    } else {
      failedLoginAttempts.set(key, { count: 1, lastAttempt: now });
    }
  },

  clearFailedLogins(ip: string, email: string): void {
    failedLoginAttempts.delete(`${ip}:${email}`);
  },

  isIpSuspicious(ip: string): boolean {
    return suspiciousIps.has(ip);
  },

  trackRequest(ip: string, endpoint: string, userAgent?: string): void {
    const now = new Date();
    const record = requestCounts.get(ip);

    if (record) {
      if (now.getTime() - record.windowStart.getTime() > 60000) {
        requestCounts.set(ip, { count: 1, windowStart: now });
      } else {
        record.count++;
        if (record.count === REQUEST_SPIKE_THRESHOLD) {
          this.reportSecurityEvent({
            type: 'RATE_LIMIT_EXCEEDED',
            ip,
            userAgent,
            endpoint,
            details: `IP exceeded ${REQUEST_SPIKE_THRESHOLD} requests per minute`,
            severity: 'MEDIUM',
          });
        }
      }
    } else {
      requestCounts.set(ip, { count: 1, windowStart: now });
    }
  },

  checkForInjection(
    data: Record<string, unknown>,
    ip: string,
    endpoint: string,
    userAgent?: string
  ): { isSuspicious: boolean; pattern?: string } {
    const checkValue = (value: unknown, path: string): { isSuspicious: boolean; pattern?: string } => {
      if (typeof value === 'string') {
        for (const pattern of SUSPICIOUS_PATTERNS) {
          if (pattern.test(value)) {
            const isSqlInjection = pattern.source.includes('SELECT') || pattern.source.includes('--');
            const isXss = pattern.source.includes('script') || pattern.source.includes('javascript');

            this.reportSecurityEvent({
              type: isSqlInjection ? 'SQL_INJECTION' : isXss ? 'XSS_ATTEMPT' : 'SUSPICIOUS_ACTIVITY',
              ip,
              userAgent,
              endpoint,
              details: `Suspicious pattern in "${path}": ${value.substring(0, 100)}`,
              severity: isSqlInjection || isXss ? 'HIGH' : 'MEDIUM',
            });

            return { isSuspicious: true, pattern: pattern.source };
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        for (const [key, val] of Object.entries(value)) {
          const result = checkValue(val, `${path}.${key}`);
          if (result.isSuspicious) return result;
        }
      }
      return { isSuspicious: false };
    };

    return checkValue(data, 'body');
  },

  validateFileUpload(
    filename: string,
    mimeType: string,
    fileBuffer: Buffer,
    ip: string,
    userAgent?: string
  ): { isValid: boolean; reason?: string } {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));

    if (SUSPICIOUS_FILE_EXTENSIONS.includes(ext)) {
      this.reportSecurityEvent({
        type: 'SUSPICIOUS_UPLOAD',
        ip,
        userAgent,
        endpoint: '/api/v1/invoices/upload',
        details: `Attempted upload of suspicious file: ${filename}`,
        severity: 'HIGH',
      });
      return { isValid: false, reason: 'File type not allowed' };
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      this.reportSecurityEvent({
        type: 'SUSPICIOUS_UPLOAD',
        ip,
        userAgent,
        endpoint: '/api/v1/invoices/upload',
        details: `Invalid MIME type: ${mimeType}`,
        severity: 'MEDIUM',
      });
      return { isValid: false, reason: 'Invalid file type' };
    }

    // Validate magic bytes
    const magicBytes = fileBuffer.slice(0, 8).toString('hex').toUpperCase();
    const signatures: Record<string, string[]> = {
      'image/jpeg': ['FFD8FF'],
      'image/png': ['89504E47'],
      'image/gif': ['47494638'],
      'application/pdf': ['25504446'],
    };

    const validSigs = signatures[mimeType];
    if (validSigs && !validSigs.some(sig => magicBytes.startsWith(sig))) {
      this.reportSecurityEvent({
        type: 'SUSPICIOUS_UPLOAD',
        ip,
        userAgent,
        endpoint: '/api/v1/invoices/upload',
        details: `Magic bytes mismatch for ${mimeType}`,
        severity: 'HIGH',
      });
      return { isValid: false, reason: 'File content mismatch' };
    }

    return { isValid: true };
  },

  reportInvalidToken(ip: string, endpoint: string, userAgent?: string, reason?: string): void {
    this.reportSecurityEvent({
      type: 'INVALID_TOKEN',
      ip,
      userAgent,
      endpoint,
      details: reason || 'Invalid authentication token',
      severity: 'LOW',
    });
  },

  reportUnauthorizedAccess(
    ip: string,
    endpoint: string,
    userId: string,
    resourceId: string,
    userAgent?: string
  ): void {
    this.reportSecurityEvent({
      type: 'UNAUTHORIZED_ACCESS',
      ip,
      userAgent,
      userId,
      endpoint,
      details: `User ${userId} attempted access to: ${resourceId}`,
      severity: 'HIGH',
    });
  },

  async reportSecurityEvent(event: SecurityEvent): Promise<void> {
    const timestamp = new Date();

    console.error(`[SECURITY ${event.severity}] ${event.type}:`, {
      ...event,
      timestamp: timestamp.toISOString(),
    });

    // Send email for MEDIUM+ severity
    if (event.severity !== 'LOW') {
      try {
        await emailService.sendSecurityAlert(SECURITY_ADMIN_EMAILS, {
          ...event,
          timestamp,
        });
      } catch (error) {
        console.error('[Security] Failed to send alert:', error);
      }
    }
  },

  cleanup(): void {
    const now = new Date();
    for (const [key, record] of failedLoginAttempts.entries()) {
      if (now.getTime() - record.lastAttempt.getTime() > FAILED_LOGIN_WINDOW_MS * 2) {
        failedLoginAttempts.delete(key);
      }
    }
    for (const [key, record] of requestCounts.entries()) {
      if (now.getTime() - record.windowStart.getTime() > 300000) {
        requestCounts.delete(key);
      }
    }
  },
};

setInterval(() => securityService.cleanup(), 300000);
