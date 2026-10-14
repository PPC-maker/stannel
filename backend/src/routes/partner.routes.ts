// Partner Routes - external merchants (e.g. Amsalem) redeem STANNEL points.
//  - /link      (user auth)    : create a short-lived token and return the partner redirect URL
//  - /user-balance (partner key): balance lookup by token
//  - /deduct-points (partner key): idempotent points deduction per orderId

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomBytes, timingSafeEqual } from 'crypto';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const PARTNER = 'amsalem';
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function partnerUrl(): string {
  return process.env.AMSALEM_REDIRECT_URL || 'https://www.amsalem.co.il/';
}

// Fail closed: if no key is configured, partner endpoints are disabled.
async function partnerAuth(request: FastifyRequest, reply: FastifyReply) {
  const expected = process.env.AMSALEM_API_KEY;
  if (!expected) {
    return reply.code(503).send({ error: 'Partner API not configured' });
  }
  const provided = String(request.headers['x-api-key'] || '');
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
}

async function findArchitectByToken(token: string) {
  if (!token) return null;
  const record = await prisma.partnerToken.findUnique({ where: { token } });
  if (!record || record.partner !== PARTNER || record.expiresAt < new Date()) return null;
  return prisma.architectProfile.findUnique({
    where: { userId: record.userId },
    select: { id: true, pointsBalance: true, user: { select: { name: true, isActive: true, isDeleted: true } } },
  });
}

export async function partnerRoutes(server: FastifyInstance) {
  // Logged-in architect -> redirect URL with a fresh token
  server.post('/link', { preHandler: [authMiddleware] }, async (request, reply) => {
    const user = request.user!;
    if (!user.architectProfile) {
      return reply.code(403).send({ error: 'No points wallet for this user type' });
    }
    const token = randomBytes(24).toString('hex');
    await prisma.partnerToken.create({
      data: { token, partner: PARTNER, userId: user.id, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
    });
    // Opportunistic cleanup of expired tokens
    prisma.partnerToken.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});
    const url = new URL(partnerUrl());
    url.searchParams.set('token', token);
    return { url: url.toString() };
  });

  // Partner: GET /user-balance?token=...
  server.get('/user-balance', { preHandler: [partnerAuth] }, async (request, reply) => {
    const { token } = request.query as { token?: string };
    const architect = await findArchitectByToken(token || '');
    if (!architect || !architect.user.isActive || architect.user.isDeleted) {
      return reply.code(404).send({ error: 'Invalid or expired token' });
    }
    return { name: architect.user.name, balance: architect.pointsBalance };
  });

  // Partner: POST /deduct-points { token, points, orderId }
  server.post('/deduct-points', { preHandler: [partnerAuth] }, async (request, reply) => {
    const body = request.body as { token?: string; points?: number; orderId?: string };
    const points = Number(body?.points);
    const orderId = String(body?.orderId || '').trim();
    if (!orderId || !Number.isFinite(points) || points <= 0) {
      return reply.code(400).send({ success: false, error: 'token, positive points and orderId are required' });
    }

    const architect = await findArchitectByToken(body.token || '');
    if (!architect || !architect.user.isActive || architect.user.isDeleted) {
      return reply.code(404).send({ success: false, error: 'Invalid or expired token' });
    }

    // Idempotent replay: same orderId already processed
    const existing = await prisma.partnerRedemption.findUnique({
      where: { partner_orderId: { partner: PARTNER, orderId } },
    });
    if (existing) {
      const fresh = await prisma.architectProfile.findUnique({ where: { id: architect.id }, select: { pointsBalance: true } });
      return { success: true, duplicate: true, orderId, balance: fresh?.pointsBalance ?? 0 };
    }

    try {
      const balance = await prisma.$transaction(async (tx) => {
        await tx.partnerRedemption.create({
          data: { partner: PARTNER, orderId, architectId: architect.id, points },
        });
        // Conditional update guards against overdraft / concurrent deductions
        const updated = await tx.architectProfile.updateMany({
          where: { id: architect.id, pointsBalance: { gte: points } },
          data: { pointsBalance: { decrement: points }, totalRedeemed: { increment: points } },
        });
        if (updated.count === 0) throw new Error('INSUFFICIENT_POINTS');
        await tx.cardTransaction.create({
          data: {
            architectId: architect.id,
            type: 'DEBIT',
            amount: points,
            description: `מימוש באמסלם - הזמנה ${orderId}`,
          },
        });
        const p = await tx.architectProfile.findUnique({ where: { id: architect.id }, select: { pointsBalance: true } });
        return p?.pointsBalance ?? 0;
      });
      return { success: true, orderId, balance };
    } catch (err: any) {
      if (err?.message === 'INSUFFICIENT_POINTS') {
        return reply.code(409).send({ success: false, error: 'Insufficient points' });
      }
      if (err?.code === 'P2002') {
        return { success: true, duplicate: true, orderId };
      }
      request.log.error(err);
      return reply.code(500).send({ success: false, error: 'Internal error' });
    }
  });

  // Partner: POST /refund-points { orderId } - full refund of a previously deducted order (idempotent)
  server.post('/refund-points', { preHandler: [partnerAuth] }, async (request, reply) => {
    const body = request.body as { orderId?: string };
    const orderId = String(body?.orderId || '').trim();
    if (!orderId) {
      return reply.code(400).send({ success: false, error: 'orderId is required' });
    }

    const redemption = await prisma.partnerRedemption.findUnique({
      where: { partner_orderId: { partner: PARTNER, orderId } },
    });
    if (!redemption) {
      return reply.code(404).send({ success: false, error: 'Order not found' });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Only the first refund of an order flips refundedAt; concurrent/repeated calls get count 0
        const flipped = await tx.partnerRedemption.updateMany({
          where: { id: redemption.id, refundedAt: null },
          data: { refundedAt: new Date() },
        });
        if (flipped.count === 0) return { duplicate: true };
        await tx.architectProfile.update({
          where: { id: redemption.architectId },
          data: { pointsBalance: { increment: redemption.points }, totalRedeemed: { decrement: redemption.points } },
        });
        await tx.cardTransaction.create({
          data: {
            architectId: redemption.architectId,
            type: 'CREDIT',
            amount: redemption.points,
            description: `ביטול מימוש באמסלם - הזמנה ${orderId}`,
          },
        });
        return { duplicate: false };
      });
      const p = await prisma.architectProfile.findUnique({ where: { id: redemption.architectId }, select: { pointsBalance: true } });
      return { success: true, orderId, refunded: redemption.points, balance: p?.pointsBalance ?? 0, ...(result.duplicate && { duplicate: true }) };
    } catch (err: any) {
      request.log.error(err);
      return reply.code(500).send({ success: false, error: 'Internal error' });
    }
  });
}
