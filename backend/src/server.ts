// STANNEL Backend Server - Fastify

import Fastify from 'fastify';
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
}

// Health check
server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// TEMPORARY: Test email endpoint (remove after testing)
import { emailService } from './services/email.service.js';
server.get('/test-email-temp-xyz123', async () => {
  const sent = await emailService.sendTestEmail('orenshp77@gmail.com');
  return { sent, timestamp: new Date().toISOString() };
});

// WebSocket endpoint - registered after plugins in start()
function registerWebSocket() {
  server.get('/ws', { websocket: true }, (socket, req) => {
    console.log('[WebSocket] New connection');
    wsService.addClient(socket);

    socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        }
      } catch (e) {
        // Ignore invalid JSON
      }
    });
  });
}

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
