// STANNEL Backend Server - Fastify

import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';

// Import routes
import { authRoutes } from './routes/auth.routes.js';
import { invoiceRoutes } from './routes/invoices.routes.js';
import { walletRoutes } from './routes/wallet.routes.js';
import { eventsRoutes } from './routes/events.routes.js';
import { rewardsRoutes } from './routes/rewards.routes.js';
import { adminRoutes } from './routes/admin.routes.js';
import { supplierRoutes } from './routes/supplier.routes.js';
import { analyticsRoutes } from './routes/analytics.routes.js';

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
}

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
}

// Health check
server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
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
    await registerRoutes();

    const port = parseInt(process.env.PORT || '8080', 10);
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    console.log(`🚀 STANNEL API Server running on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();

export default server;
