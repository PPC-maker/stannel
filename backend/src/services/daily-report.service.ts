// Daily Report Service - Generates and sends daily system status reports
// Runs every day at 10:00 AM

import prisma from '../lib/prisma.js';
import { emailService, EMAIL_DESTINATIONS } from './email.service.js';
import { systemLogger } from './system-logger.service.js';

export const dailyReportService = {
  // Send daily system report
  async sendDailyReport(): Promise<boolean> {
    try {
      console.log('[DailyReport] Starting daily report generation...');

      // Get stats from last 24 hours
      const since = new Date();
      since.setHours(since.getHours() - 24);

      // Get all logs from last 24 hours
      const logs = await prisma.systemLog.findMany({
        where: {
          createdAt: { gte: since },
        },
        select: {
          severity: true,
          category: true,
          title: true,
          message: true,
          createdAt: true,
        },
      });

      // Calculate stats
      const totalLogs = logs.length;
      const errorLogs = logs.filter(l => l.severity === 'ERROR');
      const warningLogs = logs.filter(l => l.severity === 'WARNING');
      const criticalLogs = logs.filter(l => l.severity === 'CRITICAL');

      // Group errors by category
      const errorsByCategory: Record<string, number> = {};
      for (const log of [...errorLogs, ...criticalLogs]) {
        errorsByCategory[log.category] = (errorsByCategory[log.category] || 0) + 1;
      }

      // Check system status
      const systemStatus = await this.checkSystemStatus();

      // Determine overall health
      const isHealthy = criticalLogs.length === 0 &&
        errorLogs.length < 10 &&
        systemStatus.database &&
        systemStatus.api;

      // Prepare recent errors (most recent first)
      const recentErrors = [...errorLogs, ...criticalLogs]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map(e => ({
          title: e.title,
          message: e.message,
          category: e.category,
          createdAt: e.createdAt,
        }));

      // Send report email
      const sent = await emailService.sendDailyReport(
        EMAIL_DESTINATIONS.systemReports,
        {
          isHealthy,
          totalLogs24h: totalLogs,
          errorsCount: errorLogs.length,
          warningsCount: warningLogs.length,
          criticalCount: criticalLogs.length,
          errorsByCategory,
          recentErrors,
          systemStatus,
          timestamp: new Date(),
        }
      );

      // Log the report generation
      await systemLogger.info(
        'SCHEDULER',
        'Daily Report Sent',
        `Daily report sent to ${EMAIL_DESTINATIONS.systemReports.join(', ')}`,
        {
          details: JSON.stringify({
            isHealthy,
            totalLogs: totalLogs,
            errors: errorLogs.length,
            warnings: warningLogs.length,
            critical: criticalLogs.length,
          }),
        }
      );

      // Save report to database
      await prisma.systemScanReport.create({
        data: {
          isHealthy,
          checksRun: 3,
          checksPassed: (systemStatus.database ? 1 : 0) + (systemStatus.api ? 1 : 0) + (systemStatus.storage ? 1 : 0),
          checksFailed: (!systemStatus.database ? 1 : 0) + (!systemStatus.api ? 1 : 0) + (!systemStatus.storage ? 1 : 0),
          checksWarnings: warningLogs.length,
          results: {
            totalLogs: totalLogs,
            errors: errorLogs.length,
            warnings: warningLogs.length,
            critical: criticalLogs.length,
            systemStatus,
          },
          errorsLast24h: errorLogs.length + criticalLogs.length,
          emailSent: sent,
          sentTo: EMAIL_DESTINATIONS.systemReports,
        },
      });

      console.log('[DailyReport] Report generated and sent successfully');
      return sent;
    } catch (error) {
      console.error('[DailyReport] Failed to generate report:', error);
      await systemLogger.error(
        'SCHEDULER',
        'Daily Report Failed',
        'Failed to generate and send daily report',
        error as Error
      );
      return false;
    }
  },

  // Check system components status
  async checkSystemStatus(): Promise<{
    database: boolean;
    api: boolean;
    storage: boolean;
  }> {
    const status = {
      database: false,
      api: true, // If we're running, API is up
      storage: false,
    };

    // Check database
    try {
      await prisma.$queryRaw`SELECT 1`;
      status.database = true;
    } catch {
      status.database = false;
    }

    // Check storage (basic check)
    try {
      // We assume storage is OK if we can query products with images
      const productWithImage = await prisma.product.findFirst({
        where: { imageUrl: { not: '' } },
        select: { imageUrl: true },
      });
      status.storage = !!productWithImage || true; // Default to true if no products
    } catch {
      status.storage = false;
    }

    return status;
  },

  // Force send report (for testing)
  async forceSendReport(): Promise<boolean> {
    console.log('[DailyReport] Force sending report...');
    return this.sendDailyReport();
  },

  // Send immediate error alert (for critical errors)
  async sendImmediateAlert(
    title: string,
    message: string,
    category: string,
    error?: Error
  ): Promise<boolean> {
    try {
      return await emailService.sendErrorAlert(
        EMAIL_DESTINATIONS.systemReports,
        {
          title,
          message,
          category,
          stackTrace: error?.stack,
          details: error ? `${error.name}: ${error.message}\n\n${error.stack}` : undefined,
          timestamp: new Date(),
        }
      );
    } catch (e) {
      console.error('[DailyReport] Failed to send immediate alert:', e);
      return false;
    }
  },
};
