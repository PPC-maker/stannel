// Health Report Service - STANNEL Platform
// Scans the system and generates health reports

import prisma from '../lib/prisma.js';
import { emailService } from './email.service.js';

export interface HealthReport {
  id: string;
  summary: string;
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalInvoices: number;
    pendingInvoices: number;
    overdueInvoices: number;
    totalPoints: number;
    totalRedemptions: number;
    activeEvents: number;
    productsInStock: number;
  };
  issues: string[];
  recommendations: string[];
  generatedAt: Date;
  sentTo: string[];
  status: 'success' | 'partial' | 'failed';
}

export const healthReportService = {
  async generateReport(): Promise<HealthReport> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Gather stats
    const [
      totalUsers,
      activeUsers,
      totalInvoices,
      pendingInvoices,
      overdueInvoices,
      totalPointsResult,
      totalRedemptions,
      activeEvents,
      productsInStock,
      recentErrors,
      recentLogins,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Active users (logged in within 30 days)
      prisma.user.count({
        where: {
          isActive: true,
          updatedAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),

      // Total invoices
      prisma.invoice.count(),

      // Pending invoices
      prisma.invoice.count({
        where: {
          status: { in: ['PENDING_ADMIN', 'CLARIFICATION_NEEDED'] },
        },
      }),

      // Overdue invoices (PENDING_SUPPLIER_PAY for more than 14 days)
      prisma.invoice.count({
        where: {
          status: 'PENDING_SUPPLIER_PAY',
          approvedAt: { lt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
        },
      }),

      // Total points in circulation
      prisma.architectProfile.aggregate({
        _sum: { pointsBalance: true },
      }),

      // Total redemptions this week
      prisma.redemption.count({
        where: { createdAt: { gte: weekAgo } },
      }),

      // Active events
      prisma.event.count({
        where: {
          isActive: true,
          startDate: { gte: now },
        },
      }),

      // Products in stock
      prisma.product.count({
        where: {
          isActive: true,
          stock: { gt: 0 },
        },
      }),

      // Recent system errors (simulated - would need error tracking)
      Promise.resolve(0),

      // Recent logins
      prisma.user.count({
        where: {
          updatedAt: { gte: weekAgo },
        },
      }),
    ]);

    const stats = {
      totalUsers,
      activeUsers,
      totalInvoices,
      pendingInvoices,
      overdueInvoices,
      totalPoints: totalPointsResult._sum.pointsBalance || 0,
      totalRedemptions,
      activeEvents,
      productsInStock,
    };

    // Analyze and find issues
    if (pendingInvoices > 50) {
      issues.push(`${pendingInvoices} invoices pending review - backlog building up`);
      recommendations.push('Consider adding more admin reviewers or implementing auto-approval rules');
    }

    if (overdueInvoices > 0) {
      issues.push(`${overdueInvoices} invoices overdue for supplier payment`);
      recommendations.push('Send reminders to suppliers with overdue payments');
    }

    if (activeEvents === 0) {
      issues.push('No upcoming events scheduled');
      recommendations.push('Plan new events to keep users engaged');
    }

    if (productsInStock < 5) {
      issues.push(`Only ${productsInStock} products available in rewards store`);
      recommendations.push('Add more products to the rewards catalog');
    }

    const inactiveRatio = totalUsers > 0 ? (totalUsers - activeUsers) / totalUsers : 0;
    if (inactiveRatio > 0.5) {
      issues.push(`${Math.round(inactiveRatio * 100)}% of users are inactive`);
      recommendations.push('Launch re-engagement campaign for inactive users');
    }

    // Low product stock warning
    const lowStockProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: { gt: 0, lte: 5 },
      },
      select: { name: true, stock: true },
    });

    if (lowStockProducts.length > 0) {
      issues.push(`${lowStockProducts.length} products have low stock`);
      recommendations.push(`Restock: ${lowStockProducts.map((p: { name: string; stock: number }) => `${p.name} (${p.stock} left)`).join(', ')}`);
    }

    // Generate summary
    let summary = '';
    if (issues.length === 0) {
      summary = 'System is healthy. All metrics are within normal ranges.';
    } else if (issues.length <= 2) {
      summary = `System is mostly healthy with ${issues.length} minor issue(s) to address.`;
    } else {
      summary = `System requires attention. ${issues.length} issues detected that should be reviewed.`;
    }

    const report: HealthReport = {
      id: `hr_${Date.now()}`,
      summary,
      stats,
      issues,
      recommendations,
      generatedAt: now,
      sentTo: [],
      status: 'success',
    };

    return report;
  },

  async sendWeeklyReport(): Promise<HealthReport> {
    console.log('[HealthReport] Generating weekly report...');

    const report = await this.generateReport();

    // Get admin emails
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        isActive: true,
      },
      select: { email: true },
    });

    const adminEmails = admins.map((a: { email: string }) => a.email);

    if (adminEmails.length === 0) {
      console.warn('[HealthReport] No admin emails found. Report not sent.');
      report.status = 'failed';
      return report;
    }

    // Send email
    const sent = await emailService.sendHealthReport(adminEmails, {
      summary: report.summary,
      stats: {
        'Total Users': report.stats.totalUsers,
        'Active Users': report.stats.activeUsers,
        'Pending Invoices': report.stats.pendingInvoices,
        'Overdue Invoices': report.stats.overdueInvoices,
        'Total Points': report.stats.totalPoints.toLocaleString(),
        'Redemptions (Week)': report.stats.totalRedemptions,
        'Active Events': report.stats.activeEvents,
        'Products In Stock': report.stats.productsInStock,
      },
      issues: report.issues,
      recommendations: report.recommendations,
      generatedAt: report.generatedAt,
    });

    report.sentTo = sent ? adminEmails : [];
    report.status = sent ? 'success' : 'partial';

    // Save report to database (optional - would need a HealthReport model)
    console.log('[HealthReport] Report generated:', report.id);

    return report;
  },

  async getRecentReports(limit = 10): Promise<HealthReport[]> {
    // In production, you'd fetch from database
    // For now, generate current report
    const current = await this.generateReport();
    return [current];
  },
};
