// Analytics Routes

import { FastifyInstance, FastifyRequest } from 'fastify';
import prisma from '../lib/prisma.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.middleware.js';
import { aiService } from '../services/ai.service.js';

export async function analyticsRoutes(server: FastifyInstance) {
  // Admin only
  server.addHook('preHandler', authMiddleware);
  server.addHook('preHandler', requireAdmin);

  // AI-powered trends
  server.get('/trends', async (request: FastifyRequest) => {
    const query = request.query as { period?: string };
    const period = query.period || 'month';

    const startDate = new Date();
    if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
    else if (period === 'quarter') startDate.setMonth(startDate.getMonth() - 3);

    const [invoices, topSuppliers, topArchitects] = await Promise.all([
      prisma.invoice.findMany({
        where: { createdAt: { gte: startDate } },
        select: { amount: true, status: true, createdAt: true },
      }),
      prisma.supplierProfile.findMany({
        include: {
          _count: { select: { invoices: true } },
          user: { select: { name: true } },
        },
        orderBy: { invoices: { _count: 'desc' } },
        take: 5,
      }),
      prisma.architectProfile.findMany({
        include: {
          _count: { select: { invoices: true } },
          user: { select: { name: true } },
        },
        orderBy: { totalEarned: 'desc' },
        take: 5,
      }),
    ]);

    // Get AI insights
    let aiInsights = null;
    try {
      aiInsights = await aiService.generateTrends({
        invoices,
        topSuppliers: topSuppliers.map(s => ({
          name: s.companyName,
          invoiceCount: s._count.invoices,
          trustScore: s.trustScore,
        })),
        topArchitects: topArchitects.map(a => ({
          name: a.user.name,
          invoiceCount: a._count.invoices,
          totalEarned: a.totalEarned,
        })),
        period,
      });
    } catch (error) {
      console.error('AI insights failed:', error);
    }

    return {
      period,
      summary: {
        totalInvoices: invoices.length,
        totalAmount: invoices.reduce((sum, i) => sum + i.amount, 0),
        approvedCount: invoices.filter(i => i.status === 'APPROVED' || i.status === 'PAID').length,
      },
      topSuppliers,
      topArchitects,
      aiInsights,
    };
  });

  // SLA compliance report
  server.get('/sla-report', async (request: FastifyRequest) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const invoices = await prisma.invoice.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { in: ['PAID', 'OVERDUE'] },
      },
      select: {
        id: true,
        status: true,
        slaDeadline: true,
        paidAt: true,
        supplier: { select: { companyName: true } },
      },
    });

    const compliant = invoices.filter(i =>
      i.status === 'PAID' && i.paidAt && i.paidAt <= i.slaDeadline
    );
    const breached = invoices.filter(i =>
      i.status === 'OVERDUE' || (i.paidAt && i.paidAt > i.slaDeadline)
    );

    // Group by supplier
    const bySupplier = invoices.reduce((acc, inv) => {
      const name = inv.supplier.companyName;
      if (!acc[name]) acc[name] = { compliant: 0, breached: 0 };
      if (inv.status === 'OVERDUE' || (inv.paidAt && inv.paidAt > inv.slaDeadline)) {
        acc[name].breached++;
      } else {
        acc[name].compliant++;
      }
      return acc;
    }, {} as Record<string, { compliant: number; breached: number }>);

    return {
      period: '30 days',
      total: invoices.length,
      compliant: compliant.length,
      breached: breached.length,
      complianceRate: invoices.length > 0
        ? Math.round((compliant.length / invoices.length) * 100)
        : 100,
      bySupplier,
    };
  });

  // Top architects ranking
  server.get('/top-architects', async (request: FastifyRequest) => {
    const architects = await prisma.architectProfile.findMany({
      include: {
        user: { select: { name: true, email: true, rank: true } },
        _count: { select: { invoices: true } },
      },
      orderBy: { totalEarned: 'desc' },
      take: 20,
    });

    return architects.map((a, index) => ({
      rank: index + 1,
      name: a.user.name,
      email: a.user.email,
      tier: a.user.rank,
      totalEarned: a.totalEarned,
      invoiceCount: a._count.invoices,
      pointsBalance: a.pointsBalance,
    }));
  });

  // Supplier performance
  server.get('/supplier-performance', async (request: FastifyRequest) => {
    const suppliers = await prisma.supplierProfile.findMany({
      include: {
        user: { select: { name: true } },
        _count: { select: { invoices: true } },
        contracts: { where: { isActive: true }, take: 1 },
      },
      orderBy: { trustScore: 'desc' },
    });

    return suppliers.map(s => ({
      id: s.id,
      companyName: s.companyName,
      trustScore: s.trustScore,
      qualityScore: s.qualityScore,
      invoiceCount: s._count.invoices,
      hasActiveContract: s.contracts.length > 0,
      contractType: s.contracts[0]?.type,
    }));
  });
}
