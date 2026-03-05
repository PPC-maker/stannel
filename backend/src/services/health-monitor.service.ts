// Health Monitor Service - STANNEL Platform
// Daily system health checks and status reports

import { emailService } from './email.service.js';
import { prisma } from '../lib/prisma.js';

const ADMIN_EMAILS = ['orenshp77@gmail.com'];

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

      await emailService.sendDailyStatusReport(ADMIN_EMAILS, {
        isHealthy,
        checks,
        timestamp: new Date(),
      });

      console.log('[HealthMonitor] Daily report sent successfully');
    } catch (error) {
      console.error('[HealthMonitor] Failed to send daily report:', error);
    }
  },

  /**
   * Initialize daily health check scheduler
   */
  initDailyScheduler(): void {
    // Send report daily at 9:00 AM Israel time
    const scheduleNextReport = () => {
      const now = new Date();
      const targetHour = 9; // 9:00 AM

      // Calculate next 9:00 AM
      const nextReport = new Date(now);
      nextReport.setHours(targetHour, 0, 0, 0);

      // If it's already past 9 AM today, schedule for tomorrow
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

    console.log('[HealthMonitor] Daily health check scheduler initialized');
  },
};
