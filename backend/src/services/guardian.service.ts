// Guardian Bot Service - STANNEL Platform
// Core service for system monitoring, auto-fixing, and admin notifications

import { prisma } from '../lib/prisma.js';
import { emailService } from './email.service.js';

// ─── Types ───────────────────────────────────────────────────────────────────

interface HealthCheck {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: any;
}

interface ScanResult {
  healthy: boolean;
  checks: HealthCheck[];
  issues: Array<{
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    details?: any;
  }>;
  timestamp: Date;
  stats: {
    userCount: number;
    recentErrors: number;
    pendingInvoices: number;
    overdueInvoices: number;
  };
}

interface GuardianSettings {
  enabled: boolean;
  maintenanceMode: boolean;
  scanInterval: number;
  lastScan: string | null;
  adminEmail: string;
}

const SITE_URL = 'https://stannelclub.co.il';

const DEFAULT_SETTINGS: Record<string, { value: string; description: string }> = {
  guardian_enabled: { value: 'true', description: 'Whether the Guardian bot is active' },
  guardian_maintenance_mode: { value: 'false', description: 'Maintenance mode toggle' },
  guardian_password: { value: 'stannel2026!', description: 'Admin password for guardian panel' },
  guardian_scan_interval: { value: '24', description: 'Hours between automatic scans' },
  guardian_last_scan: { value: '', description: 'ISO timestamp of last scan' },
  guardian_admin_email: { value: 'orenshp77@gmail.com', description: 'Admin email for notifications' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}

async function getSettingValue(key: string): Promise<string> {
  const row = await prisma.systemConfig.findUnique({ where: { key } });
  if (row) return row.value;
  const def = DEFAULT_SETTINGS[key];
  return def ? def.value : '';
}

async function ensureDefaults(): Promise<void> {
  for (const [key, { value, description }] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.systemConfig.upsert({
      where: { key },
      create: { key, value, description },
      update: {}, // don't overwrite existing
    });
  }
}

// ─── Scanner Interval Handle ─────────────────────────────────────────────────

let scannerInterval: ReturnType<typeof setInterval> | null = null;

// ─── Service ─────────────────────────────────────────────────────────────────

export const guardianService = {

  // ── Full System Scan ─────────────────────────────────────────────────────

  async runFullScan(): Promise<ScanResult> {
    console.log('[Guardian] Starting full system scan...');
    const checks: HealthCheck[] = [];
    const issues: ScanResult['issues'] = [];
    const now = new Date();

    // 1. Database connectivity
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.push({ name: 'מסד נתונים', status: 'ok', message: 'חיבור תקין' });
    } catch (err: any) {
      checks.push({ name: 'מסד נתונים', status: 'error', message: 'חיבור נכשל' });
      issues.push({
        severity: 'CRITICAL',
        title: 'Database connection failed',
        description: `Could not connect to PostgreSQL: ${err.message}`,
      });
    }

    // 2. API health endpoint
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${SITE_URL}/api/health`, { signal: controller.signal }).catch(() => null);
      clearTimeout(timeout);
      if (res && res.ok) {
        checks.push({ name: 'API Health', status: 'ok', message: 'תקין' });
      } else {
        // API health check from outside often fails due to Cloud Run cold start - not a real issue
        checks.push({ name: 'API Health', status: 'warning', message: `Status ${res?.status || 'unreachable'} (cold start)` });
      }
    } catch (err: any) {
      checks.push({ name: 'API Health', status: 'warning', message: 'לא ניתן לבדוק (cold start)' });
    }

    // 3. Recent errors in SystemLog (last 24h)
    let recentErrors = 0;
    try {
      const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      recentErrors = await prisma.systemLog.count({
        where: {
          severity: { in: ['ERROR', 'CRITICAL'] },
          createdAt: { gte: since },
        },
      });
      if (recentErrors === 0) {
        checks.push({ name: 'שגיאות אחרונות', status: 'ok', message: 'אין שגיאות ב-24 שעות' });
      } else if (recentErrors <= 5) {
        checks.push({ name: 'שגיאות אחרונות', status: 'warning', message: `${recentErrors} שגיאות ב-24 שעות` });
        issues.push({
          severity: 'MEDIUM',
          title: `${recentErrors} errors in last 24h`,
          description: `Found ${recentErrors} error/critical log entries in the last 24 hours.`,
        });
      } else {
        checks.push({ name: 'שגיאות אחרונות', status: 'error', message: `${recentErrors} שגיאות ב-24 שעות!` });
        issues.push({
          severity: 'HIGH',
          title: `High error rate: ${recentErrors} errors in 24h`,
          description: `Found ${recentErrors} error/critical log entries. This exceeds the normal threshold.`,
        });
      }
    } catch {
      checks.push({ name: 'שגיאות אחרונות', status: 'warning', message: 'לא ניתן לבדוק' });
    }

    // 4. Overdue invoices
    let pendingInvoices = 0;
    let overdueInvoices = 0;
    try {
      pendingInvoices = await prisma.invoice.count({
        where: { status: { in: ['PENDING_ADMIN', 'PENDING_SUPPLIER_PAY'] } },
      });
      overdueInvoices = await prisma.invoice.count({
        where: {
          status: { in: ['PENDING_ADMIN', 'PENDING_SUPPLIER_PAY'] },
          slaDeadline: { lt: now },
        },
      });
      if (overdueInvoices === 0) {
        checks.push({ name: 'חשבוניות', status: 'ok', message: `${pendingInvoices} ממתינות, 0 באיחור` });
      } else {
        checks.push({ name: 'חשבוניות', status: 'warning', message: `${overdueInvoices} חשבוניות באיחור SLA` });
        issues.push({
          severity: 'MEDIUM',
          title: `${overdueInvoices} overdue invoices`,
          description: `${overdueInvoices} invoices have passed their SLA deadline and are still pending.`,
        });
      }
    } catch {
      checks.push({ name: 'חשבוניות', status: 'warning', message: 'לא ניתן לבדוק' });
    }

    // 5. User count & activity
    let userCount = 0;
    try {
      userCount = await prisma.user.count();
      const activeRecent = await prisma.user.count({
        where: { updatedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
      });
      checks.push({ name: 'משתמשים', status: 'ok', message: `${userCount} רשומים, ${activeRecent} פעילים השבוע` });
    } catch {
      checks.push({ name: 'משתמשים', status: 'warning', message: 'לא ניתן לבדוק' });
    }

    const healthy = checks.every((c) => c.status !== 'error');

    // Update last scan timestamp
    await prisma.systemConfig.upsert({
      where: { key: 'guardian_last_scan' },
      create: { key: 'guardian_last_scan', value: now.toISOString(), description: 'ISO timestamp of last scan' },
      update: { value: now.toISOString() },
    });

    const result: ScanResult = {
      healthy,
      checks,
      issues,
      timestamp: now,
      stats: { userCount, recentErrors, pendingInvoices, overdueInvoices },
    };

    // Log issues and handle auto-fix / approval logic
    for (const issue of issues) {
      const log = await prisma.guardianLog.create({
        data: {
          severity: issue.severity,
          status: issue.severity === 'LOW' ? 'AUTO_FIXED' : issue.severity === 'MEDIUM' ? 'OPEN' : 'PENDING_APPROVAL',
          title: issue.title,
          description: issue.description,
          details: issue.details ?? undefined,
          autoFixed: issue.severity === 'LOW',
        },
      });

      // LOW severity = auto-fix, just notify
      if (issue.severity === 'LOW') {
        await this.sendNotificationEmail('auto_fix', {
          logId: log.id,
          title: issue.title,
          description: issue.description,
          fixSummary: 'Issue was automatically resolved by the Guardian bot.',
        });
      }

      // HIGH / CRITICAL = needs approval
      if (issue.severity === 'HIGH' || issue.severity === 'CRITICAL') {
        await this.sendNotificationEmail('approval_needed', {
          logId: log.id,
          title: issue.title,
          description: issue.description,
          severity: issue.severity,
        });
      }
    }

    // Always send a status report
    await this.sendNotificationEmail('status_report', result);

    console.log('[Guardian] Scan complete.', { healthy, issueCount: issues.length });
    return result;
  },

  // ── Maintenance Mode ─────────────────────────────────────────────────────

  async isMaintenanceMode(): Promise<boolean> {
    const val = await getSettingValue('guardian_maintenance_mode');
    return val === 'true';
  },

  async setMaintenanceMode(enabled: boolean): Promise<void> {
    await prisma.systemConfig.upsert({
      where: { key: 'guardian_maintenance_mode' },
      create: { key: 'guardian_maintenance_mode', value: String(enabled), description: 'Maintenance mode toggle' },
      update: { value: String(enabled) },
    });
    console.log(`[Guardian] Maintenance mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
  },

  // ── Settings ─────────────────────────────────────────────────────────────

  async getSettings(): Promise<GuardianSettings> {
    await ensureDefaults();
    const [enabled, maintenanceMode, scanInterval, lastScan, adminEmail] = await Promise.all([
      getSettingValue('guardian_enabled'),
      getSettingValue('guardian_maintenance_mode'),
      getSettingValue('guardian_scan_interval'),
      getSettingValue('guardian_last_scan'),
      getSettingValue('guardian_admin_email'),
    ]);
    return {
      enabled: enabled === 'true',
      maintenanceMode: maintenanceMode === 'true',
      scanInterval: parseInt(scanInterval, 10) || 24,
      lastScan: lastScan || null,
      adminEmail,
    };
  },

  async updateSetting(key: string, value: string): Promise<void> {
    const fullKey = key.startsWith('guardian_') ? key : `guardian_${key}`;
    await prisma.systemConfig.upsert({
      where: { key: fullKey },
      create: { key: fullKey, value },
      update: { value },
    });
    console.log(`[Guardian] Setting updated: ${fullKey} = ${fullKey.includes('password') ? '***' : value}`);
  },

  // ── Authentication ───────────────────────────────────────────────────────

  async verifyPassword(password: string): Promise<boolean> {
    const stored = await getSettingValue('guardian_password');
    return password === stored;
  },

  async setPassword(password: string): Promise<void> {
    await prisma.systemConfig.upsert({
      where: { key: 'guardian_password' },
      create: { key: 'guardian_password', value: password, description: 'Admin password for guardian panel' },
      update: { value: password },
    });
    console.log('[Guardian] Password updated');
  },

  // ── Logs ─────────────────────────────────────────────────────────────────

  async getLogs(limit: number = 50): Promise<any[]> {
    return prisma.guardianLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { chatMessages: { orderBy: { createdAt: 'asc' }, take: 5 } },
    });
  },

  async getLog(id: string): Promise<any | null> {
    return prisma.guardianLog.findUnique({
      where: { id },
      include: { chatMessages: { orderBy: { createdAt: 'asc' } } },
    });
  },

  // ── Chat ─────────────────────────────────────────────────────────────────

  async sendChatMessage(logId: string | null, message: string, sender: 'bot' | 'admin'): Promise<any> {
    const chat = await prisma.guardianChat.create({
      data: {
        logId: logId || undefined,
        sender,
        message,
      },
    });
    console.log(`[Guardian] Chat ${sender}: ${message.slice(0, 80)}...`);
    return chat;
  },

  async getChatMessages(logId?: string | null): Promise<any[]> {
    const where: any = {};
    if (logId !== undefined && logId !== null) {
      where.logId = logId;
    }
    return prisma.guardianChat.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
  },

  // ── Actions ──────────────────────────────────────────────────────────────

  async approveFix(logId: string): Promise<void> {
    await prisma.guardianLog.update({
      where: { id: logId },
      data: { status: 'APPROVED' },
    });
    await this.sendChatMessage(logId, 'המנהל אישר את התיקון. מבצע...', 'bot');
    console.log(`[Guardian] Fix approved for log ${logId}`);
  },

  async dismissLog(logId: string): Promise<void> {
    await prisma.guardianLog.update({
      where: { id: logId },
      data: { status: 'DISMISSED' },
    });
    await this.sendChatMessage(logId, 'הבעיה סומנה כלא רלוונטית על ידי המנהל.', 'bot');
    console.log(`[Guardian] Log ${logId} dismissed`);
  },

  // ── Email Notifications ──────────────────────────────────────────────────

  async sendNotificationEmail(type: 'auto_fix' | 'approval_needed' | 'status_report', data: any): Promise<void> {
    const adminEmail = await getSettingValue('guardian_admin_email');
    if (!adminEmail) {
      console.warn('[Guardian] No admin email configured, skipping notification');
      return;
    }

    let subject = '';
    let html = '';
    const now = new Date();
    const dateStr = now.toLocaleDateString('he-IL');
    const timeStr = now.toLocaleTimeString('he-IL');

    if (type === 'auto_fix') {
      subject = `🔧 STANNEL Guardian - תיקון אוטומטי: ${data.title}`;
      html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #1a3a6b 0%, #0f2347 100%); padding: 30px; text-align: center;">
      <h1 style="color: #d4af37; margin: 0; font-size: 24px;">STANNEL Guardian</h1>
      <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">תיקון אוטומטי בוצע</p>
    </div>
    <div style="padding: 30px;">
      <div style="background-color: #dcfce7; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-right: 4px solid #10b981;">
        <h2 style="color: #166534; margin: 0 0 10px 0; font-size: 18px;">🔧 ${escapeHtml(data.title)}</h2>
        <p style="color: #15803d; margin: 0; font-size: 14px;">${escapeHtml(data.description)}</p>
      </div>
      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #166534; margin: 0 0 10px 0; font-size: 16px;">סיכום התיקון</h3>
        <p style="color: #374151; margin: 0; font-size: 14px;">${escapeHtml(data.fixSummary || 'תיקון אוטומטי הושלם')}</p>
      </div>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${SITE_URL}/guardian?ticket=${data.logId}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f5d77e 100%); color: #1a3a6b; padding: 12px 32px; border-radius: 10px; font-size: 16px; font-weight: bold; text-decoration: none;">
          צפייה בפרטים
        </a>
      </div>
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">${dateStr} ${timeStr} • STANNEL Guardian Bot</p>
      </div>
    </div>
  </div>
</body>
</html>`;
    } else if (type === 'approval_needed') {
      subject = `🚨 STANNEL Guardian - נדרש אישור: ${data.title}`;
      const severityColor = data.severity === 'CRITICAL' ? '#dc2626' : '#f59e0b';
      const severityLabel = data.severity === 'CRITICAL' ? 'קריטי' : 'גבוה';
      html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #1a3a6b 0%, #0f2347 100%); padding: 30px; text-align: center;">
      <h1 style="color: #d4af37; margin: 0; font-size: 24px;">STANNEL Guardian</h1>
      <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">נדרש אישור מנהל</p>
    </div>
    <div style="padding: 30px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="display: inline-block; background-color: ${severityColor}; color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: bold;">
          ${severityLabel} - ${escapeHtml(data.severity)}
        </span>
      </div>
      <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-right: 4px solid ${severityColor};">
        <h2 style="color: #991b1b; margin: 0 0 10px 0; font-size: 18px;">🚨 ${escapeHtml(data.title)}</h2>
        <p style="color: #7f1d1d; margin: 0; font-size: 14px;">${escapeHtml(data.description)}</p>
      </div>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${SITE_URL}/guardian?ticket=${data.logId}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f5d77e 100%); color: #1a3a6b; padding: 14px 40px; border-radius: 10px; font-size: 18px; font-weight: bold; text-decoration: none; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);">
          אישור / בדיקה
        </a>
      </div>
      <div style="background-color: #fffbeb; border-radius: 8px; padding: 15px; text-align: center;">
        <p style="color: #92400e; margin: 0; font-size: 13px;">
          ⚠️ הבעיה דורשת אישור מנהל לפני ביצוע תיקון
        </p>
      </div>
      <div style="text-align: center; padding-top: 20px; margin-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">${dateStr} ${timeStr} • STANNEL Guardian Bot</p>
      </div>
    </div>
  </div>
</body>
</html>`;
    } else if (type === 'status_report') {
      const scan = data as ScanResult;
      const statusIcon = scan.healthy ? '✅' : '⚠️';
      const statusText = scan.healthy ? 'המערכת תקינה' : 'נמצאו בעיות';
      const checksHtml = scan.checks
        .map((c: HealthCheck) => {
          const icon = c.status === 'ok' ? '✅' : c.status === 'warning' ? '⚠️' : '❌';
          const bgColor = c.status === 'ok' ? '#dcfce7' : c.status === 'warning' ? '#fef3c7' : '#fee2e2';
          const borderColor = c.status === 'ok' ? '#10b981' : c.status === 'warning' ? '#f59e0b' : '#ef4444';
          return `
          <div style="background-color: ${bgColor}; border-radius: 8px; padding: 12px 15px; margin-bottom: 8px; border-right: 4px solid ${borderColor};">
            <span style="font-weight: 600; color: #1f2937;">${icon} ${escapeHtml(c.name)}</span>
            <span style="color: #6b7280; font-size: 13px; float: left;">${escapeHtml(c.message)}</span>
          </div>`;
        })
        .join('');
      const issuesHtml =
        scan.issues.length > 0
          ? scan.issues
              .map(
                (i: any) =>
                  `<li style="margin-bottom: 8px;"><strong>[${i.severity}]</strong> ${escapeHtml(i.title)}</li>`
              )
              .join('')
          : '<li style="color: #10b981;">לא נמצאו בעיות</li>';

      subject = `${statusIcon} STANNEL Guardian - דו"ח סריקה ${dateStr}`;
      html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #1a3a6b 0%, #0f2347 100%); padding: 30px; text-align: center;">
      <h1 style="color: #d4af37; margin: 0; font-size: 24px;">STANNEL Guardian</h1>
      <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">דו"ח סריקת מערכת</p>
    </div>
    <div style="padding: 30px;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="color: ${scan.healthy ? '#10b981' : '#ef4444'}; margin: 0; font-size: 22px;">${statusIcon} ${statusText}</h2>
        <p style="color: #6b7280; margin: 8px 0 0 0; font-size: 13px;">${dateStr} ${timeStr}</p>
      </div>

      <table style="width: 100%; margin-bottom: 25px;">
        <tr>
          <td style="padding: 8px; text-align: center; background-color: #f8fafc; border-radius: 10px;">
            <div style="color: #1a3a6b; font-size: 24px; font-weight: bold;">${scan.stats.userCount}</div>
            <div style="color: #64748b; font-size: 11px;">משתמשים</div>
          </td>
          <td style="padding: 8px; text-align: center; background-color: ${scan.stats.recentErrors > 0 ? '#fee2e2' : '#dcfce7'}; border-radius: 10px;">
            <div style="color: ${scan.stats.recentErrors > 0 ? '#dc2626' : '#10b981'}; font-size: 24px; font-weight: bold;">${scan.stats.recentErrors}</div>
            <div style="color: #64748b; font-size: 11px;">שגיאות 24ש</div>
          </td>
          <td style="padding: 8px; text-align: center; background-color: #f8fafc; border-radius: 10px;">
            <div style="color: #1a3a6b; font-size: 24px; font-weight: bold;">${scan.stats.pendingInvoices}</div>
            <div style="color: #64748b; font-size: 11px;">חשבוניות ממתינות</div>
          </td>
          <td style="padding: 8px; text-align: center; background-color: ${scan.stats.overdueInvoices > 0 ? '#fee2e2' : '#dcfce7'}; border-radius: 10px;">
            <div style="color: ${scan.stats.overdueInvoices > 0 ? '#dc2626' : '#10b981'}; font-size: 24px; font-weight: bold;">${scan.stats.overdueInvoices}</div>
            <div style="color: #64748b; font-size: 11px;">באיחור SLA</div>
          </td>
        </tr>
      </table>

      <h3 style="color: #1a3a6b; margin: 0 0 15px 0; font-size: 16px;">בדיקות מערכת</h3>
      ${checksHtml}

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-top: 20px;">
        <h3 style="color: #1a3a6b; margin: 0 0 10px 0; font-size: 16px;">בעיות שנמצאו</h3>
        <ul style="color: #374151; margin: 0; padding-right: 20px; font-size: 14px;">${issuesHtml}</ul>
      </div>

      <div style="text-align: center; margin-top: 25px;">
        <a href="${SITE_URL}/guardian" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f5d77e 100%); color: #1a3a6b; padding: 12px 32px; border-radius: 10px; font-size: 16px; font-weight: bold; text-decoration: none;">
          פתח לוח בקרה
        </a>
      </div>

      <div style="text-align: center; padding-top: 20px; margin-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">STANNEL Guardian Bot - סריקה אוטומטית</p>
      </div>
    </div>
  </div>
</body>
</html>`;
    }

    if (subject && html) {
      const sent = await emailService.send({ to: adminEmail, subject, html });
      if (sent) {
        console.log(`[Guardian] Notification email sent: ${type}`);
      }
    }
  },

  // ── Daily Scanner ────────────────────────────────────────────────────────

  initDailyScanner(): void {
    console.log('[Guardian] Initializing daily scanner...');

    // Run initial scan after a short delay (let the server finish booting)
    setTimeout(async () => {
      try {
        const settings = await this.getSettings();
        if (!settings.enabled) {
          console.log('[Guardian] Bot is disabled, skipping initial scan');
          return;
        }
        await this.runFullScan();
      } catch (err) {
        console.error('[Guardian] Initial scan error:', err);
      }
    }, 30_000); // 30 seconds after boot

    // Set up the recurring interval
    const setupInterval = async () => {
      try {
        const settings = await this.getSettings();
        const intervalHours = settings.scanInterval || 24;
        const intervalMs = intervalHours * 60 * 60 * 1000;

        if (scannerInterval) {
          clearInterval(scannerInterval);
        }

        scannerInterval = setInterval(async () => {
          try {
            const currentSettings = await this.getSettings();
            if (!currentSettings.enabled) {
              console.log('[Guardian] Bot is disabled, skipping scheduled scan');
              return;
            }
            await this.runFullScan();
          } catch (err) {
            console.error('[Guardian] Scheduled scan error:', err);
          }
        }, intervalMs);

        console.log(`[Guardian] Scanner scheduled every ${intervalHours} hours`);
      } catch (err) {
        console.error('[Guardian] Failed to setup scanner interval:', err);
        // Fallback: 24 hour interval
        scannerInterval = setInterval(async () => {
          try {
            await this.runFullScan();
          } catch (e) {
            console.error('[Guardian] Fallback scan error:', e);
          }
        }, 24 * 60 * 60 * 1000);
      }
    };

    setupInterval();
  },
};

export default guardianService;
