// SLA Service - Deadline Monitoring with Bull Queue

import Bull from 'bull';
import prisma from '../lib/prisma.js';
import { notificationService } from './notification.service.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const slaQueue = new Bull('sla-monitoring', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

export const slaService = {
  // Schedule SLA checks for an invoice
  async scheduleCheck(invoiceId: string, deadline: Date): Promise<void> {
    // Warning notification 24 hours before deadline
    const warningTime = new Date(deadline.getTime() - 24 * 60 * 60 * 1000);
    const warningDelay = Math.max(0, warningTime.getTime() - Date.now());

    if (warningDelay > 0) {
      await slaQueue.add(
        'sla-warning',
        { invoiceId, type: 'WARNING' },
        {
          delay: warningDelay,
          jobId: `sla-warn-${invoiceId}`,
        }
      );
    }

    // Breach notification at deadline
    const breachDelay = Math.max(0, deadline.getTime() - Date.now());
    await slaQueue.add(
      'sla-breach',
      { invoiceId, type: 'BREACH' },
      {
        delay: breachDelay,
        jobId: `sla-breach-${invoiceId}`,
      }
    );
  },

  // Cancel scheduled SLA checks (when invoice is paid)
  async cancelChecks(invoiceId: string): Promise<void> {
    const warningJob = await slaQueue.getJob(`sla-warn-${invoiceId}`);
    if (warningJob) await warningJob.remove();

    const breachJob = await slaQueue.getJob(`sla-breach-${invoiceId}`);
    if (breachJob) await breachJob.remove();
  },

  // Initialize queue processors
  initProcessors(): void {
    // Warning processor
    slaQueue.process('sla-warning', async (job) => {
      const { invoiceId } = job.data;

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          supplier: { include: { user: true } },
          architect: { include: { user: true } },
        },
      });

      if (!invoice || invoice.status !== 'PENDING_SUPPLIER_PAY') {
        return { skipped: true };
      }

      // Send warning to supplier
      await notificationService.send(invoice.supplier.user.id, {
        title: '⚠️ תזכורת SLA',
        body: `נותרו פחות מ-24 שעות לתשלום חשבונית #${invoiceId.slice(-6)}`,
        data: { type: 'SLA_WARNING', invoiceId },
      });

      // Mark alert as sent
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { slaAlertSent: true },
      });

      return { success: true };
    });

    // Breach processor
    slaQueue.process('sla-breach', async (job) => {
      const { invoiceId } = job.data;

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          supplier: { include: { user: true } },
        },
      });

      if (!invoice || invoice.status !== 'PENDING_SUPPLIER_PAY') {
        return { skipped: true };
      }

      // Mark as overdue
      await prisma.$transaction([
        prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: 'OVERDUE' },
        }),
        prisma.invoiceStatusHistory.create({
          data: {
            invoiceId,
            status: 'OVERDUE',
            note: 'הפך לאיחור באופן אוטומטי - SLA',
            changedBy: 'SYSTEM',
          },
        }),
        // Decrease supplier trust score
        prisma.supplierProfile.update({
          where: { id: invoice.supplierId },
          data: { trustScore: { decrement: 0.5 } },
        }),
      ]);

      // Notify admin
      await notificationService.sendToAdmins({
        title: '🚨 הפרת SLA',
        body: `ספק ${invoice.supplier.companyName} חרג מזמן התשלום`,
        data: { type: 'SLA_BREACH', invoiceId },
      });

      // Notify supplier
      await notificationService.send(invoice.supplier.user.id, {
        title: '❌ חריגה מ-SLA',
        body: 'החשבונית הועברה לסטטוס איחור. ציון האמון שלך ירד.',
        data: { type: 'SLA_BREACH', invoiceId },
      });

      return { success: true };
    });

    console.log('✅ SLA queue processors initialized');
  },

  // Get queue stats
  async getStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      slaQueue.getWaitingCount(),
      slaQueue.getActiveCount(),
      slaQueue.getCompletedCount(),
      slaQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  },
};

// Initialize processors when module loads
if (process.env.NODE_ENV !== 'test') {
  slaService.initProcessors();
}
