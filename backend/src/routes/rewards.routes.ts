// Rewards Routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma.js';
import { authMiddleware, requireArchitect } from '../middleware/auth.middleware.js';
import { loyaltyService } from '../services/loyalty.service.js';
import { z } from 'zod';

const redeemSchema = z.object({
  productId: z.string(),
  cashAmount: z.number().optional(),
});

export async function rewardsRoutes(server: FastifyInstance) {
  // Get all products
  server.get('/products', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest) => {
    const query = request.query as { page?: string; pageSize?: string; supplierId?: string };
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '20');

    const where = {
      isActive: true,
      stock: { gt: 0 },
      ...(query.supplierId && { supplierId: query.supplierId }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          supplier: {
            select: {
              companyName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  });

  // Get single product
  server.get('/products/:id', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            companyName: true,
          },
        },
      },
    });

    if (!product) {
      return reply.code(404).send({ error: 'Product not found' });
    }

    return product;
  });

  // Redeem product (Architect only)
  server.post('/redeem', {
    preHandler: [authMiddleware, requireArchitect],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = redeemSchema.parse(request.body);

      const redemption = await loyaltyService.redeemProduct(
        request.user!.architectProfile!.id,
        body.productId,
        body.cashAmount || 0
      );

      return redemption;
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({ error: error.message });
      }
      throw error;
    }
  });

  // Get redemption history
  server.get('/redemptions', {
    preHandler: [authMiddleware, requireArchitect],
  }, async (request: FastifyRequest) => {
    const query = request.query as { page?: string; pageSize?: string };
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '20');

    const where = {
      architectId: request.user!.architectProfile!.id,
    };

    const [redemptions, total] = await Promise.all([
      prisma.redemption.findMany({
        where,
        include: {
          product: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.redemption.count({ where }),
    ]);

    return {
      data: redemptions,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  });
}
