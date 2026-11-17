// Push Routes — device registration (any logged-in user) + admin send/history

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.middleware.js';
import { pushService } from '../services/push.service.js';

const registerSchema = z.object({
  token: z.string().min(20).max(4096),
  platform: z.enum(['ios', 'android']),
});

const sendSchema = z.object({
  title: z.string().trim().min(1, 'חסרה כותרת להודעה').max(80, 'הכותרת ארוכה מדי (עד 80 תווים)'),
  body: z.string().trim().min(1, 'חסר תוכן להודעה').max(300, 'התוכן ארוך מדי (עד 300 תווים)'),
  audience: z.enum(['ALL', 'ARCHITECT', 'DESIGNER', 'SUPPLIER']),
  alsoInApp: z.boolean().optional(),
});

export async function pushRoutes(server: FastifyInstance) {
  // Register (or re-assign) this device to the logged-in user
  server.post('/register', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: 'פרטי המכשיר לא תקינים' });
    }
    const user = request.user!;
    await prisma.deviceToken.upsert({
      where: { token: parsed.data.token },
      create: { token: parsed.data.token, platform: parsed.data.platform, userId: user.id },
      update: { userId: user.id, platform: parsed.data.platform, lastSeenAt: new Date() },
    });
    return { success: true };
  });

  // Unregister this device (on logout)
  server.post('/unregister', { preHandler: [authMiddleware] }, async (request: FastifyRequest) => {
    const body = request.body as { token?: string } | undefined;
    if (body?.token) {
      await prisma.deviceToken.deleteMany({ where: { token: body.token, userId: request.user!.id } });
    }
    return { success: true };
  });

  // --- Admin ---

  // How many devices would receive a push for an audience
  server.get('/admin/stats', { preHandler: [authMiddleware, requireAdmin] }, async (request: FastifyRequest) => {
    const { audience } = request.query as { audience?: string };
    const a = (['ALL', 'ARCHITECT', 'DESIGNER', 'SUPPLIER'].includes(audience || '') ? audience : 'ALL') as
      'ALL' | 'ARCHITECT' | 'DESIGNER' | 'SUPPLIER';
    return pushService.countDevices(a);
  });

  // Send a push to an audience
  server.post('/admin/send', { preHandler: [authMiddleware, requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = sendSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: (parsed as any).error.errors[0]?.message || 'פרטי ההודעה לא תקינים' });
    }
    try {
      const result = await pushService.sendToAudience({ title: parsed.data.title!, body: parsed.data.body!, audience: parsed.data.audience!, alsoInApp: parsed.data.alsoInApp, createdById: request.user!.id });
      return result;
    } catch (error) {
      request.log.error(error, 'push send failed');
      return reply.status(500).send({ message: 'שליחת ההודעה נכשלה. נסו שוב בעוד רגע.' });
    }
  });

  // History of sent campaigns
  server.get('/admin/history', { preHandler: [authMiddleware, requireAdmin] }, async () => {
    const data = await prisma.pushCampaign.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    return { data };
  });
}
