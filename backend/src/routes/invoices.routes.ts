// Invoice Routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma.js';
import { authMiddleware, requireArchitect } from '../middleware/auth.middleware.js';
import { storageService } from '../services/storage.service.js';
import { aiService } from '../services/ai.service.js';
import { slaService } from '../services/sla.service.js';
import { wsService } from '../services/websocket.service.js';
import { z } from 'zod';

export async function invoiceRoutes(server: FastifyInstance) {
  // Get list of suppliers for invoice upload
  server.get('/suppliers', {
    preHandler: [authMiddleware],
  }, async () => {
    const suppliers = await prisma.supplierProfile.findMany({
      where: {
        user: { isActive: true },
      },
      select: {
        id: true,
        companyName: true,
        commissionRate: true,
        user: {
          select: { name: true, email: true, id: true },
        },
      },
      orderBy: { companyName: 'asc' },
    });

    return {
      data: suppliers.map(s => ({
        id: s.id,
        companyName: s.companyName || s.user.name || 'ספק',
        email: s.user.email,
        userId: s.user.id,
        commissionRate: s.commissionRate,
      })),
    };
  });

  // Get suppliers connected to architect (suppliers with invoices from this architect)
  server.get('/my-suppliers', {
    preHandler: [authMiddleware, requireArchitect],
  }, async (request: FastifyRequest) => {
    const architectId = request.user!.architectProfile!.id;

    // Get unique suppliers from architect's invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        architectId,
        deletedAt: null,
      },
      select: {
        supplierId: true,
        supplier: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
      distinct: ['supplierId'],
    });

    // Get invoice counts per supplier
    const supplierStats = await prisma.invoice.groupBy({
      by: ['supplierId'],
      where: {
        architectId,
        deletedAt: null,
      },
      _count: { id: true },
      _sum: { amount: true },
    });

    const statsMap = new Map(supplierStats.map(s => [s.supplierId, { count: s._count.id, totalAmount: s._sum.amount || 0 }]));

    return {
      data: invoices.map(inv => ({
        id: inv.supplier.id,
        companyName: inv.supplier.companyName || inv.supplier.user.name || 'ספק',
        email: inv.supplier.user.email,
        invoiceCount: statsMap.get(inv.supplierId)?.count || 0,
        totalAmount: statsMap.get(inv.supplierId)?.totalAmount || 0,
      })),
    };
  });

  // Upload invoice (Architect only)
  server.post('/upload', {
    preHandler: [authMiddleware, requireArchitect],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    let data;
    try {
      data = await request.file();
    } catch (fileError) {
      console.error('[Invoice Upload] Error getting file:', fileError);
      return reply.code(400).send({ error: 'Failed to process file upload' });
    }

    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    const fields = data.fields as Record<string, any>;

    // Handle both field structures: { value: string } or direct string
    const getFieldValue = (field: any): string => {
      if (!field) return '';
      if (typeof field === 'string') return field;
      if (field.value) return field.value;
      return '';
    };

    const amount = parseFloat(getFieldValue(fields.amount) || '0');
    const supplierId = getFieldValue(fields.supplierId);

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

    // Check architect profile exists
    if (!request.user?.architectProfile?.id) {
      return reply.code(400).send({ error: 'User does not have an architect profile' });
    }

    // Upload to GCS (with image enhancement for photos)
    let imageUrl: string;
    try {
      let buffer = await data.toBuffer();

      // Enhance invoice image if it's a photo (not PDF)
      const isPdf = data.filename?.toLowerCase().endsWith('.pdf');
      if (!isPdf && buffer.length > 0) {
        try {
          const { imageProcessorService } = await import('../services/image-processor.service.js');
          buffer = await imageProcessorService.enhanceInvoiceImage(buffer);
          console.log('[Invoice Upload] Image enhanced successfully');
        } catch (enhanceError) {
          console.warn('[Invoice Upload] Image enhancement skipped:', enhanceError);
        }
      }

      imageUrl = await storageService.uploadInvoice(buffer, data.filename);
    } catch (uploadError) {
      console.error('[Invoice Upload] Storage upload failed:', uploadError);
      return reply.code(500).send({ error: 'Failed to upload file to storage' });
    }

    // Create invoice with SLA deadline (48 hours)
    const slaDeadline = new Date();
    slaDeadline.setHours(slaDeadline.getHours() + 48);

    let invoice;
    try {
      invoice = await prisma.invoice.create({
        data: {
          imageUrl,
          amount,
          architectId: request.user.architectProfile.id,
          supplierId,
          slaDeadline,
        },
        include: {
          architect: { include: { user: true } },
          supplier: { include: { user: true } },
        },
      });
    } catch (dbError) {
      console.error('[Invoice Upload] Database error:', dbError);
      return reply.code(500).send({ error: 'Failed to create invoice in database' });
    }

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

    // Broadcast to all connected clients
    wsService.invoiceCreated(invoice);

    return { invoice, aiValidation };
  });

  // Get all invoices for user (architect sees their uploads, supplier sees invoices for them)
  server.get('/', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest) => {
    const query = request.query as { page?: string; pageSize?: string; status?: string };
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '10');

    // Build where clause based on user role
    // Always exclude soft-deleted invoices (deletedAt: null)
    let where: any = {
      deletedAt: null,
    };

    if (request.user!.role === 'ARCHITECT' && request.user!.architectProfile) {
      // Architects see invoices they uploaded
      where.architectId = request.user!.architectProfile.id;
    } else if (request.user!.role === 'SUPPLIER' && request.user!.supplierProfile) {
      // Suppliers see invoices uploaded for them
      where.supplierId = request.user!.supplierProfile.id;
    } else if (request.user!.role === 'ADMIN') {
      // Admins see all invoices
    } else {
      // No valid profile, return empty
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    // Add status filter if provided
    if (query.status) {
      where.status = query.status;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          architect: { include: { user: { select: { name: true, email: true } } } },
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

    // Non-admins can't view deleted invoices
    if (invoice.deletedAt && request.user!.role !== 'ADMIN') {
      return reply.code(404).send({ error: 'Invoice not found' });
    }

    // Verify user has permission to view this invoice
    const isAdmin = request.user!.role === 'ADMIN';
    const isOwnerArchitect = request.user!.role === 'ARCHITECT' &&
      request.user!.architectProfile?.id === invoice.architectId;
    const isOwnerSupplier = request.user!.role === 'SUPPLIER' &&
      request.user!.supplierProfile?.id === invoice.supplierId;

    if (!isAdmin && !isOwnerArchitect && !isOwnerSupplier) {
      return reply.code(403).send({ error: 'You do not have permission to view this invoice' });
    }

    return invoice;
  });

  // Get invoice stats
  server.get('/stats', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest) => {
    // Build base where clause based on user role
    // Always exclude soft-deleted invoices
    let baseWhere: any = {
      deletedAt: null,
    };

    if (request.user!.role === 'ARCHITECT' && request.user!.architectProfile) {
      baseWhere.architectId = request.user!.architectProfile.id;
    } else if (request.user!.role === 'SUPPLIER' && request.user!.supplierProfile) {
      baseWhere.supplierId = request.user!.supplierProfile.id;
    } else if (request.user!.role === 'ADMIN') {
      // Admin sees all
    } else {
      return { total: 0, pending: 0, approved: 0, rejected: 0, paid: 0, overdue: 0, approvedThisMonth: 0, totalAmountThisMonth: 0 };
    }

    const [total, pending, approved, rejected, paid, overdue, pendingSupplierPay] = await Promise.all([
      prisma.invoice.count({ where: baseWhere }),
      prisma.invoice.count({ where: { ...baseWhere, status: 'PENDING_ADMIN' } }),
      prisma.invoice.count({ where: { ...baseWhere, status: { in: ['APPROVED', 'PENDING_SUPPLIER_PAY'] } } }),
      prisma.invoice.count({ where: { ...baseWhere, status: 'REJECTED' } }),
      prisma.invoice.count({ where: { ...baseWhere, status: 'PAID' } }),
      prisma.invoice.count({ where: { ...baseWhere, status: 'OVERDUE' } }),
      prisma.invoice.count({ where: { ...baseWhere, status: 'PENDING_SUPPLIER_PAY' } }),
    ]);

    // This month stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const approvedThisMonth = await prisma.invoice.count({
      where: {
        ...baseWhere,
        status: { in: ['APPROVED', 'PAID'] },
        approvedAt: { gte: startOfMonth },
      },
    });

    const totalAmountThisMonth = await prisma.invoice.aggregate({
      where: {
        ...baseWhere,
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
      pendingSupplierPay,
      approvedThisMonth,
      totalAmountThisMonth: totalAmountThisMonth._sum.amount || 0,
    };
  });
}
