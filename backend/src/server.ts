// STANNEL Backend Server - Fastify

import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import websocket from '@fastify/websocket';
import compress from '@fastify/compress';
import * as path from 'path';
import * as fs from 'fs';

// Initialize config and Firebase FIRST
import { validateEnv } from './lib/config.js';
import { initializeFirebase } from './lib/firebase.js';
import { schedulerService } from './services/scheduler.service.js';
import { healthMonitorService } from './services/health-monitor.service.js';
import { systemScannerService } from './services/system-scanner.service.js';
import { securityMiddleware, securityHeadersMiddleware } from './middleware/security.middleware.js';
import { financialRateLimitMiddleware } from './middleware/financial-rate-limit.middleware.js';
import { wsService } from './services/websocket.service.js';
import { requestLogger, responseLogger, errorLogger } from './middleware/logging.middleware.js';

// Validate environment variables
validateEnv();

// Initialize Firebase Admin SDK
initializeFirebase();

// Initialize Scheduler for background tasks (weekly reports, etc.)
schedulerService.init();

// Initialize Health Monitor for daily status reports
healthMonitorService.initDailyScheduler();

// Initialize System Scanner for nightly scans at 1:00 AM
systemScannerService.initNightlyScanner();

// Import routes
import { authRoutes } from './routes/auth.routes.js';
import { invoiceRoutes } from './routes/invoices.routes.js';
import { walletRoutes } from './routes/wallet.routes.js';
import { eventsRoutes } from './routes/events.routes.js';
import { rewardsRoutes } from './routes/rewards.routes.js';
import { adminRoutes } from './routes/admin.routes.js';
import { supplierRoutes } from './routes/supplier.routes.js';
import { analyticsRoutes } from './routes/analytics.routes.js';
import { aiRoutes } from './routes/ai.routes.js';
import { notificationsRoutes } from './routes/notifications.routes.js';
import { goalsRoutes } from './routes/goals.routes.js';
import { serviceProvidersRoutes } from './routes/service-providers.routes.js';
import { suppliersDirectoryRoutes } from './routes/suppliers-directory.routes.js';
import { supplierProjectsRoutes } from './routes/supplier-projects.routes.js';
import { meetingsRoutes } from './routes/meetings.routes.js';

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: { colorize: true },
    } : undefined,
  },
  trustProxy: true,
});

// Register plugins
async function registerPlugins() {
  // CORS
  await server.register(cors, {
    origin: [
      'https://stannel.app',
      'https://www.stannel.app',
      /\.stannel\.app$/,
      /\.run\.app$/,
      /^http:\/\/localhost/,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Multipart (file uploads)
  await server.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1,
    },
  });

  // Rate limiting
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Response compression (gzip/brotli)
  await server.register(compress, {
    global: true,
    threshold: 1024, // Only compress responses > 1KB
    encodings: ['gzip', 'deflate'],
  });

  // WebSocket for real-time updates
  await server.register(websocket);

  // Static file serving for local uploads (when not using GCS)
  const useLocalStorage = !process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (useLocalStorage) {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    await server.register(fastifyStatic, {
      root: uploadsDir,
      prefix: '/uploads/',
      decorateReply: false,
    });
    console.log('[Server] Static file serving enabled for /uploads/');
  }
}

// Register security hooks
server.addHook('onRequest', securityHeadersMiddleware);
server.addHook('preHandler', securityMiddleware);
server.addHook('preHandler', financialRateLimitMiddleware);

// Register logging hooks
server.addHook('preHandler', requestLogger);
server.addHook('onResponse', responseLogger);
server.setErrorHandler(errorLogger);

// Register routes
async function registerRoutes() {
  server.register(authRoutes, { prefix: '/api/v1/auth' });
  server.register(invoiceRoutes, { prefix: '/api/v1/invoices' });
  server.register(walletRoutes, { prefix: '/api/v1/wallet' });
  server.register(eventsRoutes, { prefix: '/api/v1/events' });
  server.register(rewardsRoutes, { prefix: '/api/v1/rewards' });
  server.register(adminRoutes, { prefix: '/api/v1/admin' });
  server.register(supplierRoutes, { prefix: '/api/v1/supplier' });
  server.register(analyticsRoutes, { prefix: '/api/v1/analytics' });
  server.register(aiRoutes, { prefix: '/api/v1/ai' });
  server.register(notificationsRoutes, { prefix: '/api/v1/notifications' });
  server.register(goalsRoutes, { prefix: '/api/v1/goals' });
  server.register(serviceProvidersRoutes, { prefix: '/api/v1/service-providers' });
  server.register(suppliersDirectoryRoutes, { prefix: '/api/v1/suppliers' });
  server.register(supplierProjectsRoutes, { prefix: '/api/v1/projects' });
  server.register(meetingsRoutes, { prefix: '/api/v1/meetings' });
}

// Health check
server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});


// WebSocket endpoint - registered after plugins in start()
function registerWebSocket() {
  server.get('/ws', { websocket: true }, (socket, req) => {
    console.log('[WebSocket] New connection');
    wsService.addClient(socket);

    socket.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        }
        // Client sends auth message with Firebase token to identify themselves
        if (data.type === 'auth' && data.token) {
          try {
            const { getAuth } = await import('firebase-admin/auth');
            const decoded = await getAuth().verifyIdToken(data.token);
            const { default: prisma } = await import('./lib/prisma.js');
            const user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid }, select: { id: true, role: true } });
            if (user) {
              wsService.addClient(socket, user.id, user.role);
              socket.send(JSON.stringify({ type: 'auth:ok', userId: user.id }));
              console.log(`[WebSocket] Authenticated user: ${user.id} (${user.role})`);
            }
          } catch (authErr) {
            socket.send(JSON.stringify({ type: 'auth:error' }));
          }
        }
      } catch (e) {
        // Ignore invalid JSON
      }
    });
  });
}

// Client error reporting (public - no auth required)
server.post('/api/v1/report-error', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as { page?: string; error?: string; userAgent?: string };
    const { emailService } = await import('./services/email.service.js');
    await emailService.sendErrorAlert(
      ['orenshp77@gmail.com'],
      {
        title: `שגיאת ממשק: ${body.page || 'לא ידוע'}`,
        message: body.error || 'שגיאה לא מזוהה',
        category: 'CLIENT_ERROR',
        endpoint: body.page,
        details: `User-Agent: ${body.userAgent || request.headers['user-agent'] || 'N/A'}`,
        timestamp: new Date(),
      }
    );
    return { ok: true };
  } catch (e) {
    console.error('[ReportError] Failed to send error alert:', e);
    return reply.status(500).send({ ok: false });
  }
});

// Root endpoint
server.get('/', async () => {
  return {
    name: 'STANNEL API',
    version: '1.0.0',
    description: 'Loyalty Management Platform for Architects and Suppliers',
  };
});

// Start server
async function start() {
  try {
    await registerPlugins();
    registerWebSocket(); // Register WebSocket after plugins
    await registerRoutes();

    const port = parseInt(process.env.PORT || '8080', 10);
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    console.log(`🚀 STANNEL API Server running on http://${host}:${port}`);
    console.log(`📡 WebSocket available at ws://${host}:${port}/ws`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();

export default server;
