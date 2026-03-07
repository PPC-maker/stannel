// Admin Routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.middleware.js';
import { slaService } from '../services/sla.service.js';
import { healthReportService } from '../services/health-report.service.js';
import { schedulerService } from '../services/scheduler.service.js';
import { systemScannerService } from '../services/system-scanner.service.js';
import { emailService } from '../services/email.service.js';
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

  // Get all invoices (admin view)
  server.get('/invoices', async (request: FastifyRequest) => {
    const query = request.query as { page?: string; pageSize?: string; status?: string };
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '20');

    const where = {
      ...(query.status && { status: query.status as any }),
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
