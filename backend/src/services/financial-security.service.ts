// Financial Security Service - STANNEL Platform
// Enhanced security for points, transactions, and financial operations

import prisma from '../lib/prisma.js';
import { systemLogger } from './system-logger.service.js';
import { emailService, EMAIL_DESTINATIONS } from './email.service.js';

interface TransactionContext {
  userId: string;
  userEmail?: string;
  ip?: string;
  userAgent?: string;
  endpoint: string;
}

interface FinancialAlert {
  type: 'SUSPICIOUS_TRANSACTION' | 'BALANCE_MISMATCH' | 'DUPLICATE_TRANSACTION' | 'LIMIT_EXCEEDED' | 'UNUSUAL_ACTIVITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId: string;
  details: string;
  amount?: number;
  context?: TransactionContext;
}

// Transaction limits
const DAILY_REDEMPTION_LIMIT = 50000; // Max points redeemed per day
const SINGLE_TRANSACTION_LIMIT = 10000; // Max points per single redemption
const MAX_TRANSACTIONS_PER_HOUR = 10; // Max transactions per user per hour

// In-memory caches for quick checks
const recentTransactions = new Map<string, { timestamps: Date[]; amounts: number[] }>();
const balanceSnapshots = new Map<string, { balance: number; timestamp: Date }>();

export const financialSecurityService = {
  // Validate transaction before processing
  async validateTransaction(
    userId: string,
    amount: number,
    type: 'REDEMPTION' | 'BONUS' | 'TRANSFER',
    context: TransactionContext
  ): Promise<{ valid: boolean; reason?: string }> {
    // 1. Validate amount is positive and reasonable
    if (amount <= 0) {
      await this.reportAlert({
        type: 'SUSPICIOUS_TRANSACTION',
        severity: 'HIGH',
        userId,
        details: `Invalid amount: ${amount}`,
        amount,
        context,
      });
      return { valid: false, reason: 'Invalid amount' };
    }

    if (amount > SINGLE_TRANSACTION_LIMIT && type === 'REDEMPTION') {
      await this.reportAlert({
        type: 'LIMIT_EXCEEDED',
        severity: 'MEDIUM',
        userId,
        details: `Single transaction limit exceeded: ${amount} > ${SINGLE_TRANSACTION_LIMIT}`,
        amount,
        context,
      });
      return { valid: false, reason: 'Transaction limit exceeded' };
    }

    // 2. Check rate limiting
    const userTransactions = recentTransactions.get(userId);
    if (userTransactions) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentCount = userTransactions.timestamps.filter(t => t > oneHourAgo).length;

      if (recentCount >= MAX_TRANSACTIONS_PER_HOUR) {
        await this.reportAlert({
          type: 'UNUSUAL_ACTIVITY',
          severity: 'MEDIUM',
          userId,
          details: `Too many transactions: ${recentCount} in last hour`,
          context,
        });
        return { valid: false, reason: 'Too many transactions. Please wait.' };
      }
    }

    // 3. Check daily limit for redemptions
    if (type === 'REDEMPTION') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dailyTotal = await prisma.redemption.aggregate({
        where: {
          architectId: userId,
          createdAt: { gte: today },
        },
        _sum: { pointsUsed: true },
      });

      const currentDailyTotal = dailyTotal._sum.pointsUsed || 0;
      if (currentDailyTotal + amount > DAILY_REDEMPTION_LIMIT) {
        await this.reportAlert({
          type: 'LIMIT_EXCEEDED',
          severity: 'MEDIUM',
          userId,
          details: `Daily limit would be exceeded: ${currentDailyTotal} + ${amount} > ${DAILY_REDEMPTION_LIMIT}`,
          amount,
          context,
        });
        return { valid: false, reason: 'Daily limit exceeded' };
      }
    }

    // 4. Verify user has sufficient balance
    const profile = await prisma.architectProfile.findUnique({
      where: { userId },
      select: { points: true },
    });

    if (!profile) {
      return { valid: false, reason: 'Profile not found' };
    }

    if (type === 'REDEMPTION' && profile.points < amount) {
      await this.reportAlert({
        type: 'SUSPICIOUS_TRANSACTION',
        severity: 'HIGH',
        userId,
        details: `Insufficient balance: ${profile.points} < ${amount}`,
        amount,
        context,
      });
      return { valid: false, reason: 'Insufficient balance' };
    }

    return { valid: true };
  },

  // Record transaction for tracking
  recordTransaction(userId: string, amount: number): void {
    const record = recentTransactions.get(userId) || { timestamps: [], amounts: [] };
    record.timestamps.push(new Date());
    record.amounts.push(amount);

    // Keep only last 100 transactions per user
    if (record.timestamps.length > 100) {
      record.timestamps = record.timestamps.slice(-100);
      record.amounts = record.amounts.slice(-100);
    }

    recentTransactions.set(userId, record);
  },

  // Verify balance integrity after transaction
  async verifyBalanceIntegrity(
    userId: string,
    expectedChange: number,
    transactionType: string,
    context: TransactionContext
  ): Promise<boolean> {
    const profile = await prisma.architectProfile.findUnique({
      where: { userId },
      select: { points: true },
    });

    if (!profile) return false;

    const snapshot = balanceSnapshots.get(userId);
    if (snapshot && snapshot.timestamp > new Date(Date.now() - 5000)) {
      const expectedBalance = snapshot.balance + expectedChange;
      const actualBalance = profile.points;

      if (Math.abs(expectedBalance - actualBalance) > 0.01) {
        await this.reportAlert({
          type: 'BALANCE_MISMATCH',
          severity: 'CRITICAL',
          userId,
          details: `Balance mismatch after ${transactionType}: expected ${expectedBalance}, got ${actualBalance}`,
          context,
        });
        return false;
      }
    }

    // Update snapshot
    balanceSnapshots.set(userId, {
      balance: profile.points,
      timestamp: new Date(),
    });

    return true;
  },

  // Check for duplicate transactions
  async checkDuplicate(
    userId: string,
    amount: number,
    type: string,
    targetId?: string
  ): Promise<boolean> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    if (type === 'REDEMPTION' && targetId) {
      const duplicate = await prisma.redemption.findFirst({
        where: {
          architectId: userId,
          productId: targetId,
          pointsUsed: amount,
          createdAt: { gte: fiveMinutesAgo },
        },
      });

      if (duplicate) {
        await systemLogger.warning('FINANCIAL', 'Duplicate Transaction Attempt',
          `User ${userId} attempted duplicate redemption of product ${targetId}`);
        return true;
      }
    }

    return false;
  },

  // Audit log for financial operations
  async auditLog(
    operation: string,
    userId: string,
    amount: number,
    details: Record<string, unknown>,
    context: TransactionContext
  ): Promise<void> {
    await systemLogger.info('FINANCIAL', operation,
      `User ${userId}: ${operation} - ${amount} points`, {
        userId,
        userEmail: context.userEmail,
        ipAddress: context.ip,
        userAgent: context.userAgent,
        details: JSON.stringify(details),
      });
  },

  // Report financial security alert
  async reportAlert(alert: FinancialAlert): Promise<void> {
    const logMethod = alert.severity === 'CRITICAL' ? 'critical' :
                      alert.severity === 'HIGH' ? 'error' : 'warning';

    await systemLogger[logMethod](
      'FINANCIAL',
      alert.type,
      alert.details,
      undefined,
      {
        userId: alert.userId,
        userEmail: alert.context?.userEmail,
        ipAddress: alert.context?.ip,
      }
    );

    // Send immediate email for HIGH+ severity
    if (alert.severity === 'HIGH' || alert.severity === 'CRITICAL') {
      await this.sendFinancialAlert(alert);
    }
  },

  // Send financial alert email
  async sendFinancialAlert(alert: FinancialAlert): Promise<void> {
    const severityColors: Record<string, string> = {
      LOW: '#10b981',
      MEDIUM: '#f59e0b',
      HIGH: '#ef4444',
      CRITICAL: '#7c2d12',
    };

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <title>STANNEL - התראת אבטחה פיננסית</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 550px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #1a3a6b 0%, #0f2347 100%); padding: 20px; text-align: center;">
      <h1 style="color: #d4af37; margin: 0; font-size: 20px;">STANNEL</h1>
      <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">התראת אבטחה פיננסית</p>
    </div>

    <div style="background-color: ${severityColors[alert.severity]}; padding: 15px; text-align: center;">
      <h2 style="color: white; margin: 0; font-size: 18px;">${alert.type}</h2>
      <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">${alert.severity}</p>
    </div>

    <div style="padding: 25px;">
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
        <p style="margin: 0; color: #374151;"><strong>משתמש:</strong> ${alert.userId}</p>
        ${alert.amount ? `<p style="margin: 8px 0 0 0; color: #374151;"><strong>סכום:</strong> ${alert.amount.toLocaleString()} נקודות</p>` : ''}
        ${alert.context?.ip ? `<p style="margin: 8px 0 0 0; color: #374151;"><strong>IP:</strong> ${alert.context.ip}</p>` : ''}
        ${alert.context?.endpoint ? `<p style="margin: 8px 0 0 0; color: #374151;"><strong>Endpoint:</strong> ${alert.context.endpoint}</p>` : ''}
      </div>

      <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px;">
        <p style="margin: 0; color: #92400e;"><strong>פרטים:</strong></p>
        <p style="margin: 5px 0 0 0; color: #78350f;">${alert.details}</p>
      </div>
    </div>

    <div style="background-color: #f1f5f9; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 11px; margin: 0;">${new Date().toLocaleString('he-IL')}</p>
    </div>
  </div>
</body>
</html>
    `;

    try {
      await emailService.send({
        to: EMAIL_DESTINATIONS.systemReports,
        subject: `⚠️ התראת אבטחה פיננסית - ${alert.type} (${alert.severity})`,
        html,
      });
    } catch (error) {
      console.error('[FinancialSecurity] Failed to send alert email:', error);
    }
  },

  // Daily financial integrity check
  async runIntegrityCheck(): Promise<{ passed: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // 1. Check for negative balances
      const negativeBalances = await prisma.architectProfile.findMany({
        where: { points: { lt: 0 } },
        select: { userId: true, points: true },
      });

      if (negativeBalances.length > 0) {
        issues.push(`${negativeBalances.length} users with negative point balance`);
        for (const user of negativeBalances) {
          await this.reportAlert({
            type: 'BALANCE_MISMATCH',
            severity: 'CRITICAL',
            userId: user.userId,
            details: `Negative balance detected: ${user.points}`,
          });
        }
      }

      // 2. Check redemptions vs point deductions
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const redemptionsToday = await prisma.redemption.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { pointsUsed: true },
        _count: true,
      });

      // 3. Check for unusually high single transactions
      const highTransactions = await prisma.redemption.findMany({
        where: {
          createdAt: { gte: today },
          pointsUsed: { gt: SINGLE_TRANSACTION_LIMIT },
        },
        select: { id: true, architectId: true, pointsUsed: true },
      });

      if (highTransactions.length > 0) {
        issues.push(`${highTransactions.length} high-value transactions today`);
      }

      // Log summary
      await systemLogger.info('FINANCIAL', 'Integrity Check',
        `Daily check: ${redemptionsToday._count} redemptions, ${issues.length} issues found`);

    } catch (error) {
      issues.push(`Integrity check error: ${(error as Error).message}`);
    }

    return {
      passed: issues.length === 0,
      issues,
    };
  },

  // Cleanup old tracking data
  cleanup(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    for (const [userId, record] of recentTransactions) {
      record.timestamps = record.timestamps.filter(t => t > oneHourAgo);
      record.amounts = record.amounts.slice(-record.timestamps.length);

      if (record.timestamps.length === 0) {
        recentTransactions.delete(userId);
      }
    }

    for (const [userId, snapshot] of balanceSnapshots) {
      if (snapshot.timestamp < oneHourAgo) {
        balanceSnapshots.delete(userId);
      }
    }
  },
};

// Run cleanup every 15 minutes
setInterval(() => financialSecurityService.cleanup(), 15 * 60 * 1000);
