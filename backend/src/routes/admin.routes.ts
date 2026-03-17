// Admin Routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.middleware.js';
import { slaService } from '../services/sla.service.js';
import { healthReportService } from '../services/health-report.service.js';
import { schedulerService } from '../services/scheduler.service.js';
import { systemScannerService } from '../services/system-scanner.service.js';
import { emailService } from '../services/email.service.js';
import { getFirebaseAuth } from '../lib/firebase.js';
import { wsService } from '../services/websocket.service.js';
import { z } from 'zod';

const verifyInvoiceSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'CLARIFICATION_NEEDED']),
  note: z.string().optional(),
});

const createContractSchema = z.object({
  supplierId: z.string(),
  type: z.enum(['STANDARD', 'PREMIUM', 'EXCLUSIVE']),
  feePercent: z.number().min(0).max(100),
  validFrom: z.string().transform(s => new Date(s)),
  validTo: z.string().transform(s => new Date(s)),
});

const createGoalSchema = z.object({
  supplierId: z.string(),
  targetAmount: z.number().positive(),
  bonusPoints: z.number().positive(),
  period: z.enum(['MONTHLY', 'QUARTERLY']),
  startDate: z.string().transform(s => new Date(s)),
  endDate: z.string().transform(s => new Date(s)),
});

export async function adminRoutes(server: FastifyInstance) {
  // Apply admin middleware to all routes
  server.addHook('preHandler', authMiddleware);
  server.addHook('preHandler', requireAdmin);

  // Get all users
  server.get('/users', async (request: FastifyRequest) => {
    const query = request.query as { page?: string; pageSize?: string; role?: string; isActive?: string };
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '20');

    const where = {
      ...(query.role && { role: query.role as any }),
      ...(query.isActive !== undefined && { isActive: query.isActive === 'true' }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          architectProfile: true,
          supplierProfile: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  });

  // Get pending users (awaiting approval)
  server.get('/users/pending', async (request: FastifyRequest) => {
    const query = request.query as { page?: string; pageSize?: string };
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '20');

    const where = {
      isActive: false,
      role: { not: 'ADMIN' as const },
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          architectProfile: true,
          supplierProfile: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  });

  // Activate user (approve) with welcome email
  server.patch('/users/:id/activate', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { sendEmail?: boolean } | undefined;
    const sendEmail = body?.sendEmail !== false; // Default to true

    const user = await prisma.user.update({
      where: { id },
      data: {
        isActive: true,
        activatedAt: new Date(),
      },
    });

    // Send welcome email
    if (sendEmail && user.email) {
      const webUrl = process.env.WEB_URL || 'https://stannel.app';
      const loginUrl = `${webUrl}/login?email=${encodeURIComponent(user.email)}`;

      await emailService.sendWelcomeEmail(
        user.email,
        user.name,
        loginUrl
      );
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'USER_ACTIVATED',
        entityId: id,
        metadata: { emailSent: sendEmail },
      },
    });

    return user;
  });

  // Bulk activate users
  server.post('/users/bulk-activate', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { userIds: string[]; sendEmail?: boolean };
    const { userIds, sendEmail = true } = body;

    if (!userIds || userIds.length === 0) {
      return reply.code(400).send({ error: 'userIds array is required' });
    }

    const webUrl = process.env.WEB_URL || 'https://stannel.app';
    const results: { userId: string; success: boolean; error?: string }[] = [];

    for (const userId of userIds) {
      try {
        const user = await prisma.user.update({
          where: { id: userId },
          data: {
            isActive: true,
            activatedAt: new Date(),
          },
        });

        // Send welcome email
        if (sendEmail && user.email) {
          const loginUrl = `${webUrl}/login?email=${encodeURIComponent(user.email)}`;
          await emailService.sendWelcomeEmail(user.email, user.name, loginUrl);
        }

        results.push({ userId, success: true });

        // Audit log
        await prisma.auditLog.create({
          data: {
            userId: request.user!.id,
            action: 'USER_ACTIVATED',
            entityId: userId,
            metadata: { emailSent: sendEmail, bulk: true },
          },
        });
      } catch (err) {
        results.push({ userId, success: false, error: 'User not found' });
      }
    }

    return {
      total: userIds.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  });

  // Deactivate user
  server.patch('/users/:id/deactivate', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'USER_DEACTIVATED',
        entityId: id,
      },
    });

    return user;
  });

  // Delete user
  server.delete('/users/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    // Don't allow deleting admins
    if (user.role === 'ADMIN') {
      return reply.code(403).send({ error: 'Cannot delete admin users' });
    }

    // Delete from Firebase Auth first
    if (user.firebaseUid) {
      try {
        const auth = getFirebaseAuth();
        if (auth) {
          await auth.deleteUser(user.firebaseUid);
        }
      } catch (firebaseError: any) {
        // If user doesn't exist in Firebase, continue with DB deletion
        if (firebaseError.code !== 'auth/user-not-found') {
          console.error('Error deleting user from Firebase:', firebaseError);
        }
      }
    }

    // Delete related records first
    await prisma.$transaction(async (tx) => {
      // Delete architect profile if exists
      await tx.architectProfile.deleteMany({ where: { userId: id } });
      // Delete supplier profile if exists
      await tx.supplierProfile.deleteMany({ where: { userId: id } });
      // Delete the user
      await tx.user.delete({ where: { id } });
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'USER_DELETED',
        entityId: id,
        metadata: { deletedUserEmail: user.email },
      },
    });

    return { success: true };
  });

  // Login as user (admin impersonation)
  server.post('/users/:id/login-as', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return reply.code(404).send({ error: 'User not found' });
    }

    if (!targetUser.firebaseUid) {
      return reply.code(400).send({ error: 'User has no Firebase account' });
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      return reply.code(500).send({ error: 'Firebase not configured' });
    }

    // Create a custom token for the target user
    const customToken = await auth.createCustomToken(targetUser.firebaseUid);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'ADMIN_LOGIN_AS_USER',
        entityId: id,
        metadata: { targetUserEmail: targetUser.email },
      },
    });

    return { customToken };
  });

  // Get all invoices (admin view) - excludes deleted by default
  server.get('/invoices', async (request: FastifyRequest) => {
    const query = request.query as { page?: string; pageSize?: string; status?: string; includeDeleted?: string };
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '100');
    const includeDeleted = query.includeDeleted === 'true';

    const where = {
      ...(query.status && { status: query.status as any }),
      ...(!includeDeleted && { deletedAt: null }), // Exclude deleted unless explicitly requested
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          architect: { include: { user: { select: { name: true, email: true } } } },
          supplier: { include: { user: { select: { name: true, email: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  });

  // Get deleted invoices (recycle bin)
  server.get('/invoices/deleted', async (request: FastifyRequest) => {
    const query = request.query as { page?: string; pageSize?: string };
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '100');

    const where = {
      deletedAt: { not: null },
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          architect: { include: { user: { select: { name: true, email: true } } } },
          supplier: { include: { user: { select: { name: true, email: true } } } },
        },
        orderBy: { deletedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  });

  // Soft delete invoice (move to recycle bin)
  server.delete('/invoices/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'INVOICE_DELETED',
        entityId: id,
        metadata: { amount: invoice.amount, architectId: invoice.architectId },
      },
    });

    // Broadcast deletion to all clients
    wsService.invoiceDeleted(updated);

    return { success: true, invoice: updated };
  });

  // Bulk soft delete invoices by architect
  server.delete('/invoices/architect/:architectId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { architectId } = request.params as { architectId: string };

    const invoices = await prisma.invoice.findMany({
      where: { architectId, deletedAt: null },
    });

    if (invoices.length === 0) {
      return reply.code(404).send({ error: 'No invoices found for this architect' });
    }

    await prisma.invoice.updateMany({
      where: { architectId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'INVOICES_BULK_DELETED',
        entityId: architectId,
        metadata: { count: invoices.length },
      },
    });

    // Broadcast deletion to all clients for each invoice
    invoices.forEach(inv => wsService.invoiceDeleted(inv));

    return { success: true, deletedCount: invoices.length };
  });

  // Restore invoice from recycle bin
  server.patch('/invoices/:id/restore', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }

    if (!invoice.deletedAt) {
      return reply.code(400).send({ error: 'Invoice is not deleted' });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { deletedAt: null },
    });

    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'INVOICE_RESTORED',
        entityId: id,
      },
    });

    // Broadcast restoration to all clients
    wsService.invoiceRestored(updated);

    return { success: true, invoice: updated };
  });

  // Permanent delete invoice (from recycle bin)
  server.delete('/invoices/:id/permanent', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }

    // Delete status history first
    await prisma.invoiceStatusHistory.deleteMany({ where: { invoiceId: id } });

    // Delete the invoice permanently
    await prisma.invoice.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'INVOICE_PERMANENTLY_DELETED',
        entityId: id,
        metadata: { amount: invoice.amount },
      },
    });

    return { success: true };
  });

  // Empty recycle bin (delete all invoices older than 30 days)
  server.delete('/invoices/recycle-bin/cleanup', async (request: FastifyRequest) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get invoices to delete
    const invoicesToDelete = await prisma.invoice.findMany({
      where: {
        deletedAt: { lte: thirtyDaysAgo },
      },
      select: { id: true },
    });

    // Delete status history first
    await prisma.invoiceStatusHistory.deleteMany({
      where: { invoiceId: { in: invoicesToDelete.map(i => i.id) } },
    });

    // Delete invoices
    const result = await prisma.invoice.deleteMany({
      where: {
        deletedAt: { lte: thirtyDaysAgo },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'RECYCLE_BIN_CLEANUP',
        metadata: { deletedCount: result.count },
      },
    });

    return { success: true, deletedCount: result.count };
  });

  // Verify invoice
  server.patch('/invoices/:id/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = verifyInvoiceSchema.parse(request.body);

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }

    let newStatus: any = body.status;
    let approvedAt: Date | null = null;

    if (body.status === 'APPROVED') {
      newStatus = 'PENDING_SUPPLIER_PAY';
      approvedAt = new Date();

      // Schedule SLA monitoring
      const paymentDeadline = new Date();
      paymentDeadline.setHours(paymentDeadline.getHours() + 72);

      await slaService.scheduleCheck(id, paymentDeadline);

      // ===== POINTS SYSTEM: Credit 2% to both architect and supplier =====
      const pointsToCredit = invoice.amount * 0.02; // 2% of invoice amount

      // Credit points to architect
      await prisma.architectProfile.update({
        where: { id: invoice.architectId },
        data: {
          pointsBalance: { increment: pointsToCredit },
          totalEarned: { increment: pointsToCredit },
        },
      });

      // Create transaction record for architect
      await prisma.cardTransaction.create({
        data: {
          architectId: invoice.architectId,
          type: 'CREDIT',
          amount: pointsToCredit,
          description: `זיכוי נקודות מחשבונית #${invoice.id.slice(-6)}`,
          invoiceId: invoice.id,
        },
      });

      // Credit points to supplier
      await prisma.supplierProfile.update({
        where: { id: invoice.supplierId },
        data: {
          pointsBalance: { increment: pointsToCredit },
          totalEarned: { increment: pointsToCredit },
        },
      });

      // Create transaction record for supplier
      await prisma.supplierCardTransaction.create({
        data: {
          supplierId: invoice.supplierId,
          type: 'CREDIT',
          amount: pointsToCredit,
          description: `זיכוי נקודות מחשבונית #${invoice.id.slice(-6)}`,
          invoiceId: invoice.id,
        },
      });
      // ===== END POINTS SYSTEM =====
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: newStatus,
        adminNote: body.note,
        ...(approvedAt && { approvedAt }),
        ...(body.status === 'APPROVED' && { slaDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000) }),
      },
    });

    // Add to history
    await prisma.invoiceStatusHistory.create({
      data: {
        invoiceId: id,
        status: newStatus,
        note: body.note,
        changedBy: request.user!.id,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: `INVOICE_${body.status}`,
        entityId: id,
        metadata: { note: body.note },
      },
    });

    // Broadcast to all connected clients
    if (body.status === 'APPROVED') {
      wsService.invoiceApproved(updated);
    } else if (body.status === 'REJECTED') {
      wsService.invoiceRejected(updated);
    } else {
      wsService.invoiceUpdated(updated);
    }

    return updated;
  });

  // Create contract
  server.post('/contracts', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createContractSchema.parse(request.body);

    const contract = await prisma.contract.create({
      data: {
        supplier: {
          connect: { id: body.supplierId },
        },
        type: body.type,
        feePercent: body.feePercent,
        validFrom: body.validFrom,
        validTo: body.validTo,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'CONTRACT_CREATED',
        entityId: contract.id,
      },
    });

    return contract;
  });

  // Get contracts
  server.get('/contracts', async (request: FastifyRequest) => {
    const contracts = await prisma.contract.findMany({
      include: {
        supplier: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return contracts;
  });

  // Create goal
  server.post('/goals', async (request: FastifyRequest) => {
    const body = createGoalSchema.parse(request.body);

    const goal = await prisma.supplierGoal.create({
      data: {
        supplier: {
          connect: { id: body.supplierId },
        },
        targetAmount: body.targetAmount,
        bonusPoints: body.bonusPoints,
        period: body.period,
        startDate: body.startDate,
        endDate: body.endDate,
      },
    });

    return goal;
  });

  // Get audit logs
  server.get('/audit-logs', async (request: FastifyRequest) => {
    const query = request.query as { page?: string; pageSize?: string };
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '50');

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count(),
    ]);

    return {
      data: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  });

  // ============ Health Reports ============

  // Get current health report
  server.get('/health-report', async () => {
    const report = await healthReportService.generateReport();
    return report;
  });

  // Get recent health reports
  server.get('/health-reports', async () => {
    const reports = await healthReportService.getRecentReports(10);
    return { data: reports };
  });

  // Trigger health report manually (sends email)
  server.post('/health-report/send', async (request: FastifyRequest) => {
    const report = await healthReportService.sendWeeklyReport();

    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'HEALTH_REPORT_SENT',
        entityId: report.id,
        metadata: { sentTo: report.sentTo },
      },
    });

    return report;
  });

  // ============ Scheduled Tasks ============

  // Get scheduled tasks
  server.get('/scheduled-tasks', async () => {
    const tasks = schedulerService.getTasks();
    return { data: tasks };
  });

  // Force run a scheduled task
  server.post('/scheduled-tasks/:name/run', async (request: FastifyRequest, reply: FastifyReply) => {
    const { name } = request.params as { name: string };

    const success = await schedulerService.forceRun(name);

    if (!success) {
      return reply.code(404).send({ error: 'Task not found or failed to run' });
    }

    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'SCHEDULED_TASK_RUN',
        entityId: name,
      },
    });

    return { success: true, task: name };
  });

  // Enable/disable scheduled task
  server.patch('/scheduled-tasks/:name', async (request: FastifyRequest, reply: FastifyReply) => {
    const { name } = request.params as { name: string };
    const { enabled } = request.body as { enabled: boolean };

    const success = enabled
      ? schedulerService.enableTask(name)
      : schedulerService.disableTask(name);

    if (!success) {
      return reply.code(404).send({ error: 'Task not found' });
    }

    return { success: true, task: name, enabled };
  });

  // ============ System Logs (for debugging) ============

  // Get system logs
  server.get('/logs', async (request: FastifyRequest) => {
    const query = request.query as {
      page?: string;
      pageSize?: string;
      severity?: string;
      category?: string;
      resolved?: string;
    };

    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '50');

    const where = {
      ...(query.severity && { severity: query.severity as any }),
      ...(query.category && { category: query.category as any }),
      ...(query.resolved !== undefined && { resolved: query.resolved === 'true' }),
    };

    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.systemLog.count({ where }),
    ]);

    return {
      data: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  });

  // Get single log with full details (for copy to Claude)
  server.get('/logs/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const log = await prisma.systemLog.findUnique({ where: { id } });

    if (!log) {
      return reply.code(404).send({ error: 'Log not found' });
    }

    // Format for easy copy/paste to Claude
    const claudeFormat = `
## System Error Report - STANNEL

**Error ID:** ${log.id}
**Time:** ${log.createdAt.toISOString()}
**Severity:** ${log.severity}
**Category:** ${log.category}

### Issue
**${log.title}**
${log.message}

### Details
\`\`\`
${log.details || 'No additional details'}
\`\`\`

${log.stackTrace ? `### Stack Trace\n\`\`\`\n${log.stackTrace}\n\`\`\`` : ''}

### Request Info
- Endpoint: ${log.endpoint || 'N/A'}
- Response Time: ${log.responseTime || 'N/A'}ms

---
Please analyze this error and provide a fix.
    `.trim();

    return {
      ...log,
      claudeFormat,
    };
  });

  // Mark log as resolved
  server.patch('/logs/:id/resolve', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };

    const log = await prisma.systemLog.update({
      where: { id },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: request.user!.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'SYSTEM_LOG_RESOLVED',
        entityId: id,
      },
    });

    return log;
  });

  // Run system scan manually
  server.post('/scan', async (request: FastifyRequest) => {
    const report = await systemScannerService.runFullScan();

    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'SYSTEM_SCAN_RUN',
        metadata: {
          passed: report.passed,
          failed: report.failed,
          warnings: report.warnings,
        },
      },
    });

    return report;
  });

  // Get latest scan report
  server.get('/scan/latest', async () => {
    const report = await systemScannerService.getLatestReport();
    return report || { error: 'No scan reports found' };
  });

  // Get scan report history
  server.get('/scan/history', async (request: FastifyRequest) => {
    const query = request.query as { limit?: string };
    const limit = parseInt(query.limit || '10');
    const reports = await systemScannerService.getRecentReports(limit);
    return { data: reports };
  });

  // Get unresolved logs count (for dashboard badge)
  server.get('/logs/stats', async () => {
    const [total, unresolved, critical, errors, warnings] = await Promise.all([
      prisma.systemLog.count(),
      prisma.systemLog.count({ where: { resolved: false } }),
      prisma.systemLog.count({ where: { severity: 'CRITICAL', resolved: false } }),
      prisma.systemLog.count({ where: { severity: 'ERROR', resolved: false } }),
      prisma.systemLog.count({ where: { severity: 'WARNING', resolved: false } }),
    ]);

    return {
      total,
      unresolved,
      critical,
      errors,
      warnings,
    };
  });
}
