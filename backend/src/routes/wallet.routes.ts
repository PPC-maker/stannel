// Wallet Routes - Supports both Architects and Suppliers

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

export async function walletRoutes(server: FastifyInstance) {
  // Get wallet balance - works for both architects and suppliers
  server.get('/balance', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;

    // Architect wallet
    if (user.role === 'ARCHITECT' && user.architectProfile) {
      const profile = await prisma.architectProfile.findUnique({
        where: { id: user.architectProfile.id },
        select: {
          pointsBalance: true,
          cashBalance: true,
          totalEarned: true,
          totalRedeemed: true,
        },
      });

      return {
        points: profile?.pointsBalance || 0,
        cash: profile?.cashBalance || 0,
        totalEarned: profile?.totalEarned || 0,
        totalRedeemed: profile?.totalRedeemed || 0,
      };
    }

    // Supplier wallet
    if (user.role === 'SUPPLIER' && user.supplierProfile) {
      const profile = await prisma.supplierProfile.findUnique({
        where: { id: user.supplierProfile.id },
        select: {
          pointsBalance: true,
          totalEarned: true,
          totalRedeemed: true,
        },
      });

      return {
        points: profile?.pointsBalance || 0,
        cash: 0, // Suppliers don't have cash balance
        totalEarned: profile?.totalEarned || 0,
        totalRedeemed: profile?.totalRedeemed || 0,
      };
    }

    return reply.code(403).send({ error: 'No wallet access for this user type' });
  });

  // Get transaction history - works for both architects and suppliers
  server.get('/transactions', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const query = request.query as { page?: string; pageSize?: string; type?: string };
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '20');

    // Architect transactions
    if (user.role === 'ARCHITECT' && user.architectProfile) {
      const where = {
        architectId: user.architectProfile.id,
        ...(query.type && { type: query.type }),
      };

      const [transactions, total] = await Promise.all([
        prisma.cardTransaction.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.cardTransaction.count({ where }),
      ]);

      return {
        data: transactions,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    // Supplier transactions
    if (user.role === 'SUPPLIER' && user.supplierProfile) {
      const where = {
        supplierId: user.supplierProfile.id,
        ...(query.type && { type: query.type }),
      };

      const [transactions, total] = await Promise.all([
        prisma.supplierCardTransaction.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.supplierCardTransaction.count({ where }),
      ]);

      return {
        data: transactions,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    return reply.code(403).send({ error: 'No wallet access for this user type' });
  });

  // Get digital card details - works for both architects and suppliers
  server.get('/card', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;

    // Architect card
    if (user.role === 'ARCHITECT' && user.architectProfile) {
      const profile = await prisma.architectProfile.findUnique({
        where: { id: user.architectProfile.id },
        select: {
          cardNumber: true,
          cardExpiry: true,
          pointsBalance: true,
          user: {
            select: {
              name: true,
              rank: true,
            },
          },
        },
      });

      return {
        cardNumber: profile?.cardNumber,
        holderName: profile?.user.name,
        rank: profile?.user.rank,
        pointsBalance: profile?.pointsBalance,
        expiryDate: profile?.cardExpiry,
        userType: 'אדריכל',
      };
    }

    // Supplier card
    if (user.role === 'SUPPLIER' && user.supplierProfile) {
      const profile = await prisma.supplierProfile.findUnique({
        where: { id: user.supplierProfile.id },
        select: {
          cardNumber: true,
          pointsBalance: true,
          companyName: true,
          user: {
            select: {
              name: true,
              rank: true,
            },
          },
        },
      });

      return {
        cardNumber: profile?.cardNumber,
        holderName: profile?.companyName || profile?.user.name,
        rank: profile?.user.rank,
        pointsBalance: profile?.pointsBalance,
        expiryDate: null,
        userType: 'ספק',
      };
    }

    return reply.code(403).send({ error: 'No wallet access for this user type' });
  });
}
