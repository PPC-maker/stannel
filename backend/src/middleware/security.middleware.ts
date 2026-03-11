// Security Middleware - STANNEL Platform
// Monitors all requests for suspicious activity

import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { securityService } from '../services/security.service.js';

export async function securityMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const ip = request.ip || request.headers['x-forwarded-for']?.toString() || 'unknown';
  const userAgent = request.headers['user-agent'];
  const endpoint = request.url;

  // Track request rate
  securityService.trackRequest(ip, endpoint, userAgent);

  // Check if IP is suspicious (already flagged)
  if (securityService.isIpSuspicious(ip)) {
    // Add delay for suspicious IPs (rate limiting)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Check request body for injection attempts
  // Skip for multipart/form-data requests (file uploads)
  const contentType = request.headers['content-type'] || '';
  const isMultipart = contentType.includes('multipart/form-data');

  if (!isMultipart && request.body && typeof request.body === 'object') {
    const injectionCheck = securityService.checkForInjection(
      request.body as Record<string, unknown>,
      ip,
      endpoint,
      userAgent
    );

    if (injectionCheck.isSuspicious) {
      reply.code(400).send({ error: 'Invalid request' });
      return;
    }
  }

  // Check query parameters for injection
  if (request.query && typeof request.query === 'object') {
    const queryCheck = securityService.checkForInjection(
      request.query as Record<string, unknown>,
      ip,
      endpoint,
      userAgent
    );

    if (queryCheck.isSuspicious) {
      reply.code(400).send({ error: 'Invalid request' });
      return;
    }
  }
}

// Add security headers
export function securityHeadersMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
): void {
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
  reply.header('X-XSS-Protection', '1; mode=block');
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (process.env.NODE_ENV === 'production') {
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  done();
}
