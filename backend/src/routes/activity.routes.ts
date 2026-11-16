// Activity Routes - client-reported page views (any authenticated user)

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { detectPlatform, trackPageView } from '../services/activity-tracker.service.js';

export async function activityRoutes(server: FastifyInstance) {
  // Always answers 204 - tracking problems must never surface to the user
  server.post('/pageview', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = (request.body || {}) as { path?: unknown; platform?: unknown };
      const platform = detectPlatform(
        request.headers['user-agent'],
        typeof body.platform === 'string' ? body.platform : undefined
      );
      trackPageView(request.user!.id, request.user!.role, platform, body.path);
    } catch {
      // ignore
    }
    return reply.code(204).send();
  });
}
