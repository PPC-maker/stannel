// Logging Middleware - Track all API calls and errors
import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { systemLogger } from '../services/system-logger.service.js';
import { emailService, EMAIL_DESTINATIONS } from '../services/email.service.js';

// Extend FastifyRequest to include timing info
declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
    logContext?: {
      endpoint: string;
      method: string;
      userId?: string;
      userEmail?: string;
      userAgent?: string;
      ipAddress?: string;
    };
  }
}

// Pre-handler to capture request start time and context
export function requestLogger(
  request: FastifyRequest,
  _reply: FastifyReply,
  done: HookHandlerDoneFunction
) {
  request.startTime = Date.now();
  request.logContext = {
    endpoint: request.url || request.routerPath || 'unknown',
    method: request.method,
    userId: (request as any).user?.id,
    userEmail: (request as any).user?.email,
    userAgent: request.headers['user-agent'],
    ipAddress: request.ip || (request.headers['x-forwarded-for'] as string),
  };
  done();
}

// Post-handler to log successful responses
export async function responseLogger(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Skip logging for health checks and static files
  const skipPaths = ['/health', '/favicon.ico', '/api/v1/health'];
  if (skipPaths.some(path => request.url?.startsWith(path))) {
    return;
  }

  const responseTime = request.startTime ? Date.now() - request.startTime : 0;
  const statusCode = reply.statusCode;

  // Only log errors or slow requests (>2 seconds) to avoid flooding
  if (statusCode >= 400 || responseTime > 2000) {
    const category = systemLogger.getCategoryFromEndpoint(request.url || '');
    const isError = statusCode >= 400;

    await systemLogger.log({
      severity: statusCode >= 500 ? 'ERROR' : isError ? 'WARNING' : 'INFO',
      category,
      title: isError
        ? `API Error: ${request.method} ${request.url}`
        : `Slow Request: ${request.method} ${request.url}`,
      message: isError
        ? `Request failed with status ${statusCode}`
        : `Request took ${responseTime}ms`,
      endpoint: request.url,
      method: request.method,
      userId: request.logContext?.userId,
      userEmail: request.logContext?.userEmail,
      userAgent: request.logContext?.userAgent,
      ipAddress: request.logContext?.ipAddress,
      responseTime,
      statusCode,
    });
  }
}

// Error handler to log all errors
export async function errorLogger(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const responseTime = request.startTime ? Date.now() - request.startTime : 0;
  const category = systemLogger.getCategoryFromEndpoint(request.url || '');
  const statusCode = reply.statusCode >= 400 ? reply.statusCode : 500;

  // Log the error
  const logId = await systemLogger.error(
    category,
    `Error: ${request.method} ${request.url}`,
    error.message,
    error,
    {
      endpoint: request.url,
      method: request.method,
      userId: request.logContext?.userId,
      userEmail: request.logContext?.userEmail,
      userAgent: request.logContext?.userAgent,
      ipAddress: request.logContext?.ipAddress,
      responseTime,
      statusCode,
      requestBody: systemLogger.sanitizeBody((request as any).body),
    }
  );

  // Send email alert for critical errors (500+)
  if (statusCode >= 500 && logId) {
    // Fire and forget - don't block the response
    sendErrorAlertAsync(error, request, category, logId);
  }

  // Let Fastify handle the error response
  return error;
}

// Send error alert email asynchronously
async function sendErrorAlertAsync(
  error: Error,
  request: FastifyRequest,
  category: string,
  logId: string
) {
  try {
    await emailService.sendErrorAlert(
      EMAIL_DESTINATIONS.systemReports,
      {
        title: `${request.method} ${request.url}`,
        message: error.message,
        category,
        endpoint: request.url,
        userId: request.logContext?.userId,
        userEmail: request.logContext?.userEmail,
        stackTrace: error.stack,
        details: `Log ID: ${logId}\n\n${error.stack}`,
        timestamp: new Date(),
      }
    );
  } catch (emailError) {
    console.error('[ErrorLogger] Failed to send alert email:', emailError);
  }
}

// Helper to log specific operations manually
export const operationLogger = {
  async logInvoiceAction(action: string, invoiceId: string, userId?: string, userEmail?: string, details?: string) {
    await systemLogger.info('INVOICE', action, `Invoice ${invoiceId}: ${action}`, {
      userId,
      userEmail,
      details,
    });
  },

  async logRewardRedemption(productId: string, architectId: string, pointsUsed: number, cashPaid: number) {
    await systemLogger.info('REWARDS', 'Product Redeemed', `Product ${productId} redeemed by ${architectId}`, {
      details: `Points: ${pointsUsed}, Cash: ₪${cashPaid}`,
    });
  },

  async logUserAction(action: string, userId: string, userEmail?: string, details?: string) {
    await systemLogger.info('USER', action, `User ${userId}: ${action}`, {
      userId,
      userEmail,
      details,
    });
  },

  async logAuthAction(action: string, email: string, success: boolean, ip?: string) {
    await systemLogger.log({
      severity: success ? 'INFO' : 'WARNING',
      category: 'AUTH',
      title: action,
      message: success ? `${action} successful for ${email}` : `${action} failed for ${email}`,
      userEmail: email,
      ipAddress: ip,
    });
  },

  async logAdminAction(action: string, adminId: string, adminEmail: string, targetEntity?: string, details?: string) {
    await systemLogger.info('ADMIN', action, `Admin ${adminEmail}: ${action}`, {
      userId: adminId,
      userEmail: adminEmail,
      details: targetEntity ? `Target: ${targetEntity}. ${details || ''}` : details,
    });
  },

  async logSupplierAction(action: string, supplierId: string, details?: string) {
    await systemLogger.info('SUPPLIER', action, `Supplier ${supplierId}: ${action}`, {
      userId: supplierId,
      details,
    });
  },

  async logStorageAction(action: string, filename: string, success: boolean, details?: string) {
    await systemLogger.log({
      severity: success ? 'INFO' : 'ERROR',
      category: 'STORAGE',
      title: action,
      message: success ? `${action} successful: ${filename}` : `${action} failed: ${filename}`,
      details,
    });
  },

  async logAIAction(action: string, invoiceId: string, result: string, confidence?: number) {
    await systemLogger.info('AI', action, `AI ${action} for invoice ${invoiceId}: ${result}`, {
      details: confidence ? `Confidence: ${(confidence * 100).toFixed(1)}%` : undefined,
    });
  },
};
