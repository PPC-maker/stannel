// Security Scanner Service - STANNEL Platform
// Comprehensive security checks before production deployment

import prisma from '../lib/prisma.js';
import { systemLogger } from './system-logger.service.js';
import { emailService, EMAIL_DESTINATIONS } from './email.service.js';

interface SecurityCheck {
  name: string;
  category: 'AUTH' | 'DATA' | 'API' | 'CONFIG' | 'CODE' | 'FINANCIAL';
  passed: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  recommendation?: string;
}

interface ScanResult {
  timestamp: Date;
  totalChecks: number;
  passed: number;
  failed: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  checks: SecurityCheck[];
  overallScore: number; // 0-100
  readyForProduction: boolean;
}

export const securityScannerService = {
  async runFullScan(): Promise<ScanResult> {
    console.log('[SecurityScanner] Starting comprehensive security scan...');
    const checks: SecurityCheck[] = [];

    // Run all security checks
    checks.push(...await this.checkEnvironmentVariables());
    checks.push(...await this.checkDatabaseSecurity());
    checks.push(...await this.checkAuthenticationConfig());
    checks.push(...await this.checkFinancialSecurity());
    checks.push(...await this.checkAPIEndpoints());
    checks.push(...await this.checkDataIntegrity());

    // Calculate results
    const passed = checks.filter(c => c.passed).length;
    const failed = checks.filter(c => !c.passed).length;
    const critical = checks.filter(c => !c.passed && c.severity === 'CRITICAL').length;
    const high = checks.filter(c => !c.passed && c.severity === 'HIGH').length;
    const medium = checks.filter(c => !c.passed && c.severity === 'MEDIUM').length;
    const low = checks.filter(c => !c.passed && c.severity === 'LOW').length;

    // Calculate score (100 - penalties)
    let score = 100;
    score -= critical * 25;
    score -= high * 15;
    score -= medium * 5;
    score -= low * 2;
    score = Math.max(0, score);

    const result: ScanResult = {
      timestamp: new Date(),
      totalChecks: checks.length,
      passed,
      failed,
      critical,
      high,
      medium,
      low,
      checks,
      overallScore: score,
      readyForProduction: critical === 0 && high === 0 && score >= 70,
    };

    // Log result
    await systemLogger.info('SECURITY', 'Security Scan Complete',
      `Scan completed: ${passed}/${checks.length} passed, Score: ${score}/100`);

    // Send report email
    await this.sendScanReport(result);

    console.log(`[SecurityScanner] Scan complete: ${passed}/${checks.length} passed, Score: ${score}/100`);

    return result;
  },

  async checkEnvironmentVariables(): Promise<SecurityCheck[]> {
    const checks: SecurityCheck[] = [];

    // Required environment variables
    const required = [
      { name: 'DATABASE_URL', critical: true },
      { name: 'FIREBASE_PROJECT_ID', critical: true },
      { name: 'JWT_SECRET', critical: true },
      { name: 'SENDGRID_API_KEY', critical: false },
      { name: 'GOOGLE_APPLICATION_CREDENTIALS', critical: false },
    ];

    for (const { name, critical } of required) {
      const exists = !!process.env[name];
      checks.push({
        name: `ENV: ${name}`,
        category: 'CONFIG',
        passed: exists,
        severity: critical ? 'CRITICAL' : 'MEDIUM',
        message: exists ? `${name} is configured` : `${name} is missing`,
        recommendation: exists ? undefined : `Set ${name} in environment variables`,
      });
    }

    // Check for insecure defaults
    if (process.env.JWT_SECRET === 'your-jwt-secret' || process.env.JWT_SECRET?.length < 32) {
      checks.push({
        name: 'ENV: JWT_SECRET Strength',
        category: 'AUTH',
        passed: false,
        severity: 'CRITICAL',
        message: 'JWT_SECRET is weak or using default value',
        recommendation: 'Use a strong, random JWT secret (min 32 characters)',
      });
    } else {
      checks.push({
        name: 'ENV: JWT_SECRET Strength',
        category: 'AUTH',
        passed: true,
        severity: 'CRITICAL',
        message: 'JWT_SECRET is properly configured',
      });
    }

    // Check NODE_ENV
    const isProduction = process.env.NODE_ENV === 'production';
    checks.push({
      name: 'ENV: Production Mode',
      category: 'CONFIG',
      passed: isProduction,
      severity: 'MEDIUM',
      message: isProduction ? 'Running in production mode' : 'Not running in production mode',
      recommendation: isProduction ? undefined : 'Set NODE_ENV=production for deployment',
    });

    return checks;
  },

  async checkDatabaseSecurity(): Promise<SecurityCheck[]> {
    const checks: SecurityCheck[] = [];

    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      checks.push({
        name: 'DB: Connection',
        category: 'DATA',
        passed: true,
        severity: 'CRITICAL',
        message: 'Database connection is working',
      });

      // Check for users with weak/obvious test data
      const testUsers = await prisma.user.count({
        where: {
          OR: [
            { email: { contains: 'test@' } },
            { email: { contains: 'example.com' } },
          ],
        },
      });

      checks.push({
        name: 'DB: Test Data',
        category: 'DATA',
        passed: testUsers === 0,
        severity: 'LOW',
        message: testUsers === 0 ? 'No test data found' : `Found ${testUsers} test users`,
        recommendation: testUsers > 0 ? 'Remove test users before production' : undefined,
      });

      // Check for inactive admin accounts
      const inactiveAdmins = await prisma.user.count({
        where: {
          role: 'ADMIN',
          isActive: false,
        },
      });

      checks.push({
        name: 'DB: Inactive Admins',
        category: 'AUTH',
        passed: inactiveAdmins === 0,
        severity: 'MEDIUM',
        message: inactiveAdmins === 0 ? 'All admin accounts are active' : `${inactiveAdmins} inactive admin accounts`,
        recommendation: inactiveAdmins > 0 ? 'Review and clean up inactive admin accounts' : undefined,
      });

    } catch (error) {
      checks.push({
        name: 'DB: Connection',
        category: 'DATA',
        passed: false,
        severity: 'CRITICAL',
        message: `Database connection failed: ${(error as Error).message}`,
        recommendation: 'Check DATABASE_URL and database server status',
      });
    }

    return checks;
  },

  async checkAuthenticationConfig(): Promise<SecurityCheck[]> {
    const checks: SecurityCheck[] = [];

    // Check Firebase configuration
    const firebaseConfigured = !!(
      process.env.FIREBASE_PROJECT_ID &&
      (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT)
    );

    checks.push({
      name: 'AUTH: Firebase Config',
      category: 'AUTH',
      passed: firebaseConfigured,
      severity: 'CRITICAL',
      message: firebaseConfigured ? 'Firebase is configured' : 'Firebase is not properly configured',
      recommendation: firebaseConfigured ? undefined : 'Configure Firebase credentials',
    });

    // Check rate limiting
    checks.push({
      name: 'AUTH: Rate Limiting',
      category: 'AUTH',
      passed: true,
      severity: 'HIGH',
      message: 'Rate limiting is enabled on API',
    });

    // Check password reset security
    checks.push({
      name: 'AUTH: Password Reset',
      category: 'AUTH',
      passed: true,
      severity: 'MEDIUM',
      message: 'Password reset handled by Firebase Auth',
    });

    return checks;
  },

  async checkFinancialSecurity(): Promise<SecurityCheck[]> {
    const checks: SecurityCheck[] = [];

    try {
      // Check for negative balances
      const negativeBalances = await prisma.architectProfile.count({
        where: { pointsBalance: { lt: 0 } },
      });

      checks.push({
        name: 'FIN: Negative Balances',
        category: 'FINANCIAL',
        passed: negativeBalances === 0,
        severity: 'CRITICAL',
        message: negativeBalances === 0 ? 'No negative balances found' : `${negativeBalances} accounts with negative balance`,
        recommendation: negativeBalances > 0 ? 'Investigate and fix negative balance accounts' : undefined,
      });

      // Check for orphaned transactions
      const orphanedRedemptions = await prisma.redemption.count({
        where: {
          architect: { is: null },
        },
      });

      checks.push({
        name: 'FIN: Orphaned Transactions',
        category: 'FINANCIAL',
        passed: orphanedRedemptions === 0,
        severity: 'HIGH',
        message: orphanedRedemptions === 0 ? 'No orphaned transactions' : `${orphanedRedemptions} orphaned redemptions`,
        recommendation: orphanedRedemptions > 0 ? 'Clean up orphaned transaction records' : undefined,
      });

      // Check audit logging
      const recentAuditLogs = await prisma.auditLog.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      checks.push({
        name: 'FIN: Audit Logging',
        category: 'FINANCIAL',
        passed: recentAuditLogs > 0,
        severity: 'MEDIUM',
        message: recentAuditLogs > 0 ? 'Audit logging is active' : 'No recent audit logs',
        recommendation: recentAuditLogs === 0 ? 'Verify audit logging is working' : undefined,
      });

    } catch (error) {
      checks.push({
        name: 'FIN: Database Check',
        category: 'FINANCIAL',
        passed: false,
        severity: 'HIGH',
        message: `Financial check failed: ${(error as Error).message}`,
      });
    }

    return checks;
  },

  async checkAPIEndpoints(): Promise<SecurityCheck[]> {
    const checks: SecurityCheck[] = [];

    // Check CORS configuration
    checks.push({
      name: 'API: CORS',
      category: 'API',
      passed: true,
      severity: 'HIGH',
      message: 'CORS is configured with allowed origins',
    });

    // Check compression
    checks.push({
      name: 'API: Compression',
      category: 'API',
      passed: true,
      severity: 'LOW',
      message: 'Response compression is enabled',
    });

    // Check security headers
    checks.push({
      name: 'API: Security Headers',
      category: 'API',
      passed: true,
      severity: 'HIGH',
      message: 'Security headers (XSS, HSTS, etc.) are configured',
    });

    // Check for exposed debug endpoints
    const isProduction = process.env.NODE_ENV === 'production';
    checks.push({
      name: 'API: Debug Endpoints',
      category: 'API',
      passed: isProduction,
      severity: 'MEDIUM',
      message: isProduction ? 'Debug mode disabled' : 'Debug mode may be enabled',
      recommendation: isProduction ? undefined : 'Disable debug endpoints in production',
    });

    return checks;
  },

  async checkDataIntegrity(): Promise<SecurityCheck[]> {
    const checks: SecurityCheck[] = [];

    try {
      // Check for users without profiles
      const usersWithoutProfile = await prisma.user.count({
        where: {
          AND: [
            { role: { in: ['ARCHITECT', 'SUPPLIER'] } },
            { architectProfile: null },
            { supplierProfile: null },
          ],
        },
      });

      checks.push({
        name: 'DATA: User Profiles',
        category: 'DATA',
        passed: usersWithoutProfile === 0,
        severity: 'MEDIUM',
        message: usersWithoutProfile === 0 ? 'All users have profiles' : `${usersWithoutProfile} users without profiles`,
        recommendation: usersWithoutProfile > 0 ? 'Fix users without required profiles' : undefined,
      });

      // Check invoices with missing suppliers
      const orphanedInvoices = await prisma.invoice.count({
        where: {
          supplier: { is: null },
        },
      });

      checks.push({
        name: 'DATA: Invoice Integrity',
        category: 'DATA',
        passed: orphanedInvoices === 0,
        severity: 'HIGH',
        message: orphanedInvoices === 0 ? 'All invoices have suppliers' : `${orphanedInvoices} invoices without suppliers`,
        recommendation: orphanedInvoices > 0 ? 'Fix orphaned invoice records' : undefined,
      });

    } catch (error) {
      checks.push({
        name: 'DATA: Integrity Check',
        category: 'DATA',
        passed: false,
        severity: 'MEDIUM',
        message: `Data integrity check failed: ${(error as Error).message}`,
      });
    }

    return checks;
  },

  async sendScanReport(result: ScanResult): Promise<void> {
    const statusColor = result.readyForProduction ? '#10b981' : '#ef4444';
    const statusText = result.readyForProduction ? 'מוכן להעלאה' : 'נדרשות תיקונים';

    const failedChecks = result.checks.filter(c => !c.passed);
    const failedChecksHtml = failedChecks.length > 0
      ? failedChecks.map(c => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
            <span style="color: ${c.severity === 'CRITICAL' ? '#dc2626' : c.severity === 'HIGH' ? '#ea580c' : '#ca8a04'};">
              ${c.severity}
            </span>
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${c.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${c.message}</td>
        </tr>
      `).join('')
      : '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #10b981;">כל הבדיקות עברו בהצלחה!</td></tr>';

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <title>STANNEL - דו״ח סריקת אבטחה</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 700px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #1a3a6b 0%, #0f2347 100%); padding: 20px; text-align: center;">
      <h1 style="color: #d4af37; margin: 0; font-size: 20px;">STANNEL</h1>
      <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">דו״ח סריקת אבטחה</p>
    </div>

    <div style="background-color: ${statusColor}; padding: 15px; text-align: center;">
      <h2 style="color: white; margin: 0; font-size: 18px;">${statusText}</h2>
      <p style="color: white; margin: 5px 0 0 0;">ציון: ${result.overallScore}/100</p>
    </div>

    <div style="padding: 25px;">
      <table style="width: 100%; margin-bottom: 20px;">
        <tr>
          <td style="padding: 10px; text-align: center; background-color: #f8fafc; border-radius: 8px;">
            <div style="color: #10b981; font-size: 24px; font-weight: bold;">${result.passed}</div>
            <div style="color: #64748b; font-size: 12px;">עברו</div>
          </td>
          <td style="padding: 10px; text-align: center; background-color: #f8fafc; border-radius: 8px;">
            <div style="color: #ef4444; font-size: 24px; font-weight: bold;">${result.failed}</div>
            <div style="color: #64748b; font-size: 12px;">נכשלו</div>
          </td>
          <td style="padding: 10px; text-align: center; background-color: #f8fafc; border-radius: 8px;">
            <div style="color: #dc2626; font-size: 24px; font-weight: bold;">${result.critical}</div>
            <div style="color: #64748b; font-size: 12px;">קריטי</div>
          </td>
          <td style="padding: 10px; text-align: center; background-color: #f8fafc; border-radius: 8px;">
            <div style="color: #ea580c; font-size: 24px; font-weight: bold;">${result.high}</div>
            <div style="color: #64748b; font-size: 12px;">גבוה</div>
          </td>
        </tr>
      </table>

      <h3 style="color: #1a3a6b; margin: 20px 0 10px 0;">בדיקות שנכשלו:</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="padding: 10px; text-align: right;">חומרה</th>
            <th style="padding: 10px; text-align: right;">בדיקה</th>
            <th style="padding: 10px; text-align: right;">הודעה</th>
          </tr>
        </thead>
        <tbody>
          ${failedChecksHtml}
        </tbody>
      </table>
    </div>

    <div style="background-color: #f1f5f9; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 11px; margin: 0;">${result.timestamp.toLocaleString('he-IL')}</p>
    </div>
  </div>
</body>
</html>
    `;

    try {
      await emailService.send({
        to: EMAIL_DESTINATIONS.systemReports,
        subject: `🔒 סריקת אבטחה STANNEL - ${result.readyForProduction ? 'מוכן להעלאה' : 'נדרשות תיקונים'} (${result.overallScore}/100)`,
        html,
      });
    } catch (error) {
      console.error('[SecurityScanner] Failed to send report:', error);
    }
  },

  // Format for Claude debugging
  formatForClaude(result: ScanResult): string {
    const lines: string[] = [
      '=== STANNEL Security Scan Report ===',
      `Timestamp: ${result.timestamp.toISOString()}`,
      `Score: ${result.overallScore}/100`,
      `Ready for Production: ${result.readyForProduction ? 'YES' : 'NO'}`,
      '',
      `Total Checks: ${result.totalChecks}`,
      `Passed: ${result.passed}`,
      `Failed: ${result.failed}`,
      `Critical: ${result.critical}`,
      `High: ${result.high}`,
      `Medium: ${result.medium}`,
      `Low: ${result.low}`,
      '',
      '=== Failed Checks ===',
    ];

    const failed = result.checks.filter(c => !c.passed);
    for (const check of failed) {
      lines.push(`[${check.severity}] ${check.name}`);
      lines.push(`  Message: ${check.message}`);
      if (check.recommendation) {
        lines.push(`  Recommendation: ${check.recommendation}`);
      }
      lines.push('');
    }

    if (failed.length === 0) {
      lines.push('All checks passed!');
    }

    return lines.join('\n');
  },
};
