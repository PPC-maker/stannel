import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { guardianService } from '../services/guardian.service.js';

export async function guardianRoutes(server: FastifyInstance) {
  // Password verification preHandler for all routes
  const verifyPassword = async (request: FastifyRequest, reply: FastifyReply) => {
    const headerPassword = request.headers['x-guardian-password'] as string | undefined;
    const bodyPassword = (request.body as Record<string, unknown>)?.password as string | undefined;
    const password = headerPassword || bodyPassword;

    if (!password) {
      reply.code(401).send({ error: 'Password required' });
      return;
    }

    const valid = await guardianService.verifyPassword(password);
    if (!valid) {
      reply.code(401).send({ error: 'Invalid guardian password' });
      return;
    }
  };

  // Apply password check to all routes in this scope
  server.addHook('preHandler', verifyPassword);

  // POST /auth - Verify password, return settings
  server.post('/auth', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const settings = await guardianService.getSettings();
      return { ok: true, settings };
    } catch (error) {
      request.log.error(error, 'Guardian auth error');
      reply.code(500).send({ error: 'Failed to get guardian info' });
    }
  });

  // GET /status - Get current guardian status
  server.get('/status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const settings = await guardianService.getSettings();
      const logs = await guardianService.getLogs(10);
      const pendingCount = logs.filter((l: any) => l.status === 'PENDING_APPROVAL').length;
      const autoFixedCount = logs.filter((l: any) => l.autoFixed).length;
      return {
        ...settings,
        recentLogs: logs.length,
        pendingApproval: pendingCount,
        autoFixed: autoFixedCount,
      };
    } catch (error) {
      request.log.error(error, 'Guardian status error');
      reply.code(500).send({ error: 'Failed to get guardian status' });
    }
  });

  // GET /logs - Get recent guardian logs
  server.get('/logs', async (
    request: FastifyRequest<{
      Querystring: { limit?: string; severity?: string; status?: string };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { limit } = request.query;
      const logs = await guardianService.getLogs(limit ? parseInt(limit, 10) : 50);
      return logs;
    } catch (error) {
      request.log.error(error, 'Guardian get logs error');
      reply.code(500).send({ error: 'Failed to get guardian logs' });
    }
  });

  // GET /logs/:id - Get specific log with chat messages
  server.get('/logs/:id', async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params;
      const log = await guardianService.getLog(id);
      if (!log) {
        reply.code(404).send({ error: 'Guardian log not found' });
        return;
      }
      return log;
    } catch (error) {
      request.log.error(error, 'Guardian get log error');
      reply.code(500).send({ error: 'Failed to get guardian log' });
    }
  });

  // POST /chat - Send chat message
  server.post('/chat', async (
    request: FastifyRequest<{
      Body: { logId?: string; message: string; password?: string };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { logId, message } = request.body;
      if (!message) {
        reply.code(400).send({ error: 'Message is required' });
        return;
      }
      const chatMessage = await guardianService.sendChatMessage(logId || null, message, 'admin');

      // Bot auto-reply
      await guardianService.sendChatMessage(
        logId || null,
        'קיבלתי את ההודעה שלך. אני בודק ומעדכן.',
        'bot'
      );

      return chatMessage;
    } catch (error) {
      request.log.error(error, 'Guardian chat send error');
      reply.code(500).send({ error: 'Failed to send chat message' });
    }
  });

  // GET /chat - Get chat messages
  server.get('/chat', async (
    request: FastifyRequest<{
      Querystring: { logId?: string };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { logId } = request.query;
      const messages = await guardianService.getChatMessages(logId || null);
      return messages;
    } catch (error) {
      request.log.error(error, 'Guardian chat get error');
      reply.code(500).send({ error: 'Failed to get chat messages' });
    }
  });

  // POST /approve/:id - Approve a fix for a specific log
  server.post('/approve/:id', async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params;
      const log = await guardianService.getLog(id);
      if (!log) {
        reply.code(404).send({ error: 'Guardian log not found' });
        return;
      }
      await guardianService.approveFix(id);
      return { ok: true, message: 'Fix approved' };
    } catch (error) {
      request.log.error(error, 'Guardian approve error');
      reply.code(500).send({ error: 'Failed to approve guardian log' });
    }
  });

  // POST /dismiss/:id - Dismiss a log
  server.post('/dismiss/:id', async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params;
      const log = await guardianService.getLog(id);
      if (!log) {
        reply.code(404).send({ error: 'Guardian log not found' });
        return;
      }
      await guardianService.dismissLog(id);
      return { ok: true, message: 'Log dismissed' };
    } catch (error) {
      request.log.error(error, 'Guardian dismiss error');
      reply.code(500).send({ error: 'Failed to dismiss guardian log' });
    }
  });

  // POST /scan - Trigger manual scan
  server.post('/scan', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const results = await guardianService.runFullScan();
      return results;
    } catch (error) {
      request.log.error(error, 'Guardian scan error');
      reply.code(500).send({ error: 'Failed to run guardian scan' });
    }
  });

  // POST /maintenance - Toggle maintenance mode
  server.post('/maintenance', async (
    request: FastifyRequest<{
      Body: { enabled: boolean; password?: string };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { enabled } = request.body;
      if (typeof enabled !== 'boolean') {
        reply.code(400).send({ error: 'enabled (boolean) is required' });
        return;
      }
      await guardianService.setMaintenanceMode(enabled);
      return { ok: true, maintenanceMode: enabled };
    } catch (error) {
      request.log.error(error, 'Guardian maintenance toggle error');
      reply.code(500).send({ error: 'Failed to toggle maintenance mode' });
    }
  });

  // PATCH /settings - Update guardian settings
  server.patch('/settings', async (
    request: FastifyRequest<{
      Body: { key: string; value: string; password?: string };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { key, value } = request.body;
      if (!key) {
        reply.code(400).send({ error: 'key is required' });
        return;
      }
      await guardianService.updateSetting(key, String(value));
      const settings = await guardianService.getSettings();
      return { ok: true, settings };
    } catch (error) {
      request.log.error(error, 'Guardian settings update error');
      reply.code(500).send({ error: 'Failed to update guardian settings' });
    }
  });

  // GET /settings - Get all guardian settings
  server.get('/settings', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const settings = await guardianService.getSettings();
      return settings;
    } catch (error) {
      request.log.error(error, 'Guardian settings get error');
      reply.code(500).send({ error: 'Failed to get guardian settings' });
    }
  });
}
