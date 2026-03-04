// Admin Routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.middleware.js';
import { loyaltyService } from '../services/loyalty.service.js';
import { slaService } from '../services/sla.service.js';
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

  // Activate user
  server.patch('/users/:id/activate', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: request.user!.id,
        action: 'USER_ACTIVATED',
        entityId: id,
      },
    });

    return user;
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

    let newStatus = body.status;
    let approvedAt = null;

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
      data: body,
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
      data: body,
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
}
