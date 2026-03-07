// System Scanner Service - STANNEL Platform
// Comprehensive nightly system scan at 1:00 AM
// Tests all endpoints, database, and system functions

import { prisma } from '../lib/prisma.js';
import { emailService } from './email.service.js';

const ADMIN_EMAILS = ['orenshp77@gmail.com'];
const API_BASE_URL = `http://localhost:${process.env.PORT || 7070}`;

interface ScanResult {
  name: string;
  category: 'API' | 'DATABASE' | 'SECURITY' | 'PERFORMANCE' | 'BUSINESS';
  status: 'ok' | 'warning' | 'error';
  message: string;
  responseTime?: number;
  details?: string; // For Claude to fix
}

interface ScanReport {
  scanId: string;
  startTime: Date;
  endTime: Date;
  totalTests: number;
  passed: number;
  warnings: number;
  failed: number;
  results: ScanResult[];
}

export const systemScannerService = {
  /**
   * Run comprehensive system scan
   */
  async runFullScan(): Promise<ScanReport> {
    const scanId = `SCAN-${Date.now()}`;
    const startTime = new Date();
    const results: ScanResult[] = [];

    console.log(`[SystemScanner] Starting full scan: ${scanId}`);

    // 1. Database Tests
    results.push(...await this.scanDatabase());

    // 2. API Endpoint Tests
    results.push(...await this.scanApiEndpoints());

    // 3. Business Logic Tests
    results.push(...await this.scanBusinessLogic());

    // 4. Performance Tests
    results.push(...await this.scanPerformance());

    // 5. Security Tests
    results.push(...await this.scanSecurity());

    const endTime = new Date();

    const report: ScanReport = {
      scanId,
      startTime,
      endTime,
      totalTests: results.length,
      passed: results.filter(r => r.status === 'ok').length,
      warnings: results.filter(r => r.status === 'warning').length,
      failed: results.filter(r => r.status === 'error').length,
      results,
    };

    // Log failures to database
    await this.logFailures(report);

    // Save report to database
    await this.saveScanReport(report);

    // Send email report
    await this.sendScanReport(report);

    console.log(`[SystemScanner] Scan completed: ${report.passed}/${report.totalTests} passed`);

    return report;
  },

  /**
   * Database connectivity and integrity tests
   */
  async scanDatabase(): Promise<ScanResult[]> {
    const results: ScanResult[] = [];

    // Test 1: Database connection
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;

      results.push({
        name: 'חיבור למסד הנתונים',
        category: 'DATABASE',
        status: responseTime < 100 ? 'ok' : 'warning',
        message: `מסד הנתונים מגיב (${responseTime}ms)`,
        responseTime,
      });
    } catch (error) {
      results.push({
        name: 'חיבור למסד הנתונים',
        category: 'DATABASE',
        status: 'error',
        message: 'מסד הנתונים לא מגיב',
        details: `Database Connection Error:\n${error instanceof Error ? error.message : String(error)}\n\nStack: ${error instanceof Error ? error.stack : 'N/A'}`,
      });
    }

    // Test 2: Table integrity
    const tables = ['User', 'Invoice', 'Product', 'Event', 'ArchitectProfile', 'SupplierProfile'];
    for (const table of tables) {
      try {
        const start = Date.now();
        const count = await (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)].count();
        const responseTime = Date.now() - start;

        results.push({
          name: `טבלת ${table}`,
          category: 'DATABASE',
          status: 'ok',
          message: `${count} רשומות (${responseTime}ms)`,
          responseTime,
        });
      } catch (error) {
        results.push({
          name: `טבלת ${table}`,
          category: 'DATABASE',
          status: 'error',
          message: `שגיאה בגישה לטבלה`,
          details: `Table Access Error - ${table}:\n${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    return results;
  },

  /**
   * API endpoint tests
   */
  async scanApiEndpoints(): Promise<ScanResult[]> {
    const results: ScanResult[] = [];

    // List of endpoints to test
    const endpoints = [
      { method: 'GET', path: '/health', name: 'Health Check', expectedStatus: 200 },
      { method: 'GET', path: '/', name: 'Root Endpoint', expectedStatus: 200 },
      { method: 'GET', path: '/api/v1/events', name: 'Events List', expectedStatus: 200 },
      { method: 'GET', path: '/api/v1/rewards/products', name: 'Products List', expectedStatus: 200 },
      { method: 'POST', path: '/api/v1/auth/login', name: 'Login (no body)', expectedStatus: 400 },
      { method: 'GET', path: '/api/v1/auth/me', name: 'Auth Check (no token)', expectedStatus: 401 },
      { method: 'GET', path: '/api/v1/admin/users', name: 'Admin (no auth)', expectedStatus: 401 },
    ];

    for (const endpoint of endpoints) {
      try {
        const start = Date.now();
        const response = await fetch(`${API_BASE_URL}${endpoint.path}`, {
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(10000),
        });
        const responseTime = Date.now() - start;

        const statusOk = response.status === endpoint.expectedStatus;

        results.push({
          name: endpoint.name,
          category: 'API',
          status: statusOk ? 'ok' : 'error',
          message: statusOk
            ? `סטטוס ${response.status} (${responseTime}ms)`
            : `צפוי ${endpoint.expectedStatus}, התקבל ${response.status}`,
          responseTime,
          details: !statusOk ? `API Test Failed:\nEndpoint: ${endpoint.method} ${endpoint.path}\nExpected: ${endpoint.expectedStatus}\nReceived: ${response.status}` : undefined,
        });
      } catch (error) {
        results.push({
          name: endpoint.name,
          category: 'API',
          status: 'error',
          message: `הנקודה לא מגיבה`,
          details: `API Endpoint Error:\nEndpoint: ${endpoint.method} ${endpoint.path}\nError: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    return results;
  },

  /**
   * Business logic tests
   */
  async scanBusinessLogic(): Promise<ScanResult[]> {
    const results: ScanResult[] = [];

    // Test 1: Check for orphaned invoices (no architect)
    try {
      const orphanedInvoices = await prisma.invoice.findMany({
        where: {
          architect: null,
        },
        select: { id: true },
      });

      results.push({
        name: 'חשבוניות ללא אדריכל',
        category: 'BUSINESS',
        status: orphanedInvoices.length === 0 ? 'ok' : 'error',
        message: orphanedInvoices.length === 0 ? 'לא נמצאו' : `${orphanedInvoices.length} חשבוניות יתומות`,
        details: orphanedInvoices.length > 0 ? `Orphaned Invoices Found:\nIDs: ${orphanedInvoices.map(i => i.id).join(', ')}\n\nFix: These invoices have no associated architect. Either delete them or reassign.` : undefined,
      });
    } catch (error) {
      // Skip if table doesn't exist yet
    }

    // Test 2: Check for negative balances
    try {
      const negativeBalances = await prisma.architectProfile.findMany({
        where: {
          OR: [
            { pointsBalance: { lt: 0 } },
            { cashBalance: { lt: 0 } },
          ],
        },
        include: { user: { select: { email: true, name: true } } },
      });

      results.push({
        name: 'יתרות שליליות',
        category: 'BUSINESS',
        status: negativeBalances.length === 0 ? 'ok' : 'warning',
        message: negativeBalances.length === 0 ? 'לא נמצאו' : `${negativeBalances.length} משתמשים עם יתרה שלילית`,
        details: negativeBalances.length > 0 ? `Negative Balances Found:\n${negativeBalances.map(a => `- ${a.user.name} (${a.user.email}): Points=${a.pointsBalance}, Cash=${a.cashBalance}`).join('\n')}\n\nFix: Investigate why balances went negative.` : undefined,
      });
    } catch (error) {
      // Skip
    }

    // Test 3: Check SLA violations (invoices pending > 3 days)
    try {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const slaViolations = await prisma.invoice.count({
        where: {
          status: 'PENDING_ADMIN',
          createdAt: { lt: threeDaysAgo },
        },
      });

      results.push({
        name: 'הפרות SLA',
        category: 'BUSINESS',
        status: slaViolations === 0 ? 'ok' : slaViolations < 5 ? 'warning' : 'error',
        message: slaViolations === 0 ? 'אין הפרות' : `${slaViolations} חשבוניות ממתינות מעל 3 ימים`,
        details: slaViolations > 0 ? `SLA Violations:\n${slaViolations} invoices have been pending for more than 3 days.\n\nFix: Review and process these invoices in the admin panel.` : undefined,
      });
    } catch (error) {
      // Skip
    }

    // Test 4: Check for expired events still visible
    try {
      const expiredEvents = await prisma.event.count({
        where: {
          date: { lt: new Date() },
          isHidden: false,
        },
      });

      results.push({
        name: 'אירועים שעברו',
        category: 'BUSINESS',
        status: expiredEvents === 0 ? 'ok' : 'warning',
        message: expiredEvents === 0 ? 'אין אירועים פגי תוקף' : `${expiredEvents} אירועים שעברו עדיין מוצגים`,
        details: expiredEvents > 0 ? `Expired Events Still Visible:\n${expiredEvents} events have passed but are still visible.\n\nFix: Run: prisma.event.updateMany({ where: { date: { lt: new Date() } }, data: { isHidden: true } })` : undefined,
      });
    } catch (error) {
      // Skip
    }

    // Test 5: Check products with 0 stock
    try {
      const outOfStock = await prisma.product.count({
        where: {
          stock: 0,
          isActive: true,
        },
      });

      results.push({
        name: 'מוצרים אזלו מהמלאי',
        category: 'BUSINESS',
        status: outOfStock === 0 ? 'ok' : 'warning',
        message: outOfStock === 0 ? 'כל המוצרים במלאי' : `${outOfStock} מוצרים פעילים ללא מלאי`,
      });
    } catch (error) {
      // Skip
    }

    return results;
  },

  /**
   * Performance tests
   */
  async scanPerformance(): Promise<ScanResult[]> {
    const results: ScanResult[] = [];

    // Test 1: Database query performance
    try {
      const start = Date.now();
      await prisma.invoice.findMany({
        take: 100,
        include: {
          architect: { include: { user: true } },
          supplier: { include: { user: true } },
        },
      });
      const responseTime = Date.now() - start;

      results.push({
        name: 'ביצועי שאילתות',
        category: 'PERFORMANCE',
        status: responseTime < 500 ? 'ok' : responseTime < 2000 ? 'warning' : 'error',
        message: `שאילתה מורכבת ב-${responseTime}ms`,
        responseTime,
        details: responseTime >= 2000 ? `Slow Query Detected:\nComplex invoice query took ${responseTime}ms\n\nFix: Consider adding indexes or optimizing the query.` : undefined,
      });
    } catch (error) {
      // Skip
    }

    // Test 2: Memory usage (basic check)
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const heapPercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

    results.push({
      name: 'שימוש בזיכרון',
      category: 'PERFORMANCE',
      status: heapPercent < 70 ? 'ok' : heapPercent < 90 ? 'warning' : 'error',
      message: `${heapUsedMB}MB / ${heapTotalMB}MB (${heapPercent}%)`,
      details: heapPercent >= 90 ? `High Memory Usage:\nHeap: ${heapUsedMB}MB / ${heapTotalMB}MB (${heapPercent}%)\n\nFix: Consider restarting the server or investigating memory leaks.` : undefined,
    });

    return results;
  },

  /**
   * Security tests
   */
  async scanSecurity(): Promise<ScanResult[]> {
    const results: ScanResult[] = [];

    // Test 1: Check for users without Firebase UID
    try {
      const usersWithoutFirebase = await prisma.user.count({
        where: { firebaseUid: '' },
      });

      results.push({
        name: 'משתמשים ללא Firebase',
        category: 'SECURITY',
        status: usersWithoutFirebase === 0 ? 'ok' : 'error',
        message: usersWithoutFirebase === 0 ? 'כל המשתמשים מאומתים' : `${usersWithoutFirebase} משתמשים ללא אימות`,
        details: usersWithoutFirebase > 0 ? `Users Without Firebase Auth:\n${usersWithoutFirebase} users have no Firebase UID.\n\nFix: These users cannot authenticate. Either delete them or fix their Firebase linking.` : undefined,
      });
    } catch (error) {
      // Skip
    }

    // Test 2: Check admin count (should be limited)
    try {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' },
      });

      results.push({
        name: 'מספר מנהלים',
        category: 'SECURITY',
        status: adminCount <= 5 ? 'ok' : 'warning',
        message: `${adminCount} מנהלי מערכת`,
        details: adminCount > 5 ? `High Admin Count:\n${adminCount} admin users exist.\n\nFix: Review if all these admin accounts are necessary.` : undefined,
      });
    } catch (error) {
      // Skip
    }

    // Test 3: Test unauthorized access protection
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/users`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      results.push({
        name: 'הגנת Admin',
        category: 'SECURITY',
        status: response.status === 401 ? 'ok' : 'error',
        message: response.status === 401 ? 'גישה חסומה כנדרש' : `שגיאה: סטטוס ${response.status}`,
        details: response.status !== 401 ? `Admin Protection Failed:\nExpected 401 Unauthorized, got ${response.status}\n\nFix: Check authMiddleware and requireAdmin middleware.` : undefined,
      });
    } catch (error) {
      // Skip
    }

    return results;
  },

  /**
   * Log failures to database
   */
  async logFailures(report: ScanReport): Promise<void> {
    const failedResults = report.results.filter(r => r.status === 'error' || r.status === 'warning');

    for (const result of failedResults) {
      try {
        await prisma.systemLog.create({
          data: {
            severity: result.status === 'error' ? 'ERROR' : 'WARNING',
            category: this.mapCategory(result.category),
            title: result.name,
            message: result.message,
            details: result.details,
            responseTime: result.responseTime,
          },
        });
      } catch (error) {
        console.error('[SystemScanner] Failed to log:', error);
      }
    }
  },

  /**
   * Save scan report to database with Claude-ready format
   */
  async saveScanReport(report: ScanReport): Promise<void> {
    try {
      // Count errors in last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const errorsLast24h = await prisma.systemLog.count({
        where: {
          createdAt: { gte: oneDayAgo },
          severity: { in: ['ERROR', 'CRITICAL'] },
        },
      });

      // Generate Claude-ready format
      const claudeFormat = this.generateClaudeFormat(report, errorsLast24h);

      await prisma.systemScanReport.create({
        data: {
          isHealthy: report.failed === 0,
          checksRun: report.totalTests,
          checksPassed: report.passed,
          checksFailed: report.failed,
          checksWarnings: report.warnings,
          results: report.results as any,
          errorsLast24h,
          claudeFormat,
          emailSent: true,
          sentTo: ADMIN_EMAILS,
        },
      });
    } catch (error) {
      console.error('[SystemScanner] Failed to save report:', error);
    }
  },

  /**
   * Generate Claude-ready format for easy troubleshooting
   */
  generateClaudeFormat(report: ScanReport, errorsLast24h: number): string {
    const failedChecks = report.results.filter(r => r.status === 'error');
    const warningChecks = report.results.filter(r => r.status === 'warning');

    let format = `
## STANNEL System Scan Report
**Scan ID:** ${report.scanId}
**Time:** ${report.startTime.toISOString()}
**Duration:** ${(report.endTime.getTime() - report.startTime.getTime()) / 1000}s

### Summary
- **Total Checks:** ${report.totalTests}
- **Passed:** ${report.passed} ✅
- **Warnings:** ${report.warnings} ⚠️
- **Failed:** ${report.failed} ❌
- **Errors (Last 24h):** ${errorsLast24h}

### Status: ${report.failed === 0 ? '✅ HEALTHY' : '❌ ISSUES DETECTED'}
`;

    if (failedChecks.length > 0) {
      format += `
### ❌ Failed Checks
${failedChecks.map(r => `
**${r.name}** (${r.category})
- Status: ${r.status}
- Message: ${r.message}
${r.details ? `\`\`\`\n${r.details}\n\`\`\`` : ''}
`).join('\n')}
`;
    }

    if (warningChecks.length > 0) {
      format += `
### ⚠️ Warnings
${warningChecks.map(r => `
**${r.name}** (${r.category})
- Message: ${r.message}
${r.details ? `\`\`\`\n${r.details}\n\`\`\`` : ''}
`).join('\n')}
`;
    }

    format += `
---
Please analyze these issues and provide fixes for the STANNEL platform.
Tech stack: Next.js, Fastify, Prisma, PostgreSQL, Firebase Auth, Google Cloud Run.
`;

    return format.trim();
  },

  /**
   * Get latest scan report
   */
  async getLatestReport() {
    return prisma.systemScanReport.findFirst({
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get recent scan reports
   */
  async getRecentReports(limit: number = 10) {
    return prisma.systemScanReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  mapCategory(category: string): 'HEALTH_CHECK' | 'SECURITY' | 'API_TEST' | 'DATABASE' | 'PERFORMANCE' | 'SCHEDULER' {
    const map: Record<string, 'HEALTH_CHECK' | 'SECURITY' | 'API_TEST' | 'DATABASE' | 'PERFORMANCE' | 'SCHEDULER'> = {
      'API': 'API_TEST',
      'DATABASE': 'DATABASE',
      'SECURITY': 'SECURITY',
      'PERFORMANCE': 'PERFORMANCE',
      'BUSINESS': 'HEALTH_CHECK',
    };
    return map[category] || 'HEALTH_CHECK';
  },

  /**
   * Send scan report email
   */
  async sendScanReport(report: ScanReport): Promise<void> {
    const allOk = report.failed === 0;

    const resultsHtml = report.results.map(r => {
      const icon = r.status === 'ok' ? '✅' : r.status === 'warning' ? '⚠️' : '❌';
      const bgColor = r.status === 'ok' ? '#dcfce7' : r.status === 'warning' ? '#fef3c7' : '#fee2e2';
      const borderColor = r.status === 'ok' ? '#10b981' : r.status === 'warning' ? '#f59e0b' : '#ef4444';

      return `
        <div style="background-color: ${bgColor}; border-radius: 8px; padding: 12px; margin-bottom: 8px; border-right: 4px solid ${borderColor};">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; color: #1f2937;">${icon} ${r.name}</span>
            <span style="color: #6b7280; font-size: 13px;">${r.message}</span>
          </div>
          ${r.responseTime ? `<span style="color: #9ca3af; font-size: 11px;">${r.responseTime}ms</span>` : ''}
        </div>
      `;
    }).join('');

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 700px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, ${allOk ? '#10b981' : '#ef4444'} 0%, ${allOk ? '#059669' : '#dc2626'} 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">
        ${allOk ? '✅' : '⚠️'} סריקת מערכת לילית - STANNEL
      </h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">
        ${report.startTime.toLocaleDateString('he-IL')} ${report.startTime.toLocaleTimeString('he-IL')}
      </p>
    </div>

    <div style="padding: 20px;">
      <!-- Summary Stats -->
      <div style="display: flex; gap: 10px; margin-bottom: 20px; text-align: center;">
        <div style="flex: 1; background: #dcfce7; padding: 15px; border-radius: 8px;">
          <div style="font-size: 28px; font-weight: bold; color: #10b981;">${report.passed}</div>
          <div style="color: #166534; font-size: 12px;">עברו</div>
        </div>
        <div style="flex: 1; background: #fef3c7; padding: 15px; border-radius: 8px;">
          <div style="font-size: 28px; font-weight: bold; color: #f59e0b;">${report.warnings}</div>
          <div style="color: #92400e; font-size: 12px;">אזהרות</div>
        </div>
        <div style="flex: 1; background: #fee2e2; padding: 15px; border-radius: 8px;">
          <div style="font-size: 28px; font-weight: bold; color: #ef4444;">${report.failed}</div>
          <div style="color: #991b1b; font-size: 12px;">נכשלו</div>
        </div>
      </div>

      <!-- Results -->
      <h3 style="color: #1f2937; margin-bottom: 15px;">תוצאות הסריקה (${report.totalTests} בדיקות)</h3>
      ${resultsHtml}

      ${report.failed > 0 ? `
      <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin-top: 20px;">
        <h4 style="color: #dc2626; margin: 0 0 10px 0;">🔧 לתיקון התקלות:</h4>
        <p style="color: #7f1d1d; font-size: 14px; margin: 0;">
          היכנס ל-<strong>/api/v1/admin/logs</strong> לצפייה בפרטי השגיאות.<br>
          העתק את פרטי השגיאה והדבק ב-Claude לתיקון מהיר.
        </p>
      </div>
      ` : ''}

      <div style="text-align: center; padding-top: 20px; margin-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #6b7280; font-size: 12px;">
          סריקה אוטומטית כל לילה ב-01:00 | STANNEL Platform
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    await emailService.send({
      to: ADMIN_EMAILS,
      subject: `${allOk ? '✅' : '⚠️'} סריקת מערכת: ${report.passed}/${report.totalTests} בדיקות עברו`,
      html,
    });
  },

  /**
   * Initialize nightly scanner (runs at 1:00 AM)
   */
  initNightlyScanner(): void {
    const scheduleNextScan = () => {
      const now = new Date();
      const targetHour = 1; // 1:00 AM

      const nextScan = new Date(now);
      nextScan.setHours(targetHour, 0, 0, 0);

      if (now.getHours() >= targetHour) {
        nextScan.setDate(nextScan.getDate() + 1);
      }

      const msUntilScan = nextScan.getTime() - now.getTime();

      console.log(`[SystemScanner] Next scan scheduled for: ${nextScan.toLocaleString('he-IL')}`);

      setTimeout(async () => {
        await this.runFullScan();
        scheduleNextScan();
      }, msUntilScan);
    };

    scheduleNextScan();
    console.log('[SystemScanner] Nightly scanner initialized (runs at 01:00)');
  },
};
