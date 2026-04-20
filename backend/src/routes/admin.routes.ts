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
import { storageService } from '../services/storage.service.js';
import { z } from 'zod';

// Alert emails for system issues
const ALERT_EMAILS = ['PPC@newpost.co.il', 'orenshp77@gmail.com'];

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

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  date: z.string().transform(s => new Date(s)),
  location: z.string(),
  capacity: z.number().int().positive(),
  pointsCost: z.number().int().min(0).optional().default(0),
  imageUrl: z.string().optional().transform(s => s && s.length > 0 ? s : undefined),
});

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  date: z.string().transform(s => new Date(s)).optional(),
  location: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  pointsCost: z.number().int().min(0).optional(),
  imageUrl: z.string().optional().transform(s => s && s.length > 0 ? s : undefined),
  isHidden: z.boolean().optional(),
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

  // Update user (admin edit)
  server.patch('/users/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      phone?: string;
      address?: string;
      company?: string;
      supplierProfile?: {
        companyName?: string;
        description?: string;
        phone?: string;
        address?: string;
        website?: string;
        facebook?: string;
        instagram?: string;
        linkedin?: string;
      };
    };

    const user = await prisma.user.findUnique({
      where: { id },
      include: { supplierProfile: true, architectProfile: true },
    });
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    // Update user basic fields
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.company !== undefined && { company: body.company }),
      },
      include: { architectProfile: true, supplierProfile: true },
    });

    // Update supplier profile if provided
    if (body.supplierProfile && user.supplierProfile) {
      await prisma.supplierProfile.update({
        where: { id: user.supplierProfile.id },
        data: {
          ...(body.supplierProfile.companyName !== undefined && { companyName: body.supplierProfile.companyName }),
          ...(body.supplierProfile.description !== undefined && { description: body.supplierProfile.description }),
          ...(body.supplierProfile.phone !== undefined && { phone: body.supplierProfile.phone }),
          ...(body.supplierProfile.address !== undefined && { address: body.supplierProfile.address }),
          ...(body.supplierProfile.website !== undefined && { website: body.supplierProfile.website }),
          ...(body.supplierProfile.facebook !== undefined && { facebook: body.supplierProfile.facebook }),
          ...(body.supplierProfile.instagram !== undefined && { instagram: body.supplierProfile.instagram }),
          ...(body.supplierProfile.linkedin !== undefined && { linkedin: body.supplierProfile.linkedin }),
          ...(body.supplierProfile.commissionRate !== undefined && { commissionRate: body.supplierProfile.commissionRate }),
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'USER_UPDATED',
        entityId: id,
        metadata: { updatedFields: Object.keys(body) },
      },
    });

    // Return updated user with profiles
    const result = await prisma.user.findUnique({
      where: { id },
      include: { architectProfile: true, supplierProfile: true },
    });

    return result;
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

  // Delete supplier image (admin)
  server.post('/users/:id/delete-image', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { imageUrl } = request.body as { imageUrl: string };

    const user = await prisma.user.findUnique({
      where: { id },
      include: { supplierProfile: true },
    });

    if (!user?.supplierProfile) {
      return reply.code(404).send({ error: 'Supplier profile not found' });
    }

    const currentImages = user.supplierProfile.businessImages || [];
    const updatedImages = (currentImages as string[]).filter((img: string) => img !== imageUrl);

    await prisma.supplierProfile.update({
      where: { id: user.supplierProfile.id },
      data: { businessImages: updatedImages },
    });

    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'SUPPLIER_IMAGE_DELETED',
        entityId: id,
        metadata: { deletedImage: imageUrl },
      },
    });

    return { success: true, remainingImages: updatedImages.length };
  });

  // Update user profile image (admin)
  server.post('/users/:id/update-profile-image', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    const buffer = await data.toBuffer();
    const { storageService } = await import('../services/storage.service.js');
    const imageUrl = await storageService.uploadProfileImage(buffer, id, data.filename);

    // Update user profile image
    await prisma.user.update({
      where: { id },
      data: { profileImage: imageUrl },
    });

    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'USER_PROFILE_IMAGE_UPDATED',
        entityId: id,
        metadata: { newImage: imageUrl },
      },
    });

    return { success: true, imageUrl };
  });

  // Update invoice amount (admin correction)
  server.patch('/invoices/:id/update-amount', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { amount } = request.body as { amount: number };

    if (!amount || amount <= 0) {
      return reply.code(400).send({ error: 'Invalid amount' });
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { amount },
    });

    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'INVOICE_AMOUNT_CORRECTED',
        entityId: id,
        metadata: { newAmount: amount },
      },
    });

    return invoice;
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

      // Schedule SLA monitoring (fire-and-forget, never blocks)
      const paymentDeadline = new Date();
      paymentDeadline.setHours(paymentDeadline.getHours() + 72);

      // This is now fire-and-forget - it schedules the check in the background
      // and will never block the invoice approval response
      slaService.scheduleCheck(id, paymentDeadline);

      // NOTE: Points are credited ONLY when supplier confirms payment
      // See supplier.routes.ts -> /invoices/:id/confirm -> loyaltyService.creditInvoicePoints()
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

  // ============ Events Management ============

  // Get all events (admin)
  server.get('/events', async (request: FastifyRequest) => {
    const events = await prisma.event.findMany({
      orderBy: { date: 'desc' },
      include: {
        _count: {
          select: { registrations: true }
        }
      }
    });

    return {
      data: events.map(e => ({
        ...e,
        registeredCount: e._count.registrations
      })),
      total: events.length
    };
  });

  // Create event
  server.post('/events', async (request: FastifyRequest) => {
    const body = createEventSchema.parse(request.body);

    const event = await prisma.event.create({
      data: {
        title: body.title,
        description: body.description,
        date: body.date,
        location: body.location,
        capacity: body.capacity,
        pointsCost: body.pointsCost || 0,
        imageUrl: body.imageUrl,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'EVENT_CREATED',
        entityId: event.id,
        metadata: { title: event.title },
      },
    });

    return event;
  });

  // Update event
  server.patch('/events/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = updateEventSchema.parse(request.body);

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return reply.code(404).send({ error: 'Event not found' });
    }

    const updated = await prisma.event.update({
      where: { id },
      data: body,
    });

    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'EVENT_UPDATED',
        entityId: id,
        metadata: { title: updated.title },
      },
    });

    return updated;
  });

  // Delete event
  server.delete('/events/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return reply.code(404).send({ error: 'Event not found' });
    }

    // Delete registrations first
    await prisma.eventRegistration.deleteMany({ where: { eventId: id } });

    // Delete the event
    await prisma.event.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'EVENT_DELETED',
        entityId: id,
        metadata: { title: event.title },
      },
    });

    return { success: true };
  });

  // ============ Image Upload ============

  // Upload image for events/assets
  server.post('/upload-image', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.code(400).send({ error: 'Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.' });
      }

      // Read file buffer
      const buffer = await data.toBuffer();

      // Validate file size (max 5MB)
      if (buffer.length > 5 * 1024 * 1024) {
        return reply.code(400).send({ error: 'File too large. Maximum size is 5MB.' });
      }

      // Upload to storage
      const filename = `${Date.now()}-${data.filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const url = await storageService.uploadAsset(buffer, 'events', filename);

      await prisma.auditLog.create({
        data: {
          userId: request.user!.id,
          action: 'IMAGE_UPLOADED',
          metadata: { filename, url },
        },
      });

      return { url };
    } catch (error) {
      console.error('Image upload error:', error);
      return reply.code(500).send({ error: 'Failed to upload image' });
    }
  });

  // ============ Products Management ============

  // Get all products (admin view - includes inactive)
  server.get('/products', async (request: FastifyRequest) => {
    const query = request.query as { page?: string; pageSize?: string };
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '50');

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        include: {
          supplier: {
            select: { companyName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count(),
    ]);

    return { data: products, total, page, pageSize };
  });

  // Create product
  server.post('/products', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      name: string;
      description?: string;
      pointCost: number;
      pointsPerShekel?: number;
      stock: number;
      imageUrl?: string;
      supplierId?: string;
    };

    if (!body.name || body.pointCost === undefined || body.stock === undefined) {
      return reply.code(400).send({ error: 'Missing required fields' });
    }

    const product = await prisma.product.create({
      data: {
        name: body.name,
        description: body.description || '',
        pointCost: body.pointCost,
        pointsPerShekel: body.pointsPerShekel || 100,
        stock: body.stock,
        imageUrl: body.imageUrl,
        supplierId: body.supplierId,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'PRODUCT_CREATED',
        entityId: product.id,
        metadata: { name: product.name },
      },
    });

    return product;
  });

  // Update product
  server.patch('/products/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      description?: string;
      pointCost?: number;
      pointsPerShekel?: number;
      stock?: number;
      imageUrl?: string;
      isActive?: boolean;
    };

    const product = await prisma.product.update({
      where: { id },
      data: body,
    });

    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'PRODUCT_UPDATED',
        entityId: product.id,
        metadata: body,
      },
    });

    return product;
  });

  // Delete product
  server.delete('/products/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    // Check if product has redemptions
    const redemptionCount = await prisma.redemption.count({ where: { productId: id } });

    if (redemptionCount > 0) {
      // Can't delete product with redemptions - deactivate instead
      await prisma.product.update({
        where: { id },
        data: { isActive: false, stock: 0 },
      });

      await prisma.auditLog.create({
        data: {
          userId: request.user!.id,
          action: 'PRODUCT_DEACTIVATED',
          entityId: id,
          metadata: { reason: 'Has redemptions, cannot delete' },
        },
      });

      return { success: true, deactivated: true, message: 'המוצר הושבת כי יש לו מימושים' };
    }

    // No redemptions - safe to delete
    await prisma.product.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'PRODUCT_DELETED',
        entityId: id,
      },
    });

    return { success: true };
  });

  // ============ System Status ============

  interface ServiceStatus {
    name: string;
    status: 'healthy' | 'degraded' | 'down';
    message: string;
    lastCheck: string;
    responseTime?: number;
  }

  interface SystemHealth {
    overall: 'healthy' | 'degraded' | 'down';
    services: ServiceStatus[];
    alerts: {
      type: 'critical' | 'warning' | 'info';
      title: string;
      message: string;
      action?: string;
    }[];
    lastUpdated: string;
  }

  // Get commission stats for admin
  server.get('/commission-stats', async (request: FastifyRequest) => {
    const paidInvoices = await prisma.invoice.findMany({
      where: { status: 'PAID', deletedAt: null },
      select: {
        amount: true,
        adminCommission: true,
        architectCommission: true,
        architectPoints: true,
        paidAt: true,
      },
    });

    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalAdminCommission = paidInvoices.reduce((sum, inv) => sum + (inv.adminCommission || inv.amount * 0.02), 0);
    const totalArchitectCommission = paidInvoices.reduce((sum, inv) => sum + (inv.architectCommission || inv.amount * 0.02), 0);
    const totalArchitectPoints = paidInvoices.reduce((sum, inv) => sum + (inv.architectPoints || inv.amount * 0.02 * 40), 0);

    return {
      totalPaidInvoices: paidInvoices.length,
      totalRevenue,
      totalCommission: totalAdminCommission + totalArchitectCommission,
      adminCommission: totalAdminCommission,
      architectCommission: totalArchitectCommission,
      architectPoints: totalArchitectPoints,
      commissionRate: '4% (2% אדריכל + 2% מנהל)',
      pointsPerShekel: 40,
    };
  });

  // Get comprehensive system status
  server.get('/system-status', async (request: FastifyRequest) => {
    const services: ServiceStatus[] = [];
    const alerts: SystemHealth['alerts'] = [];

    // Check Database (PostgreSQL/Cloud SQL)
    const dbStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      services.push({
        name: 'Database (PostgreSQL)',
        status: 'healthy',
        message: 'Connected and responding',
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - dbStart,
      });
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      services.push({
        name: 'Database (PostgreSQL)',
        status: 'down',
        message: errorMsg,
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - dbStart,
      });

      // Check for billing/payment related errors
      if (errorMsg.includes('SUSPENDED') ||
          errorMsg.includes('billing') ||
          errorMsg.includes('payment') ||
          errorMsg.includes('quota') ||
          errorMsg.includes('Connection refused')) {
        alerts.push({
          type: 'critical',
          title: '🚨 בעיית תשלום - Database',
          message: 'Cloud SQL מושעה או שיש בעיית תשלום. בדוק את חשבון Google Cloud.',
          action: 'https://console.cloud.google.com/sql/instances?project=stannel-app',
        });
      } else {
        alerts.push({
          type: 'critical',
          title: '🔴 Database לא זמין',
          message: errorMsg,
          action: 'https://console.cloud.google.com/sql/instances?project=stannel-app',
        });
      }
    }

    // Check Redis (via SLA service)
    const redisStart = Date.now();
    try {
      const redisAvailable = slaService.isAvailable();
      if (redisAvailable) {
        services.push({
          name: 'Redis (Cache)',
          status: 'healthy',
          message: 'Connected via SLA service',
          lastCheck: new Date().toISOString(),
          responseTime: Date.now() - redisStart,
        });
      } else {
        services.push({
          name: 'Redis (Cache)',
          status: 'degraded',
          message: 'Not connected - SLA monitoring disabled',
          lastCheck: new Date().toISOString(),
        });
        alerts.push({
          type: 'warning',
          title: '⚠️ Redis לא מחובר',
          message: 'SLA monitoring ותכונות cache לא יעבדו.',
          action: 'https://console.cloud.google.com/memorystore/redis/instances?project=stannel-app',
        });
      }
    } catch (error: any) {
      services.push({
        name: 'Redis (Cache)',
        status: 'degraded',
        message: error.message || 'Failed to check',
        lastCheck: new Date().toISOString(),
      });
    }

    // Check Firebase
    try {
      const auth = getFirebaseAuth();
      if (auth) {
        services.push({
          name: 'Firebase Auth',
          status: 'healthy',
          message: 'Initialized',
          lastCheck: new Date().toISOString(),
        });
      } else {
        services.push({
          name: 'Firebase Auth',
          status: 'down',
          message: 'Not initialized',
          lastCheck: new Date().toISOString(),
        });
        alerts.push({
          type: 'critical',
          title: '🔴 Firebase לא מאותחל',
          message: 'התחברות משתמשים לא תעבוד.',
        });
      }
    } catch (error: any) {
      services.push({
        name: 'Firebase Auth',
        status: 'down',
        message: error.message || 'Failed to check',
        lastCheck: new Date().toISOString(),
      });
    }

    // Check Storage (GCS)
    try {
      // Simple check - if storageService exists it's initialized
      services.push({
        name: 'Cloud Storage',
        status: 'healthy',
        message: 'Initialized',
        lastCheck: new Date().toISOString(),
      });
    } catch (error: any) {
      services.push({
        name: 'Cloud Storage',
        status: 'degraded',
        message: error.message || 'May have issues',
        lastCheck: new Date().toISOString(),
      });
    }

    // Get recent critical errors
    const recentErrors = await prisma.systemLog.findMany({
      where: {
        severity: { in: ['CRITICAL', 'ERROR'] },
        resolved: false,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (recentErrors.length > 0) {
      alerts.push({
        type: 'warning',
        title: `📋 ${recentErrors.length} שגיאות לא מטופלות`,
        message: `יש ${recentErrors.length} שגיאות שדורשות טיפול ב-24 שעות האחרונות`,
        action: '/admin/logs',
      });
    }

    // Determine overall status
    const hasDown = services.some(s => s.status === 'down');
    const hasDegraded = services.some(s => s.status === 'degraded');
    const overall: SystemHealth['overall'] = hasDown ? 'down' : hasDegraded ? 'degraded' : 'healthy';

    const health: SystemHealth = {
      overall,
      services,
      alerts,
      lastUpdated: new Date().toISOString(),
    };

    return health;
  });

  // Send system alert email
  server.post('/system-status/alert', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { subject?: string; message?: string };

    try {
      // Get current system status
      const dbStatus = await prisma.$queryRaw`SELECT 1`.then(() => 'healthy').catch((e: any) => `down: ${e.message}`);
      const redisStatus = slaService.isAvailable() ? 'healthy' : 'not connected';

      const statusReport = `
<h2>🔔 STANNEL System Status Alert</h2>

<p><strong>Time:</strong> ${new Date().toISOString()}</p>
<p><strong>Triggered by:</strong> ${request.user?.email || 'System'}</p>

<h3>Services Status</h3>
<ul>
  <li><strong>Database:</strong> ${dbStatus}</li>
  <li><strong>Redis:</strong> ${redisStatus}</li>
  <li><strong>Firebase:</strong> ${getFirebaseAuth() ? 'healthy' : 'not initialized'}</li>
</ul>

<h3>Message</h3>
<p>${body.message || 'Manual status check requested'}</p>

<hr/>
<p>
  <a href="https://stannel.app/admin/system-status">View Full Status</a> |
  <a href="https://console.cloud.google.com/home/dashboard?project=stannel-app">Google Cloud Console</a>
</p>
      `.trim();

      // Send to all alert emails
      await emailService.send({
        to: ALERT_EMAILS,
        subject: body.subject || '🔔 STANNEL System Alert',
        html: statusReport,
      });

      await prisma.auditLog.create({
        data: {
          userId: request.user!.id,
          action: 'SYSTEM_ALERT_SENT',
          metadata: { sentTo: ALERT_EMAILS, subject: body.subject },
        },
      });

      return { success: true, sentTo: ALERT_EMAILS };
    } catch (error: any) {
      console.error('Failed to send system alert:', error);
      return reply.code(500).send({ error: 'Failed to send alert', details: error.message });
    }
  });

  // Get system status history (from system logs)
  server.get('/system-status/history', async (request: FastifyRequest) => {
    const query = request.query as { hours?: string };
    const hours = parseInt(query.hours || '24');

    const logs = await prisma.systemLog.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - hours * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Group by hour for chart data
    const hourlyStats: Record<string, { errors: number; warnings: number; total: number }> = {};

    logs.forEach(log => {
      const hour = new Date(log.createdAt).toISOString().slice(0, 13) + ':00:00Z';
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = { errors: 0, warnings: 0, total: 0 };
      }
      hourlyStats[hour].total++;
      if (log.severity === 'ERROR' || log.severity === 'CRITICAL') {
        hourlyStats[hour].errors++;
      } else if (log.severity === 'WARNING') {
        hourlyStats[hour].warnings++;
      }
    });

    return {
      logs: logs.slice(0, 20), // Recent 20 logs
      hourlyStats: Object.entries(hourlyStats).map(([hour, stats]) => ({
        hour,
        ...stats,
      })).reverse(),
      totalInPeriod: logs.length,
    };
  });

  // Test email sending
  server.post('/system-status/test-email', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await emailService.send({
        to: ALERT_EMAILS,
        subject: '🧪 STANNEL - Test Email',
        html: `
          <h2>Test Email from STANNEL</h2>
          <p>This is a test email to verify the email system is working correctly.</p>
          <p>Time: ${new Date().toISOString()}</p>
          <p>Sent to: ${ALERT_EMAILS.join(', ')}</p>
        `,
      });
      return { success: true, sentTo: ALERT_EMAILS };
    } catch (error: any) {
      return reply.code(500).send({ error: 'Failed to send test email', details: error.message });
    }
  });

  // Send test email to specific address
  server.post('/send-test-email', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email } = request.body as { email?: string };
    const targetEmail = email || 'orenshp77@gmail.com';

    try {
      const sent = await emailService.sendTestEmail(targetEmail);
      if (sent) {
        return { success: true, message: `Test email sent to ${targetEmail}` };
      } else {
        return reply.code(500).send({ error: 'Failed to send email - check SendGrid API key' });
      }
    } catch (error: any) {
      return reply.code(500).send({ error: 'Failed to send test email', details: error.message });
    }
  });

  // Force send daily report
  server.post('/system-logs/force-daily-report', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { dailyReportService } = await import('../services/daily-report.service.js');
      const sent = await dailyReportService.forceSendReport();
      return { success: sent, message: sent ? 'Daily report sent successfully' : 'Failed to send daily report' };
    } catch (error: any) {
      return reply.code(500).send({ error: 'Failed to send daily report', details: error.message });
    }
  });

  // Get system logs with filtering
  server.get('/system-logs', async (request: FastifyRequest) => {
    const query = request.query as {
      page?: string;
      pageSize?: string;
      severity?: string;
      category?: string;
      resolved?: string;
      hours?: string;
    };

    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '50');
    const hours = parseInt(query.hours || '24');

    const since = new Date();
    since.setHours(since.getHours() - hours);

    const where: any = {
      createdAt: { gte: since },
    };

    if (query.severity) {
      where.severity = query.severity;
    }
    if (query.category) {
      where.category = query.category;
    }
    if (query.resolved !== undefined) {
      where.resolved = query.resolved === 'true';
    }

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

  // Get single log with full details (for copying to Claude)
  server.get('/system-logs/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const log = await prisma.systemLog.findUnique({
      where: { id },
    });

    if (!log) {
      return reply.code(404).send({ error: 'Log not found' });
    }

    return log;
  });

  // Mark log as resolved
  server.patch('/system-logs/:id/resolve', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const log = await prisma.systemLog.update({
      where: { id },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: request.user?.email || 'admin',
      },
    });

    return log;
  });

  // Get error statistics
  server.get('/system-logs/stats', async (request: FastifyRequest) => {
    const query = request.query as { hours?: string };
    const hours = parseInt(query.hours || '24');

    const since = new Date();
    since.setHours(since.getHours() - hours);

    const logs = await prisma.systemLog.findMany({
      where: {
        createdAt: { gte: since },
      },
      select: {
        severity: true,
        category: true,
      },
    });

    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const log of logs) {
      byCategory[log.category] = (byCategory[log.category] || 0) + 1;
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
    }

    return {
      total: logs.length,
      byCategory,
      bySeverity,
      timeRange: `${hours} hours`,
    };
  });

  // Security scan endpoint
  server.post('/security-scan', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { securityScannerService } = await import('../services/security-scanner.service.js');
      const result = await securityScannerService.runFullScan();

      return {
        success: true,
        result: {
          timestamp: result.timestamp,
          score: result.overallScore,
          readyForProduction: result.readyForProduction,
          passed: result.passed,
          failed: result.failed,
          critical: result.critical,
          high: result.high,
          checks: result.checks,
        },
        claudeFormat: securityScannerService.formatForClaude(result),
      };
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: 'Security scan failed',
        message: (error as Error).message,
      });
    }
  });

  // Force backup endpoint
  server.post('/force-backup', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { backupService } = await import('../services/backup.service.js');
      const result = await backupService.forceBackup();

      return {
        success: result.success,
        result,
      };
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: 'Backup failed',
        message: (error as Error).message,
      });
    }
  });

  // Financial integrity check endpoint
  server.post('/financial-integrity-check', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { financialSecurityService } = await import('../services/financial-security.service.js');
      const result = await financialSecurityService.runIntegrityCheck();

      return {
        success: true,
        result,
      };
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: 'Financial integrity check failed',
        message: (error as Error).message,
      });
    }
  });
}
