// SLA Service - Deadline Monitoring with Bull Queue
// Gracefully handles missing Redis connection

import Bull from 'bull';
import prisma from '../lib/prisma.js';
import { notificationService } from './notification.service.js';

const REDIS_URL = process.env.REDIS_URL;

// Lazy initialization - only create queue when Redis URL is available
let slaQueue: Bull.Queue | null = null;
let queueInitialized = false;
let redisAvailable = false;

function getQueue(): Bull.Queue | null {
  if (!REDIS_URL) {
    if (!queueInitialized) {
      console.warn('⚠️ REDIS_URL not configured - SLA monitoring disabled');
      queueInitialized = true;
    }
    return null;
  }

  if (!slaQueue) {
    try {
      slaQueue = new Bull('sla-monitoring', REDIS_URL, {
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

      // Add error handler to prevent crashes
      slaQueue.on('error', (error) => {
        console.error('SLA Queue error:', error.message);
        redisAvailable = false;
      });

      slaQueue.on('ready', () => {
        console.log('✅ SLA Queue connected to Redis');
        redisAvailable = true;
      });

      queueInitialized = true;
    } catch (error) {
      console.error('Failed to create SLA queue:', error);
      queueInitialized = true;
      return null;
    }
  }

  return slaQueue;
}

// Helper to add timeout to promises (prevents hanging)
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), ms);
  });
  return Promise.race([promise, timeout]);
}

// Operation timeout in milliseconds
const QUEUE_OPERATION_TIMEOUT = 5000;

export const slaService = {
  // Check if SLA service is available
  isAvailable(): boolean {
    return !!REDIS_URL && redisAvailable;
  },

  // Schedule SLA checks for an invoice (non-blocking, fire-and-forget)
  scheduleCheck(invoiceId: string, deadline: Date): void {
    // Run async operations in background - never block the caller
    setImmediate(async () => {
      try {
        const queue = getQueue();
        if (!queue) {
          console.warn(`SLA check not scheduled for invoice ${invoiceId} - Redis unavailable`);
          return;
        }

        // Warning notification 24 hours before deadline
        const warningTime = new Date(deadline.getTime() - 24 * 60 * 60 * 1000);
        const warningDelay = Math.max(0, warningTime.getTime() - Date.now());

        if (warningDelay > 0) {
          await withTimeout(
            queue.add(
              'sla-warning',
              { invoiceId, type: 'WARNING' },
              {
                delay: warningDelay,
                jobId: `sla-warn-${invoiceId}`,
              }
            ),
            QUEUE_OPERATION_TIMEOUT,
            'SLA warning job add timed out'
          );
        }

        // Breach notification at deadline
        const breachDelay = Math.max(0, deadline.getTime() - Date.now());
        await withTimeout(
          queue.add(
            'sla-breach',
            { invoiceId, type: 'BREACH' },
            {
              delay: breachDelay,
              jobId: `sla-breach-${invoiceId}`,
            }
          ),
          QUEUE_OPERATION_TIMEOUT,
          'SLA breach job add timed out'
        );

        console.log(`SLA checks scheduled for invoice ${invoiceId}`);
      } catch (error) {
        console.error(`Failed to schedule SLA check for invoice ${invoiceId}:`, error);
        // Don't throw - this is fire-and-forget
      }
    });
  },

  // Cancel scheduled SLA checks (when invoice is paid)
  async cancelChecks(invoiceId: string): Promise<void> {
    const queue = getQueue();
    if (!queue) return;

    try {
      const warningJob = await queue.getJob(`sla-warn-${invoiceId}`);
      if (warningJob) await warningJob.remove();

      const breachJob = await queue.getJob(`sla-breach-${invoiceId}`);
      if (breachJob) await breachJob.remove();
    } catch (error) {
      console.error('Failed to cancel SLA checks:', error);
    }
  },

  // Initialize queue processors
  initProcessors(): void {
    const queue = getQueue();
    if (!queue) {
      console.warn('⚠️ SLA queue processors not initialized - Redis unavailable');
      return;
    }

    // Warning processor
    queue.process('sla-warning', async (job) => {
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
    queue.process('sla-breach', async (job) => {
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
    const queue = getQueue();
    if (!queue) {
      return { waiting: 0, active: 0, completed: 0, failed: 0, available: false };
    }

    try {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
      ]);

      return { waiting, active, completed, failed, available: true };
    } catch (error) {
      console.error('Failed to get SLA queue stats:', error);
      return { waiting: 0, active: 0, completed: 0, failed: 0, available: false };
    }
  },
};

// Initialize processors when module loads (only if Redis is configured)
if (process.env.NODE_ENV !== 'test' && REDIS_URL) {
  // Delay initialization to allow connection to establish
  setTimeout(() => {
    slaService.initProcessors();
  }, 1000);
}
