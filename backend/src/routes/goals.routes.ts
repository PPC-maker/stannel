// Architect Goals Routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

export async function goalsRoutes(server: FastifyInstance) {
  // Get all goals for the current architect
  server.get('/', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;

    if (user.role !== 'ARCHITECT' || !user.architectProfile) {
      return reply.code(403).send({ error: 'Only architects can access goals' });
    }

    const goals = await prisma.architectGoal.findMany({
      where: { architectId: user.architectProfile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        bonusTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    return { data: goals };
  });

  // Get active goal
  server.get('/active', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;

    if (user.role !== 'ARCHITECT' || !user.architectProfile) {
      return reply.code(403).send({ error: 'Only architects can access goals' });
    }

    const activeGoal = await prisma.architectGoal.findFirst({
      where: {
        architectId: user.architectProfile.id,
        isActive: true,
      },
      include: {
        bonusTransactions: true,
      },
    });

    return activeGoal || null;
  });

  // Get bonus transactions history
  server.get('/bonuses', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const query = request.query as { page?: string; pageSize?: string };
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '20');

    if (user.role !== 'ARCHITECT' || !user.architectProfile) {
      return reply.code(403).send({ error: 'Only architects can access goals' });
    }

    const [bonuses, total] = await Promise.all([
      prisma.bonusTransaction.findMany({
        where: { architectId: user.architectProfile.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          goal: true,
        },
      }),
      prisma.bonusTransaction.count({
        where: { architectId: user.architectProfile.id },
      }),
    ]);

    return {
      data: bonuses,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  });

  // Get goal statistics
  server.get('/stats', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;

    if (user.role !== 'ARCHITECT' || !user.architectProfile) {
      return reply.code(403).send({ error: 'Only architects can access goals' });
    }

    const [totalGoals, achievedGoals, totalBonuses] = await Promise.all([
      prisma.architectGoal.count({
        where: { architectId: user.architectProfile.id },
      }),
      prisma.architectGoal.count({
        where: {
          architectId: user.architectProfile.id,
          targetMet: true,
        },
      }),
      prisma.bonusTransaction.aggregate({
        where: {
          architectId: user.architectProfile.id,
          status: 'CREDITED',
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalGoals,
      achievedGoals,
      totalBonusEarned: totalBonuses._sum.amount || 0,
      achievementRate: totalGoals > 0 ? Math.round((achievedGoals / totalGoals) * 100) : 0,
    };
  });

  // Admin: Create a new goal for an architect
  server.post('/admin/create', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;

    if (user.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Admin access required' });
    }

    const body = request.body as {
      architectId: string;
      targetAmount: number;
      bonusPercentage: number;
      periodType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
      startDate: string;
      endDate: string;
    };

    // Deactivate any existing active goals for this architect
    await prisma.architectGoal.updateMany({
      where: { architectId: body.architectId, isActive: true },
      data: { isActive: false },
    });

    const goal = await prisma.architectGoal.create({
      data: {
        architectId: body.architectId,
        targetAmount: body.targetAmount,
        bonusPercentage: body.bonusPercentage,
        periodType: body.periodType,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        isActive: true,
      },
    });

    return goal;
  });

  // Admin: Get all goals (for management)
  server.get('/admin/all', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;

    if (user.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Admin access required' });
    }

    const query = request.query as { page?: string; pageSize?: string; activeOnly?: string };
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '20');
    const activeOnly = query.activeOnly === 'true';

    const where = activeOnly ? { isActive: true } : {};

    const [goals, total] = await Promise.all([
      prisma.architectGoal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          architect: {
            include: {
              user: {
                select: { name: true, email: true },
              },
            },
          },
        },
      }),
      prisma.architectGoal.count({ where }),
    ]);

    return {
      data: goals,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  });

  // Admin: Update goal progress (called when invoice is paid)
  server.patch('/admin/:id/progress', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = request.params as { id: string };

    if (user.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Admin access required' });
    }

    const body = request.body as { addAmount: number };

    const goal = await prisma.architectGoal.findUnique({ where: { id } });
    if (!goal) {
      return reply.code(404).send({ error: 'Goal not found' });
    }

    const newRevenue = goal.currentPeriodRevenue + body.addAmount;
    const targetMet = newRevenue >= goal.targetAmount;

    const updatedGoal = await prisma.architectGoal.update({
      where: { id },
      data: {
        currentPeriodRevenue: newRevenue,
        targetMet,
        targetMetAt: targetMet && !goal.targetMet ? new Date() : goal.targetMetAt,
      },
    });

    // If target is met for the first time, create bonus transaction
    if (targetMet && !goal.targetMet) {
      const bonusAmount = goal.targetAmount * (goal.bonusPercentage / 100);

      await prisma.bonusTransaction.create({
        data: {
          architectId: goal.architectId,
          goalId: goal.id,
          bonusType: 'goal_achieved',
          amount: bonusAmount,
          status: 'CREDITED',
          creditedAt: new Date(),
        },
      });

      // Credit architect's balance
      await prisma.architectProfile.update({
        where: { id: goal.architectId },
        data: {
          cashBalance: { increment: bonusAmount },
          totalEarned: { increment: bonusAmount },
        },
      });
    }

    return updatedGoal;
  });
}
