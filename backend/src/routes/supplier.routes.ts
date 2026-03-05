// Supplier Routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma.js';
import { authMiddleware, requireSupplier } from '../middleware/auth.middleware.js';
import { loyaltyService } from '../services/loyalty.service.js';
import { z } from 'zod';

const confirmPaymentSchema = z.object({
  reference: z.string().min(1),
});

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url(),
  pointCost: z.number().positive(),
  cashCost: z.number().min(0).default(0),
  stock: z.number().int().min(0),
});

export async function supplierRoutes(server: FastifyInstance) {
  // Apply supplier middleware
  server.addHook('preHandler', authMiddleware);
  server.addHook('preHandler', requireSupplier);

  // Get invoices pending payment
  server.get('/invoices', async (request: FastifyRequest) => {
    const query = request.query as { page?: string; pageSize?: string; status?: string };
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '20');

    const where = {
      supplierId: request.user!.supplierProfile!.id,
      ...(query.status ? { status: query.status as any } : { status: { in: ['PENDING_SUPPLIER_PAY', 'OVERDUE'] } }),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          architect: { include: { user: { select: { name: true, email: true } } } },
        },
        orderBy: { slaDeadline: 'asc' },
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

  // Confirm payment
  server.patch('/invoices/:id/confirm', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = confirmPaymentSchema.parse(request.body);

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }

    if (invoice.supplierId !== request.user!.supplierProfile!.id) {
      return reply.code(403).send({ error: 'Not your invoice' });
    }

    if (invoice.status !== 'PENDING_SUPPLIER_PAY' && invoice.status !== 'OVERDUE') {
      return reply.code(400).send({ error: 'Invoice not awaiting payment' });
    }

    // Update invoice
    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'PAID',
        supplierRef: body.reference,
        paidAt: new Date(),
      },
    });

    // Add to history
    await prisma.invoiceStatusHistory.create({
      data: {
        invoiceId: id,
        status: 'PAID',
        note: `Payment reference: ${body.reference}`,
        changedBy: request.user!.id,
      },
    });

    // Credit points to architect
    await loyaltyService.creditInvoicePoints(id);

    return updated;
  });

  // Get supplier goals
  server.get('/goals', async (request: FastifyRequest) => {
    const goals = await prisma.supplierGoal.findMany({
      where: {
        supplierId: request.user!.supplierProfile!.id,
        isActive: true,
        endDate: { gte: new Date() },
      },
      orderBy: { endDate: 'asc' },
    });

    return goals;
  });

  // Get product catalog
  server.get('/catalog', async (request: FastifyRequest) => {
    const products = await prisma.product.findMany({
      where: {
        supplierId: request.user!.supplierProfile!.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    return products;
  });

  // Add product
  server.post('/catalog', async (request: FastifyRequest) => {
    const body = productSchema.parse(request.body);

    const product = await prisma.product.create({
      data: {
        name: body.name,
        description: body.description,
        imageUrl: body.imageUrl,
        pointCost: body.pointCost,
        cashCost: body.cashCost,
        stock: body.stock,
        supplier: {
          connect: { id: request.user!.supplierProfile!.id },
        },
      },
    });

    return product;
  });

  // Update product
  server.patch('/catalog/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = productSchema.partial().parse(request.body);

    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      return reply.code(404).send({ error: 'Product not found' });
    }

    if (product.supplierId !== request.user!.supplierProfile!.id) {
      return reply.code(403).send({ error: 'Not your product' });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: body,
    });

    return updated;
  });

  // Dashboard stats
  server.get('/stats', async (request: FastifyRequest) => {
    const supplierId = request.user!.supplierProfile!.id;

    const [pendingPayments, paidThisMonth, overdueCount] = await Promise.all([
      prisma.invoice.aggregate({
        where: { supplierId, status: 'PENDING_SUPPLIER_PAY' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: {
          supplierId,
          status: 'PAID',
          paidAt: { gte: new Date(new Date().setDate(1)) },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.invoice.count({
        where: { supplierId, status: 'OVERDUE' },
      }),
    ]);

    return {
      pendingPayments: {
        amount: pendingPayments._sum.amount || 0,
        count: pendingPayments._count,
      },
      paidThisMonth: {
        amount: paidThisMonth._sum.amount || 0,
        count: paidThisMonth._count,
      },
      overdueCount,
    };
  });
}
