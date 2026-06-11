// Loyalty Service - Points Engine

import prisma from '../lib/prisma.js';
import { notificationService } from './notification.service.js';
import { financialSecurityService } from './financial-security.service.js';

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

    // Financial security: record & audit the credit transaction
    const creditContext = { userId: invoice.architectId, endpoint: 'invoices/credit' };
    financialSecurityService.recordTransaction(invoice.architectId, architectPoints);
    await financialSecurityService.auditLog(
      'INVOICE_CREDIT',
      invoice.architectId,
      architectPoints,
      { invoiceId, amount: invoice.amount, commission: architectCommission },
      creditContext
    );

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

    // Financial security: check for duplicate redemption
    const isDuplicate = await financialSecurityService.checkDuplicate(
      architect.userId,
      product.pointCost,
      'REDEMPTION',
      productId
    );
    if (isDuplicate) {
      throw new Error('בקשה כפולה. נסה שוב בעוד מספר דקות.');
    }

    // Financial security: validate transaction limits & balance
    const context = { userId: architect.userId, endpoint: 'rewards/redeem' };
    const validation = await financialSecurityService.validateTransaction(
      architect.userId,
      product.pointCost,
      'REDEMPTION',
      context
    );
    if (!validation.valid) {
      throw new Error(validation.reason || 'Transaction validation failed');
    }

    const userPoints = architect.pointsBalance;
    const pointsPerShekel = product.pointsPerShekel || 100;

    // Calculate how much is needed
    let pointsToUse: number;
    let requiredCash: number;

    if (userPoints >= product.pointCost) {
      // User has enough points - full point redemption
      pointsToUse = product.pointCost;
      requiredCash = 0;
    } else if (cashAmount > 0) {
      // User wants cash completion - verify amount
      pointsToUse = userPoints;
      const missingPoints = product.pointCost - userPoints;
      requiredCash = Math.ceil(missingPoints / pointsPerShekel);

      if (cashAmount < requiredCash) {
        throw new Error(`נדרש תשלום של ₪${requiredCash} להשלמת המימוש. יתרת הנקודות שלך: ${userPoints.toLocaleString()}`);
      }
    } else {
      // User has insufficient points and didn't provide cash - BLOCK
      const missingPoints = product.pointCost - userPoints;
      const cashNeeded = Math.ceil(missingPoints / pointsPerShekel);
      throw new Error(`אין מספיק נקודות למימוש. חסרות ${missingPoints.toLocaleString()} נקודות (₪${cashNeeded.toLocaleString()}). יתרתך: ${userPoints.toLocaleString()} נקודות.`);
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

    // Financial security: record transaction & verify balance integrity
    financialSecurityService.recordTransaction(architect.userId, pointsToUse);
    await financialSecurityService.verifyBalanceIntegrity(
      architect.userId,
      -pointsToUse,
      'REDEMPTION',
      context
    );
    await financialSecurityService.auditLog(
      'REDEMPTION',
      architect.userId,
      pointsToUse,
      { productId, productName: product.name, cashPaid: requiredCash },
      context
    );

    // Send notification to all admin users about the redemption
    try {
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });
      const architectUser = await prisma.user.findFirst({
        where: { architectProfile: { id: architectId } },
        select: { name: true, email: true },
      });
      const userName = architectUser?.name || architectUser?.email || 'משתמש';

      for (const admin of adminUsers) {
        await prisma.notification.create({
          data: {
            recipientId: admin.id,
            type: 'REDEMPTION',
            title: 'הזמנה חדשה מחנות ההטבות',
            message: `${userName} מימש את "${product.name}" (${pointsToUse.toLocaleString()} נק׳${requiredCash > 0 ? ` + ₪${requiredCash}` : ''})`,
            relatedEntity: 'redemption',
            relatedId: redemption.id,
          },
        });
      }
    } catch (notifError) {
      console.error('Failed to send admin notification for redemption:', notifError);
    }

    // Send email to architect + supplier + in-app notification to architect
    try {
      const { emailService } = await import('./email.service.js');
      const architectUser = await prisma.user.findFirst({
        where: { architectProfile: { id: architectId } },
        select: { id: true, name: true, email: true },
      });

      // Email to architect
      if (architectUser?.email) {
        await emailService.sendRedemptionConfirmation(
          architectUser.email,
          product.name,
          pointsToUse,
          requiredCash
        );
      }

      // In-app notification to architect
      if (architectUser?.id) {
        await prisma.notification.create({
          data: {
            recipientId: architectUser.id,
            type: 'REDEMPTION',
            title: 'ההטבה נוצלה בהצלחה!',
            message: `מימשת את "${product.name}" (${pointsToUse.toLocaleString()} נק׳). נציג יצור איתך קשר בקרוב.`,
            relatedEntity: 'redemption',
            relatedId: redemption.id,
          },
        });
      }

      // Email to supplier - use product.supplierEmail first, fallback to supplier profile
      const architectName = architectUser?.name || 'אדריכל';
      const date = new Date().toLocaleDateString('he-IL');
      let supplierEmailAddr = (product as any).supplierEmail;

      if (!supplierEmailAddr && product.supplierId) {
        const supplier = await prisma.supplierProfile.findUnique({
          where: { id: product.supplierId },
          include: { user: { select: { email: true } } },
        });
        supplierEmailAddr = supplier?.user?.email;
      }

      if (supplierEmailAddr) {
        await emailService.sendRedemptionSupplierAlert(
          supplierEmailAddr,
          product.name,
          architectName,
          date
        );
      }
    } catch (emailError) {
      console.error('Failed to send redemption emails:', emailError);
    }

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
