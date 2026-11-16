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

// Plentrix (Base44 app) - STANNEL users are signed in via a one-time embed URL
const PLENTRIX_API_BASE = 'https://base44.app/api/apps/6983f1e8809b0f4913052792';
const isPlentrixHost = (h: string) =>
  h === 'plentrix.online' || h.endsWith('.plentrix.online') || h === 'base44.app' || h.endsWith('.base44.app');
// Provision once per user (per instance); the call itself is idempotent
const plentrixProvisioned = new Set<string>();

function timeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms).unref();
  return controller.signal;
}

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

function cleanDetails(raw: unknown): string {
  return String(raw ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);
}

function redeemDescription(orderId: string, details: string): string {
  const base = `מימוש באמסלם - הזמנה ${orderId}`;
  return details ? `${base} · ${details}` : base;
}

async function findArchitectByToken(token: string) {
  if (!token) return null;
  const record = await prisma.partnerToken.findUnique({ where: { token } });
  if (!record || record.partner !== PARTNER || record.expiresAt < new Date()) return null;
  return prisma.architectProfile.findUnique({
    where: { userId: record.userId },
    select: { id: true, pointsBalance: true, user: { select: { name: true, email: true, isActive: true, isDeleted: true } } },
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
    url.searchParams.set('ptoken', token);
    return { url: url.toString() };
  });

  // Logged-in user -> one-time Plentrix sign-in URL (no registration / password on their side).
  // The email always comes from the verified session, never from the request.
  server.post('/plentrix/link', { preHandler: [authMiddleware] }, async (request, reply) => {
    const apiKey = process.env.PLENTRIX_API_KEY;
    if (!apiKey) {
      return reply.code(503).send({ error: 'Plentrix integration not configured' });
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
    const email = request.user!.email;

    try {
      // Step 1: grant access (idempotent, once per user)
      if (!plentrixProvisioned.has(email)) {
        const provision = await fetch(`${PLENTRIX_API_BASE}/users/provisions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ email, role: 'user' }),
          signal: timeoutSignal(10000),
        });
        if (!provision.ok) {
          const detail = (await provision.text().catch(() => '')).slice(0, 300);
          console.error('[Plentrix] provisions failed:', provision.status, `domain=${email.split('@')[1]}`, detail);
          if (provision.status === 422) {
            return reply.code(422).send({ error: 'invalid_email', message: 'כתובת המייל של החשבון הזה אינה תקינה עבור Plentrix. אין תקלה במערכת – יש להתחבר עם מייל אמיתי.' });
          }
          return reply.code(502).send({ error: 'Plentrix is unavailable right now', message: 'Plentrix אינו זמין כרגע, נסו שוב בעוד מספר דקות.' });
        }
        plentrixProvisioned.add(email);
      }

      // Step 2: one-time embed URL
      const embed = await fetch(`${PLENTRIX_API_BASE}/embed-url`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, target: 'live_site' }),
        signal: timeoutSignal(10000),
      });
      if (!embed.ok) {
        console.error('[Plentrix] embed-url failed:', embed.status);
        return reply.code(502).send({ error: 'Plentrix is unavailable right now', message: 'Plentrix אינו זמין כרגע, נסו שוב בעוד מספר דקות.' });
      }

      const data = (await embed.json()) as { embed_url?: string };
      const target = new URL(String(data.embed_url || ''));
      // Only ever redirect users to Plentrix's own domain
      if (target.protocol !== 'https:' || !isPlentrixHost(target.hostname)) {
        console.error('[Plentrix] unexpected embed_url host:', target.hostname);
        return reply.code(502).send({ error: 'Plentrix returned an invalid link' });
      }
      return { url: target.toString() };
    } catch (error) {
      console.error('[Plentrix] link error:', error instanceof Error ? error.message : error);
      return reply.code(502).send({ error: 'Plentrix is unavailable right now', message: 'Plentrix אינו זמין כרגע, נסו שוב בעוד מספר דקות.' });
    }
  });

  // Partner: GET /user-balance?token=...
  server.get('/user-balance', { preHandler: [partnerAuth] }, async (request, reply) => {
    const { token } = request.query as { token?: string };
    const architect = await findArchitectByToken(token || '');
    if (!architect || !architect.user.isActive || architect.user.isDeleted) {
      return reply.code(404).send({ error: 'Invalid or expired token' });
    }
    return { name: architect.user.name, email: architect.user.email, balance: architect.pointsBalance };
  });

  // Partner: POST /deduct-points { token, points, orderId }
  server.post('/deduct-points', { preHandler: [partnerAuth] }, async (request, reply) => {
    const body = request.body as { token?: string; points?: number; orderId?: string; email?: string; details?: string };
    const points = Number(body?.points);
    const orderId = String(body?.orderId || '').trim();
    if (!orderId || !Number.isFinite(points) || points <= 0) {
      return reply.code(400).send({ success: false, error: 'token, positive points and orderId are required' });
    }

    const architect = await findArchitectByToken(body.token || '');
    if (!architect || !architect.user.isActive || architect.user.isDeleted) {
      return reply.code(404).send({ success: false, error: 'Invalid or expired token' });
    }
    // Optional safety check: if the partner sends the email of the logged-in customer it must match ours
    if (body.email && String(body.email).trim().toLowerCase() !== architect.user.email.toLowerCase()) {
      return reply.code(403).send({ success: false, error: 'Email does not match the token owner' });
    }
    const details = cleanDetails(body.details);

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
            description: redeemDescription(orderId, details),
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

  // Partner: POST /order-details { orderId, details } - what the customer ordered (sent after the order), shown in the app
  server.post('/order-details', { preHandler: [partnerAuth] }, async (request, reply) => {
    const body = request.body as { orderId?: string; details?: string };
    const orderId = String(body?.orderId || '').trim();
    const details = cleanDetails(body?.details);
    if (!orderId || !details) {
      return reply.code(400).send({ success: false, error: 'orderId and details are required' });
    }
    const redemption = await prisma.partnerRedemption.findUnique({
      where: { partner_orderId: { partner: PARTNER, orderId } },
    });
    if (!redemption) {
      return reply.code(404).send({ success: false, error: 'Order not found' });
    }
    const base = redeemDescription(orderId, '');
    const updated = await prisma.cardTransaction.updateMany({
      where: {
        architectId: redemption.architectId,
        type: 'DEBIT',
        OR: [{ description: base }, { description: { startsWith: `${base} · ` } }],
      },
      data: { description: redeemDescription(orderId, details) },
    });
    return { success: true, orderId, updated: updated.count };
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
