// Financial Rate Limiting Middleware - STANNEL Platform
// Stricter rate limiting for financial operations

import { FastifyRequest, FastifyReply } from 'fastify';
import { systemLogger } from '../services/system-logger.service.js';

// Rate limit tracking per user
const userRateLimits = new Map<string, {
  timestamps: Date[];
  blocked: boolean;
  blockExpires?: Date;
}>();

// Configuration
const FINANCIAL_ENDPOINTS = [
  '/api/v1/rewards/redeem',
  '/api/v1/wallet/transfer',
  '/api/v1/wallet/withdraw',
];

const SENSITIVE_ENDPOINTS = [
  '/api/v1/admin/',
  '/api/v1/invoices/approve',
  '/api/v1/invoices/reject',
];

const LIMITS = {
  financial: { requests: 5, windowMs: 60000 },      // 5 requests per minute
  sensitive: { requests: 20, windowMs: 60000 },     // 20 requests per minute
  blocked_duration: 5 * 60 * 1000,                   // 5 minutes block
};

function isFinancialEndpoint(url: string): boolean {
  return FINANCIAL_ENDPOINTS.some(ep => url.includes(ep));
}

function isSensitiveEndpoint(url: string): boolean {
  return SENSITIVE_ENDPOINTS.some(ep => url.includes(ep));
}

export async function financialRateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const url = request.url;

  // Only apply to financial/sensitive endpoints
  if (!isFinancialEndpoint(url) && !isSensitiveEndpoint(url)) {
    return;
  }

  const user = (request as any).user;
  if (!user) return; // No user = handled by auth middleware

  const userId = user.id;
  const now = new Date();
  const limit = isFinancialEndpoint(url) ? LIMITS.financial : LIMITS.sensitive;

  let record = userRateLimits.get(userId);

  if (!record) {
    record = { timestamps: [], blocked: false };
    userRateLimits.set(userId, record);
  }

  // Check if blocked
  if (record.blocked && record.blockExpires && record.blockExpires > now) {
    const remainingMs = record.blockExpires.getTime() - now.getTime();
    const remainingSec = Math.ceil(remainingMs / 1000);

    reply.code(429).send({
      error: 'Too many requests',
      message: `נסו שוב בעוד ${remainingSec} שניות`,
      retryAfter: remainingSec,
    });
    return;
  } else if (record.blocked) {
    // Unblock if time expired
    record.blocked = false;
    record.blockExpires = undefined;
    record.timestamps = [];
  }

  // Clean old timestamps
  const windowStart = new Date(now.getTime() - limit.windowMs);
  record.timestamps = record.timestamps.filter(t => t > windowStart);

  // Check if limit exceeded
  if (record.timestamps.length >= limit.requests) {
    record.blocked = true;
    record.blockExpires = new Date(now.getTime() + LIMITS.blocked_duration);

    // Log the rate limit
    await systemLogger.warning('FINANCIAL', 'Rate Limit Exceeded',
      `User ${userId} exceeded rate limit on ${url}`, {
        userId,
        userEmail: user.email,
        ipAddress: request.ip,
        endpoint: url,
      });

    const remainingSec = Math.ceil(LIMITS.blocked_duration / 1000);
    reply.code(429).send({
      error: 'Too many requests',
      message: `יותר מדי בקשות. נסו שוב בעוד ${remainingSec} שניות`,
      retryAfter: remainingSec,
    });
    return;
  }

  // Record this request
  record.timestamps.push(now);
}

// Cleanup old records every 10 minutes
setInterval(() => {
  const now = new Date();
  const expireTime = new Date(now.getTime() - 10 * 60 * 1000);

  for (const [userId, record] of userRateLimits) {
    // Remove records with no recent activity
    if (record.timestamps.every(t => t < expireTime)) {
      userRateLimits.delete(userId);
    }
  }
}, 10 * 60 * 1000);
