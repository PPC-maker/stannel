// Invoice Routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma.js';
import { authMiddleware, requireArchitect } from '../middleware/auth.middleware.js';
import { storageService } from '../services/storage.service.js';
import { aiService } from '../services/ai.service.js';
import { slaService } from '../services/sla.service.js';
import { z } from 'zod';

export async function invoiceRoutes(server: FastifyInstance) {
  // Upload invoice (Architect only)
  server.post('/upload', {
    preHandler: [authMiddleware, requireArchitect],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await request.file();

    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    const fields = data.fields as Record<string, { value: string }>;
    const amount = parseFloat(fields.amount?.value || '0');
    const supplierId = fields.supplierId?.value;

    if (!amount || !supplierId) {
      return reply.code(400).send({ error: 'Amount and supplierId are required' });
    }

    // Verify supplier exists
    const supplier = await prisma.supplierProfile.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return reply.code(404).send({ error: 'Supplier not found' });
    }

    // Upload to GCS
    const buffer = await data.toBuffer();
    const imageUrl = await storageService.uploadInvoice(buffer, data.filename);

    // Create invoice with SLA deadline (48 hours)
    const slaDeadline = new Date();
    slaDeadline.setHours(slaDeadline.getHours() + 48);

    const invoice = await prisma.invoice.create({
      data: {
        imageUrl,
        amount,
        architectId: request.user!.architectProfile!.id,
        supplierId,
        slaDeadline,
      },
      include: {
        architect: { include: { user: true } },
        supplier: { include: { user: true } },
      },
    });

    // Create status history
    await prisma.invoiceStatusHistory.create({
      data: {
        invoiceId: invoice.id,
        status: 'PENDING_ADMIN',
        changedBy: request.user!.id,
      },
    });

    // Run AI validation in background
    let aiValidation = null;
    try {
      aiValidation = await aiService.validateInvoice(imageUrl, amount);

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          aiExtractedAmount: aiValidation.extractedAmount,
          aiConfidence: aiValidation.confidence,
          aiStatus: aiValidation.status,
        },
      });
    } catch (error) {
      console.error('AI validation failed:', error);
    }

    return { invoice, aiValidation };
  });

  // Get all invoices for architect
  server.get('/', {
    preHandler: [authMiddleware, requireArchitect],
  }, async (request: FastifyRequest) => {
    const query = request.query as { page?: string; pageSize?: string; status?: string };
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '10');

    const where = {
      architectId: request.user!.architectProfile!.id,
      ...(query.status && { status: query.status as any }),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          supplier: { include: { user: { select: { name: true, email: true } } } },
          statusHistory: { orderBy: { createdAt: 'desc' }, take: 5 },
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

  // Get single invoice
  server.get('/:id', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        architect: { include: { user: { select: { name: true, email: true } } } },
        supplier: { include: { user: { select: { name: true, email: true } } } },
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }

    return invoice;
  });

  // Get invoice stats
  server.get('/stats', {
    preHandler: [authMiddleware, requireArchitect],
  }, async (request: FastifyRequest) => {
    const architectId = request.user!.architectProfile!.id;

    const [total, pending, approved, rejected, paid, overdue] = await Promise.all([
      prisma.invoice.count({ where: { architectId } }),
      prisma.invoice.count({ where: { architectId, status: 'PENDING_ADMIN' } }),
      prisma.invoice.count({ where: { architectId, status: 'APPROVED' } }),
      prisma.invoice.count({ where: { architectId, status: 'REJECTED' } }),
      prisma.invoice.count({ where: { architectId, status: 'PAID' } }),
      prisma.invoice.count({ where: { architectId, status: 'OVERDUE' } }),
    ]);

    // This month stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const approvedThisMonth = await prisma.invoice.count({
      where: {
        architectId,
        status: { in: ['APPROVED', 'PAID'] },
        approvedAt: { gte: startOfMonth },
      },
    });

    const totalAmountThisMonth = await prisma.invoice.aggregate({
      where: {
        architectId,
        status: { in: ['APPROVED', 'PAID'] },
        approvedAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });

    return {
      total,
      pending,
      approved,
      rejected,
      paid,
      overdue,
      approvedThisMonth,
      totalAmountThisMonth: totalAmountThisMonth._sum.amount || 0,
    };
  });
}
