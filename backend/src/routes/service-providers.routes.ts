// Service Providers Routes - For Architect Tools

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.middleware.js';

export async function serviceProvidersRoutes(server: FastifyInstance) {
  // ============ SPECIFIC ROUTES FIRST (before /:id to avoid conflicts) ============

  // Get categories list
  server.get('/meta/categories', {
    preHandler: [authMiddleware],
  }, async () => {
    return {
      categories: [
        { value: 'CONTRACTOR', label: 'קבלן' },
        { value: 'ELECTRICIAN', label: 'חשמלאי' },
        { value: 'PLUMBER', label: 'אינסטלטור' },
        { value: 'PAINTER', label: 'צבעי' },
        { value: 'CARPENTER', label: 'נגר' },
        { value: 'LANDSCAPER', label: 'גנן' },
        { value: 'INTERIOR_DESIGNER', label: 'מעצב פנים' },
        { value: 'OTHER', label: 'אחר' },
      ],
    };
  });

  // ============ ADMIN ROUTES ============

  // Admin: Get all service providers (including inactive)
  server.get('/admin/all', {
    preHandler: [authMiddleware, requireAdmin],
  }, async (request: FastifyRequest) => {
    const query = request.query as { page?: string; pageSize?: string };
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '20');

    const [providers, total] = await Promise.all([
      prisma.serviceProvider.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.serviceProvider.count(),
    ]);

    return {
      data: providers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  });

  // Admin: Create service provider
  server.post('/admin/create', {
    preHandler: [authMiddleware, requireAdmin],
  }, async (request: FastifyRequest) => {
    const body = request.body as {
      name: string;
      phone?: string;
      email?: string;
      category: string;
      description?: string;
      website?: string;
      address?: string;
    };

    const provider = await prisma.serviceProvider.create({
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email,
        category: body.category as any,
        description: body.description,
        website: body.website,
        address: body.address,
        isActive: true,
      },
    });

    return provider;
  });

  // Admin: Update service provider
  server.patch('/admin/:id', {
    preHandler: [authMiddleware, requireAdmin],
  }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };

    const body = request.body as Partial<{
      name: string;
      phone: string;
      email: string;
      category: string;
      description: string;
      website: string;
      address: string;
      isActive: boolean;
      isVerified: boolean;
    }>;

    const provider = await prisma.serviceProvider.update({
      where: { id },
      data: body as any,
    });

    return provider;
  });

  // Admin: Delete service provider
  server.delete('/admin/:id', {
    preHandler: [authMiddleware, requireAdmin],
  }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };

    await prisma.serviceProvider.delete({ where: { id } });

    return { success: true };
  });

  // ============ PUBLIC ROUTES (with auth) ============

  // Get all active service providers
  server.get('/', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest) => {
    const query = request.query as { category?: string; search?: string };

    const where: any = { isActive: true };

    if (query.category) {
      where.category = query.category;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const providers = await prisma.serviceProvider.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return { data: providers };
  });

  // Get single service provider - MUST BE LAST (/:id matches anything)
  server.get('/:id', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const provider = await prisma.serviceProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      return reply.code(404).send({ error: 'Service provider not found' });
    }

    return provider;
  });
}
