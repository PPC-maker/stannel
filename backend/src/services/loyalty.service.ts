// Loyalty Service - Points Engine

import prisma from '../lib/prisma.js';
import { notificationService } from './notification.service.js';

export const loyaltyService = {
  // Credit points for paid invoice
  async creditInvoicePoints(invoiceId: string): Promise<void> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Calculate points - 2% of invoice amount for both architect and supplier
    const pointsToCredit = invoice.amount * 0.02;

    await prisma.$transaction([
      // Update architect balance
      prisma.architectProfile.update({
        where: { id: invoice.architectId },
        data: {
          pointsBalance: { increment: pointsToCredit },
          totalEarned: { increment: pointsToCredit },
          monthlyProgress: { increment: invoice.amount },
        },
      }),
      // Create transaction record for architect
      prisma.cardTransaction.create({
        data: {
          architectId: invoice.architectId,
          type: 'CREDIT',
          amount: pointsToCredit,
          description: `זיכוי נקודות מחשבונית #${invoiceId.slice(-6)}`,
          invoiceId,
        },
      }),
      // Update supplier balance
      prisma.supplierProfile.update({
        where: { id: invoice.supplierId },
        data: {
          pointsBalance: { increment: pointsToCredit },
          totalEarned: { increment: pointsToCredit },
        },
      }),
      // Create transaction record for supplier
      prisma.supplierCardTransaction.create({
        data: {
          supplierId: invoice.supplierId,
          type: 'CREDIT',
          amount: pointsToCredit,
          description: `זיכוי נקודות מחשבונית #${invoiceId.slice(-6)}`,
          invoiceId,
        },
      }),
    ]);

    // Check for goal bonuses
    await this.checkGoalBonuses(invoice.architectId, invoice.supplierId);

    // Check for rank upgrade
    await this.checkRankUpgrade(invoice.architectId);
  },

  // Check and award goal bonuses
  async checkGoalBonuses(architectId: string, supplierId: string): Promise<void> {
    const architect = await prisma.architectProfile.findUnique({
      where: { id: architectId },
    });

    if (!architect) return;

    const goals = await prisma.supplierGoal.findMany({
      where: {
        supplierId,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });

    for (const goal of goals) {
      if (architect.monthlyProgress >= goal.targetAmount) {
        // Check if already awarded
        const existing = await prisma.goalBonus.findFirst({
          where: {
            architectId,
            goalId: goal.id,
            awardedAt: { gte: goal.startDate },
          },
        });

        if (!existing) {
          await prisma.$transaction([
            prisma.architectProfile.update({
              where: { id: architectId },
              data: {
                pointsBalance: { increment: goal.bonusPoints },
                totalEarned: { increment: goal.bonusPoints },
              },
            }),
            prisma.goalBonus.create({
              data: {
                architectId,
                goalId: goal.id,
                bonusPoints: goal.bonusPoints,
              },
            }),
            prisma.cardTransaction.create({
              data: {
                architectId,
                type: 'CREDIT',
                amount: goal.bonusPoints,
                description: `בונוס יעד: ${goal.targetAmount.toLocaleString()}₪`,
              },
            }),
          ]);

          // Send notification
          const user = await prisma.architectProfile.findUnique({
            where: { id: architectId },
            select: { userId: true },
          });

          if (user) {
            await notificationService.send(user.userId, {
              title: '🎉 יעד הושג!',
              body: `קיבלת בונוס של ${goal.bonusPoints.toLocaleString()} נקודות!`,
              data: { type: 'GOAL_BONUS', goalId: goal.id },
            });
          }
        }
      }
    }
  },

  // Check for rank upgrade
  async checkRankUpgrade(architectId: string): Promise<void> {
    const architect = await prisma.architectProfile.findUnique({
      where: { id: architectId },
      include: { user: true },
    });

    if (!architect) return;

    const totalEarned = architect.totalEarned;
    let newRank = architect.user.rank;

    // Rank thresholds
    if (totalEarned >= 100000) newRank = 'PLATINUM';
    else if (totalEarned >= 50000) newRank = 'GOLD';
    else if (totalEarned >= 20000) newRank = 'SILVER';
    else newRank = 'BRONZE';

    if (newRank !== architect.user.rank) {
      await prisma.user.update({
        where: { id: architect.userId },
        data: { rank: newRank },
      });

      await notificationService.send(architect.userId, {
        title: '🏆 עלית דרגה!',
        body: `מזל טוב! עלית לדרגת ${this.getRankLabel(newRank)}`,
        data: { type: 'RANK_UPGRADE', rank: newRank },
      });
    }
  },

  // Redeem product with points
  async redeemProduct(architectId: string, productId: string, cashAmount: number = 0) {
    const [architect, product] = await Promise.all([
      prisma.architectProfile.findUnique({ where: { id: architectId } }),
      prisma.product.findUnique({ where: { id: productId } }),
    ]);

    if (!architect) throw new Error('Architect not found');
    if (!product) throw new Error('Product not found');
    if (!product.isActive) throw new Error('Product not available');
    if (product.stock < 1) throw new Error('Product out of stock');
    if (architect.pointsBalance < product.pointCost) {
      throw new Error('Insufficient points');
    }

    const redemption = await prisma.$transaction(async (tx) => {
      // Deduct points
      await tx.architectProfile.update({
        where: { id: architectId },
        data: {
          pointsBalance: { decrement: product.pointCost },
          totalRedeemed: { increment: product.pointCost },
        },
      });

      // Reduce stock
      await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: 1 } },
      });

      // Create redemption record
      const redemption = await tx.redemption.create({
        data: {
          productId,
          architectId,
          pointsUsed: product.pointCost,
          cashPaid: cashAmount,
        },
        include: { product: true },
      });

      // Create transaction
      await tx.cardTransaction.create({
        data: {
          architectId,
          type: 'DEBIT',
          amount: product.pointCost,
          description: `מימוש: ${product.name}`,
        },
      });

      return redemption;
    });

    return redemption;
  },

  getRankLabel(rank: string): string {
    const labels: Record<string, string> = {
      BRONZE: 'ארד 🥉',
      SILVER: 'כסף 🥈',
      GOLD: 'זהב 🥇',
      PLATINUM: 'פלטינום 💎',
    };
    return labels[rank] || rank;
  },
};
