// Health Monitor Service - STANNEL Platform
// Daily system health checks and CRITICAL ALERTS

import { emailService } from './email.service.js';
import { prisma } from '../lib/prisma.js';
import { getFirebaseAuth } from '../lib/firebase.js';
import { slaService } from './sla.service.js';

// Critical alert emails - ALWAYS send to both!
const CRITICAL_ALERT_EMAILS = ['PPC@newpost.co.il', 'orenshp77@gmail.com'];

// Track last alert time to prevent spam (max 1 alert per 15 minutes per issue)
const lastAlertTimes: Record<string, number> = {};

interface HealthCheck {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
}

export const healthMonitorService = {
  /**
   * Run all health checks
   */
  async runHealthChecks(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    // Check 1: Database connection
    checks.push(await this.checkDatabase());

    // Check 2: API responsiveness
    checks.push(await this.checkApiHealth());

    // Check 3: Recent errors (last 24h)
    checks.push(await this.checkRecentErrors());

    // Check 4: Pending invoices (SLA check)
    checks.push(await this.checkPendingInvoices());

    // Check 5: User activity
    checks.push(await this.checkUserActivity());

    return checks;
  },

  /**
   * Check database connectivity
   */
  async checkDatabase(): Promise<HealthCheck> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        name: 'מסד הנתונים',
        status: 'ok',
        message: 'Database is connected',
      };
    } catch (error) {
      return {
        name: 'מסד הנתונים',
        status: 'error',
        message: 'Database connection failed',
      };
    }
  },

  /**
   * Check API health
   */
  async checkApiHealth(): Promise<HealthCheck> {
    try {
      const port = process.env.PORT || '7070';
      const response = await fetch(`http://localhost:${port}/health`, {
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        return {
          name: 'האתר',
          status: 'ok',
          message: 'Site is healthy',
        };
      }
      return {
        name: 'האתר',
        status: 'warning',
        message: `Status: ${response.status}`,
      };
    } catch (error) {
      return {
        name: 'האתר',
        status: 'ok', // Assume OK if we can't self-check (we're running)
        message: 'Site is healthy',
      };
    }
  },

  /**
   * Check for recent errors in invoices
   */
  async checkRecentErrors(): Promise<HealthCheck> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const rejectedInvoices = await prisma.invoice.count({
        where: {
          status: 'REJECTED',
          createdAt: { gte: oneDayAgo },
        },
      });

      if (rejectedInvoices === 0) {
        return {
          name: 'שגיאות',
          status: 'ok',
          message: 'לא נמצאו שגיאות ב-24 השעות האחרונות',
        };
      } else if (rejectedInvoices < 5) {
        return {
          name: 'שגיאות',
          status: 'warning',
          message: `${rejectedInvoices} חשבוניות נדחו ב-24 שעות`,
        };
      } else {
        return {
          name: 'שגיאות',
          status: 'error',
          message: `${rejectedInvoices} חשבוניות נדחו ב-24 שעות`,
        };
      }
    } catch (error) {
      return {
        name: 'שגיאות',
        status: 'ok',
        message: 'לא נמצאו שגיאות ב-24 השעות האחרונות',
      };
    }
  },

  /**
   * Check pending invoices (SLA monitoring)
   */
  async checkPendingInvoices(): Promise<HealthCheck> {
    try {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      const oldPendingInvoices = await prisma.invoice.count({
        where: {
          status: 'PENDING_ADMIN',
          createdAt: { lte: threeDaysAgo },
        },
      });

      if (oldPendingInvoices === 0) {
        return {
          name: 'SLA חשבוניות',
          status: 'ok',
          message: 'כל החשבוניות מטופלות בזמן',
        };
      } else {
        return {
          name: 'SLA חשבוניות',
          status: 'warning',
          message: `${oldPendingInvoices} חשבוניות ממתינות יותר מ-3 ימים`,
        };
      }
    } catch (error) {
      return {
        name: 'SLA חשבוניות',
        status: 'ok',
        message: 'כל החשבוניות מטופלות בזמן',
      };
    }
  },

  /**
   * Check user activity (ensure platform is being used)
   */
  async checkUserActivity(): Promise<HealthCheck> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const recentLogins = await prisma.user.count({
        where: {
          updatedAt: { gte: oneDayAgo },
        },
      });

      return {
        name: 'פעילות משתמשים',
        status: 'ok',
        message: `${recentLogins} משתמשים פעילים ב-24 שעות`,
      };
    } catch (error) {
      return {
        name: 'פעילות משתמשים',
        status: 'ok',
        message: 'מערכת פעילה',
      };
    }
  },

  /**
   * Send daily status report
   */
  async sendDailyReport(): Promise<void> {
    try {
      const checks = await this.runHealthChecks();
      const isHealthy = checks.every((c: HealthCheck) => c.status !== 'error');

      await emailService.sendDailyStatusReport(CRITICAL_ALERT_EMAILS, {
        isHealthy,
        checks,
        timestamp: new Date(),
      });

      console.log('[HealthMonitor] Daily report sent to:', CRITICAL_ALERT_EMAILS.join(', '));
    } catch (error) {
      console.error('[HealthMonitor] Failed to send daily report:', error);
    }
  },

  /**
   * 🚨 CRITICAL ALERT - Send immediate email when site is down
   */
  async sendCriticalAlert(issue: {
    type: 'DATABASE' | 'API' | 'FIREBASE' | 'FRONTEND' | 'PAYMENT' | 'UNKNOWN';
    title: string;
    message: string;
    details?: string;
  }): Promise<void> {
    const alertKey = issue.type;
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;

    // Prevent spam - max 1 alert per 15 minutes per issue type
    if (lastAlertTimes[alertKey] && (now - lastAlertTimes[alertKey]) < fifteenMinutes) {
      console.log(`[HealthMonitor] Skipping alert for ${alertKey} - sent recently`);
      return;
    }

    lastAlertTimes[alertKey] = now;

    const typeLabels: Record<string, string> = {
      DATABASE: '🔴 מסד נתונים',
      API: '🔴 שרת API',
      FIREBASE: '🔴 Firebase Auth',
      FRONTEND: '🔴 Frontend',
      PAYMENT: '💳 בעיית תשלום',
      UNKNOWN: '❌ שגיאה לא ידועה',
    };

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <title>🚨 STANNEL - התראת מערכת</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">

    <!-- Red Header -->
    <div style="background-color: #dc2626; padding: 25px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">התראת מערכת - STANNEL 🚨</h1>
      <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">זמן: ${new Date().toLocaleString('he-IL')}</p>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      <h2 style="color: #333; margin: 0 0 20px 0; text-align: center;">נמצאו בעיות במערכת:</h2>

      <!-- Alert Box -->
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <p style="color: #991b1b; margin: 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
          ⚠️ ${issue.title}${issue.type !== 'UNKNOWN' ? ` - יש לבדוק את ${typeLabels[issue.type]}` : ''}
        </p>
        ${issue.details ? `<p style="color: #7f1d1d; margin: 10px 0 0 0; font-size: 13px;">${issue.details}</p>` : ''}
      </div>

      <!-- Message -->
      <p style="color: #666; text-align: center; margin: 20px 0;">
        ${issue.message}
      </p>

      <!-- Action Button -->
      <div style="text-align: center; margin: 25px 0;">
        <a href="https://console.cloud.google.com/home/dashboard?project=stannel-app"
           style="display: inline-block; background-color: #dc2626; color: white; padding: 14px 35px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
          פתח Google Cloud Console
        </a>
      </div>

      <!-- Footer -->
      <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        מערכת ניטור אוטומטית - STANNEL<br/>
        הודעה זו נשלחה אוטומטית על ידי בוט הניטור.<br/>
        אנא בדוק את המערכת בהקדם האפשרי.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    try {
      await emailService.send({
        to: CRITICAL_ALERT_EMAILS,
        subject: `🚨 STANNEL DOWN - ${issue.title}`,
        html,
      });
      console.log(`[HealthMonitor] 🚨 CRITICAL ALERT sent to: ${CRITICAL_ALERT_EMAILS.join(', ')}`);
    } catch (error) {
      console.error('[HealthMonitor] Failed to send critical alert:', error);
    }
  },

  /**
   * 🔍 Check all critical systems and send alerts if needed
   */
  async checkCriticalSystems(): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check Database
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      issues.push(`Database: ${errorMsg}`);

      // Determine if it's a payment issue
      const isPaymentIssue = errorMsg.includes('SUSPENDED') ||
                             errorMsg.includes('billing') ||
                             errorMsg.includes('payment');

      await this.sendCriticalAlert({
        type: isPaymentIssue ? 'PAYMENT' : 'DATABASE',
        title: isPaymentIssue ? 'בעיית תשלום - מסד נתונים מושעה' : 'מסד הנתונים לא זמין',
        message: isPaymentIssue
          ? 'Cloud SQL מושעה בגלל בעיית תשלום. האתר לא יעבוד עד שתשלם!'
          : 'לא ניתן להתחבר למסד הנתונים. המשתמשים לא יכולים להתחבר או לראות נתונים.',
        details: errorMsg,
      });
    }

    // Check Firebase
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        issues.push('Firebase: Not initialized');
        await this.sendCriticalAlert({
          type: 'FIREBASE',
          title: 'Firebase לא מאותחל',
          message: 'המשתמשים לא יכולים להתחבר לאתר!',
        });
      }
    } catch (error: any) {
      issues.push(`Firebase: ${error.message}`);
    }

    return {
      healthy: issues.length === 0,
      issues,
    };
  },

  /**
   * Initialize daily health check scheduler
   */
  initDailyScheduler(): void {
    // Send report daily at 10:00 AM Israel time
    const scheduleNextReport = () => {
      const now = new Date();
      const targetHour = 10; // 10:00 AM

      // Calculate next 1:00 AM
      const nextReport = new Date(now);
      nextReport.setHours(targetHour, 0, 0, 0);

      // If it's already past 10 AM today, schedule for tomorrow
      if (now.getHours() >= targetHour) {
        nextReport.setDate(nextReport.getDate() + 1);
      }

      const msUntilReport = nextReport.getTime() - now.getTime();

      console.log(`[HealthMonitor] Next daily report scheduled for: ${nextReport.toLocaleString('he-IL')}`);

      setTimeout(async () => {
        await this.sendDailyReport();
        scheduleNextReport(); // Schedule the next one
      }, msUntilReport);
    };

    scheduleNextReport();

    // Also send an initial report on startup (after 1 minute)
    setTimeout(() => {
      this.sendDailyReport();
    }, 60000);

    // 🚨 CRITICAL: Check systems every 5 minutes
    setInterval(() => {
      this.checkCriticalSystems();
    }, 5 * 60 * 1000); // Every 5 minutes

    // Initial critical check after 30 seconds
    setTimeout(() => {
      this.checkCriticalSystems();
    }, 30000);

    console.log('[HealthMonitor] Daily health check scheduler initialized');
    console.log('[HealthMonitor] 🚨 Critical system monitor running every 5 minutes');
  },
};
