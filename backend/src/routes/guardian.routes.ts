import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { guardianService } from '../services/guardian.service.js';
import { prisma } from '../lib/prisma.js';

// Smart bot reply - understands questions and context
async function generateBotReply(message: string, logId: string | null): Promise<string> {
  const msg = message.toLowerCase();

  // If we're in a ticket context, answer about that specific issue
  if (logId) {
    const log = await guardianService.getLog(logId);
    if (log) {
      // User asking about this specific issue
      if (msg.includes('למה') || msg.includes('מה') || msg.includes('why') || msg.includes('what')) {
        return `📋 פרטי הבעיה:\n\n` +
          `🔸 כותרת: ${log.title}\n` +
          `🔸 תיאור: ${log.description}\n` +
          `🔸 חומרה: ${log.severity}\n` +
          `🔸 סטטוס: ${log.status}\n` +
          `🔸 זמן: ${new Date(log.createdAt).toLocaleString('he-IL')}\n\n` +
          (log.severity === 'HIGH' || log.severity === 'CRITICAL'
            ? '⚠️ בעיה זו דורשת תשומת לב. ניתן לאשר תיקון או לדחות.'
            : '✅ בעיה זו ברמת חומרה נמוכה.');
      }
      if (msg.includes('תקן') || msg.includes('אשר') || msg.includes('fix') || msg.includes('approve')) {
        return 'כדי לאשר תיקון, לחץ על כפתור ✅ למעלה, או שלח "אשר תיקון".';
      }
      if (msg.includes('דחה') || msg.includes('בטל') || msg.includes('dismiss')) {
        return 'כדי לדחות, לחץ על כפתור ✗ למעלה, או שלח "דחה".';
      }
      // Default for ticket context - explain the issue
      return `📋 בעיה: ${log.title}\n` +
        `📝 ${log.description}\n\n` +
        `חומרה: ${log.severity} | סטטוס: ${log.status}\n\n` +
        `מה תרצה לעשות?\n• "למה זה קורה" - הסבר מפורט\n• "אשר תיקון" - אישור\n• "דחה" - דחיית הבעיה`;
    }
  }

  // API health check questions
  if (msg.includes('api health') || msg.includes('health check') || msg.includes('api fail')) {
    const port = process.env.PORT || '8080';
    let apiStatus = 'לא ידוע';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`http://localhost:${port}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      apiStatus = res.ok ? 'תקין ✅' : `שגיאה (${res.status}) ❌`;
    } catch {
      apiStatus = 'לא ניתן לבדוק מבפנים (נורמלי ב-Cloud Run)';
    }

    const recentErrors = await prisma.systemLog.count({
      where: { severity: { in: ['ERROR', 'CRITICAL'] }, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }).catch(() => -1);

    return `🔍 בדיקת API Health:\n\n` +
      `• API מקומי: ${apiStatus}\n` +
      `• שגיאות ב-24 שעות: ${recentErrors >= 0 ? recentErrors : 'לא ניתן לבדוק'}\n\n` +
      `ℹ️ "API health check failed" מופיע כשהסריקה מנסה לגשת לאתר מבחוץ ולא מצליחה.\n` +
      `הסיבות הנפוצות:\n` +
      `1. האתר עולה אחרי deploy חדש (1-2 דקות)\n` +
      `2. בעיית DNS או SSL זמנית\n` +
      `3. Cloud Run מכבה instance לא פעיל (cold start)\n\n` +
      `אם האתר עובד כרגע למשתמשים - הכל בסדר ✅`;
  }

  // Status / system state
  if (msg.includes('סטטוס') || msg.includes('מצב') || msg.includes('status')) {
    const settings = await guardianService.getSettings();
    const userCount = await prisma.user.count().catch(() => 0);
    const activeUsers = await prisma.user.count({
      where: { isActive: true },
    }).catch(() => 0);
    const pendingInvoices = await prisma.invoice.count({
      where: { status: 'PENDING_ADMIN' },
    }).catch(() => 0);
    const recentErrors = await prisma.systemLog.count({
      where: { severity: { in: ['ERROR', 'CRITICAL'] }, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }).catch(() => 0);

    return `📊 מצב המערכת:\n\n` +
      `• Guardian: ${settings.enabled ? 'פעיל ✅' : 'כבוי ❌'}\n` +
      `• תחזוקה: ${settings.maintenanceMode ? 'מופעלת ⚠️' : 'כבויה ✅'}\n` +
      `• סריקה אחרונה: ${settings.lastScan ? new Date(settings.lastScan).toLocaleString('he-IL') : 'טרם בוצעה'}\n\n` +
      `👥 משתמשים: ${userCount} רשומים, ${activeUsers} פעילים\n` +
      `📄 חשבוניות ממתינות: ${pendingInvoices}\n` +
      `⚠️ שגיאות 24 שעות: ${recentErrors}\n` +
      `⏱ תדירות סריקה: כל ${settings.scanInterval} שעות`;
  }

  // Scan
  if (msg.includes('סרוק') || msg.includes('סריקה') || msg.includes('scan')) {
    guardianService.runFullScan().catch(err => console.error('[Guardian] Chat-triggered scan error:', err));
    return '🔄 מפעיל סריקת מערכת מלאה...\n\nהתוצאות יישלחו למייל שלך ויופיעו בלשונית "לוג".';
  }

  // Maintenance
  if (msg.includes('תחזוקה') || msg.includes('maintenance')) {
    if (msg.includes('הפעל')) {
      await guardianService.setMaintenanceMode(true);
      return '🔧 מצב תחזוקה הופעל ⚠️\nהמשתמשים יראו הודעת תחזוקה.';
    }
    if (msg.includes('כבה')) {
      await guardianService.setMaintenanceMode(false);
      return '✅ מצב תחזוקה כובה.\nהאתר חזר לפעולה רגילה.';
    }
    const settings = await guardianService.getSettings();
    return `מצב תחזוקה: ${settings.maintenanceMode ? 'מופעל ⚠️' : 'כבוי ✅'}\n\nשלח "הפעל תחזוקה" או "כבה תחזוקה" לשנות.`;
  }

  // Greeting
  if (msg.includes('שלום') || msg.includes('היי') || msg.includes('אהלן') || msg.includes('hello') || msg.includes('hi')) {
    return '👋 שלום! אני Guardian Bot של STANNEL.\n\n' +
      'אני מנטר את המערכת 24/7 ומתקן בעיות אוטומטית.\n\n' +
      'תשאל אותי מה שתרצה:\n' +
      '• "מה מצב המערכת?"\n' +
      '• "למה יש API health check failed?"\n' +
      '• "תרוץ סריקה"\n' +
      '• "כמה משתמשים יש?"\n' +
      '• "מה הבעיות האחרונות?"';
  }

  // Issues / errors / logs
  if (msg.includes('בעיות') || msg.includes('שגיאות') || msg.includes('errors') || msg.includes('לוג') || msg.includes('התראות')) {
    const logs = await guardianService.getLogs(5);
    if (logs.length === 0) {
      return '✅ אין בעיות פתוחות כרגע. המערכת תקינה!';
    }
    const logList = logs.map((l: any, i: number) => {
      const icon = l.severity === 'CRITICAL' ? '🔴' : l.severity === 'HIGH' ? '🟠' : l.severity === 'MEDIUM' ? '🟡' : '🟢';
      const statusIcon = l.status === 'AUTO_FIXED' ? '✅' : l.status === 'PENDING_APPROVAL' ? '⏳' : l.status === 'DISMISSED' ? '🚫' : '🔵';
      return `${i + 1}. ${icon} ${l.title}\n   ${statusIcon} ${l.status} | ${new Date(l.createdAt).toLocaleString('he-IL')}`;
    }).join('\n\n');
    return `📋 בעיות אחרונות:\n\n${logList}`;
  }

  // Users question
  if (msg.includes('משתמשים') || msg.includes('users') || msg.includes('כמה')) {
    const total = await prisma.user.count().catch(() => 0);
    const active = await prisma.user.count({ where: { isActive: true } }).catch(() => 0);
    const architects = await prisma.user.count({ where: { role: 'ARCHITECT' } }).catch(() => 0);
    const suppliers = await prisma.user.count({ where: { role: 'SUPPLIER' } }).catch(() => 0);
    const admins = await prisma.user.count({ where: { role: 'ADMIN' } }).catch(() => 0);
    return `👥 סטטיסטיקת משתמשים:\n\n` +
      `• סה"כ: ${total}\n` +
      `• פעילים: ${active}\n` +
      `• אדריכלים: ${architects}\n` +
      `• ספקים: ${suppliers}\n` +
      `• מנהלים: ${admins}`;
  }

  // Invoices
  if (msg.includes('חשבונ') || msg.includes('invoice')) {
    const pending = await prisma.invoice.count({ where: { status: 'PENDING_ADMIN' } }).catch(() => 0);
    const approved = await prisma.invoice.count({ where: { status: 'APPROVED' } }).catch(() => 0);
    const total = await prisma.invoice.count().catch(() => 0);
    return `📄 סטטיסטיקת חשבוניות:\n\n` +
      `• סה"כ: ${total}\n` +
      `• ממתינות לאישור: ${pending}\n` +
      `• מאושרות: ${approved}`;
  }

  // Help
  if (msg.includes('עזרה') || msg.includes('help') || msg.includes('פקודות')) {
    return '📖 אני יכול לענות על שאלות חופשיות!\n\n' +
      'דוגמאות:\n' +
      '• "מה מצב המערכת?"\n' +
      '• "למה יש שגיאות API?"\n' +
      '• "כמה משתמשים רשומים?"\n' +
      '• "מה עם החשבוניות?"\n' +
      '• "תרוץ סריקה"\n' +
      '• "הפעל/כבה תחזוקה"\n' +
      '• "מה הבעיות האחרונות?"\n\n' +
      'או שאל כל שאלה אחרת על המערכת!';
  }

  // General question - try to be smart about it
  if (msg.includes('למה') || msg.includes('מדוע') || msg.includes('why')) {
    // Generic "why" question - show system state
    const recentErrors = await prisma.systemLog.count({
      where: { severity: { in: ['ERROR', 'CRITICAL'] }, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }).catch(() => 0);
    const logs = await guardianService.getLogs(3);
    const logList = logs.length > 0
      ? logs.map((l: any) => `• ${l.title} (${l.severity})`).join('\n')
      : 'אין בעיות ידועות';

    return `🔍 ניתוח שאלתך: "${message}"\n\n` +
      `מצב נוכחי:\n` +
      `• שגיאות ב-24 שעות: ${recentErrors}\n` +
      `• בעיות ידועות:\n${logList}\n\n` +
      `ℹ️ אם אתה מתייחס לבעיה ספציפית, לחץ עליה בלשונית "לוג" כדי לפתוח צ'אט ממוקד.`;
  }

  // Default - still helpful
  const settings = await guardianService.getSettings();
  return `📝 קיבלתי את ההודעה שלך.\n\n` +
    `מצב מהיר: המערכת ${settings.enabled ? 'פעילה ✅' : 'כבויה ❌'} | ` +
    `סריקה אחרונה: ${settings.lastScan ? new Date(settings.lastScan).toLocaleString('he-IL') : 'טרם'}\n\n` +
    `💡 נסה לשאול:\n• "מה מצב המערכת?"\n• "מה הבעיות?"\n• "כמה משתמשים?"`;
}

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

      // Bot smart auto-reply
      const botReply = await generateBotReply(message, logId || null);
      if (botReply) {
        await guardianService.sendChatMessage(logId || null, botReply, 'bot');
      }

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
