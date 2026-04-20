// Loyalty Service - Points Engine

import prisma from '../lib/prisma.js';
import { notificationService } from './notification.service.js';

// Commission rate constants
const COMMISSION_RATE = 0.02;    // 2% for each side (4% total)
const POINTS_PER_SHEKEL = 40;    // 1₪ = 40 points

export const loyaltyService = {
  // Credit points for paid invoice
  // Commission is per-supplier: supplier.commissionRate for each side
  async creditInvoicePoints(invoiceId: string): Promise<void> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { supplier: true },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Use supplier-specific commission rate, fallback to default 2%
    const rate = invoice.supplier?.commissionRate ?? COMMISSION_RATE;

    // Calculate commissions
    const architectCommission = invoice.amount * rate;   // supplier rate in ₪
    const adminCommission = invoice.amount * rate;       // supplier rate in ₪
    const architectPoints = architectCommission * POINTS_PER_SHEKEL; // Convert to points

    await prisma.$transaction([
      // Update architect points balance
      prisma.architectProfile.update({
        where: { id: invoice.architectId },
        data: {
          pointsBalance: { increment: architectPoints },
          totalEarned: { increment: architectPoints },
          monthlyProgress: { increment: invoice.amount },
        },
      }),
      // Create transaction record for architect
      prisma.cardTransaction.create({
        data: {
          architectId: invoice.architectId,
          type: 'CREDIT',
          amount: architectPoints,
          description: `זיכוי ${architectPoints.toLocaleString()} נקודות (₪${architectCommission.toLocaleString()}) מחשבונית #${invoiceId.slice(-6)}`,
          invoiceId,
        },
      }),
      // Track commission on invoice
      prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          adminCommission,
          architectPoints,
          architectCommission,
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

  // Redeem product with points (and optional cash completion)
  async redeemProduct(architectId: string, productId: string, cashAmount: number = 0) {
    const [architect, product] = await Promise.all([
      prisma.architectProfile.findUnique({ where: { id: architectId } }),
      prisma.product.findUnique({ where: { id: productId } }),
    ]);

    if (!architect) throw new Error('Architect not found');
    if (!product) throw new Error('Product not found');
    if (!product.isActive) throw new Error('Product not available');
    if (product.stock < 1) throw new Error('Product out of stock');

    const userPoints = architect.pointsBalance;
    const pointsPerShekel = product.pointsPerShekel || 100;

    // Calculate how much is needed
    let pointsToUse: number;
    let requiredCash: number;

    if (userPoints >= product.pointCost) {
      // User has enough points - full point redemption
      pointsToUse = product.pointCost;
      requiredCash = 0;
    } else {
      // User needs cash completion
      pointsToUse = userPoints; // Use all available points
      const missingPoints = product.pointCost - userPoints;
      requiredCash = Math.ceil(missingPoints / pointsPerShekel);

      // Verify cash amount is sufficient
      if (cashAmount < requiredCash) {
        throw new Error(`נדרש תשלום של ₪${requiredCash} להשלמת המימוש. יתרת הנקודות שלך: ${userPoints.toLocaleString()}`);
      }
    }

    const redemption = await prisma.$transaction(async (tx) => {
      // Deduct points (use whatever the user has, up to the product cost)
      if (pointsToUse > 0) {
        await tx.architectProfile.update({
          where: { id: architectId },
          data: {
            pointsBalance: { decrement: pointsToUse },
            totalRedeemed: { increment: pointsToUse },
          },
        });
      }

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
          pointsUsed: pointsToUse,
          cashPaid: requiredCash,
        },
        include: { product: true },
      });

      // Create transaction for points used
      if (pointsToUse > 0) {
        await tx.cardTransaction.create({
          data: {
            architectId,
            type: 'DEBIT',
            amount: pointsToUse,
            description: requiredCash > 0
              ? `מימוש: ${product.name} (+ ₪${requiredCash} השלמה)`
              : `מימוש: ${product.name}`,
          },
        });
      } else {
        // If no points used, still create a record with 0 points
        await tx.cardTransaction.create({
          data: {
            architectId,
            type: 'DEBIT',
            amount: 0,
            description: `מימוש: ${product.name} (₪${requiredCash} מזומן)`,
          },
        });
      }

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
