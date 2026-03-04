// Wallet Routes

import { FastifyInstance, FastifyRequest } from 'fastify';
import prisma from '../lib/prisma.js';
import { authMiddleware, requireArchitect } from '../middleware/auth.middleware.js';

export async function walletRoutes(server: FastifyInstance) {
  // Get wallet balance
  server.get('/balance', {
    preHandler: [authMiddleware, requireArchitect],
  }, async (request: FastifyRequest) => {
    const profile = await prisma.architectProfile.findUnique({
      where: { id: request.user!.architectProfile!.id },
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
  });

  // Get transaction history
  server.get('/transactions', {
    preHandler: [authMiddleware, requireArchitect],
  }, async (request: FastifyRequest) => {
    const query = request.query as { page?: string; pageSize?: string; type?: string };
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '20');

    const where = {
      architectId: request.user!.architectProfile!.id,
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
  });

  // Get digital card details
  server.get('/card', {
    preHandler: [authMiddleware, requireArchitect],
  }, async (request: FastifyRequest) => {
    const profile = await prisma.architectProfile.findUnique({
      where: { id: request.user!.architectProfile!.id },
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
    };
  });
}
