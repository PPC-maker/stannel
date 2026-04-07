// System Logger Service - Comprehensive logging for all operations
// Logs are stored in database and can be copied to Claude for debugging

import prisma from '../lib/prisma.js';

type LogSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
type LogCategory =
  | 'HEALTH_CHECK' | 'SECURITY' | 'API_TEST' | 'DATABASE' | 'PERFORMANCE'
  | 'SCHEDULER' | 'AUTH' | 'INVOICE' | 'REWARDS' | 'WALLET' | 'EVENTS'
  | 'ADMIN' | 'SUPPLIER' | 'USER' | 'EMAIL' | 'STORAGE' | 'AI' | 'FINANCIAL';

interface LogEntry {
  severity: LogSeverity;
  category: LogCategory;
  title: string;
  message: string;
  details?: string;
  endpoint?: string;
  method?: string;
  userId?: string;
  userEmail?: string;
  requestBody?: string;
  responseTime?: number;
  statusCode?: number;
  stackTrace?: string;
  userAgent?: string;
  ipAddress?: string;
}

interface RequestContext {
  endpoint: string;
  method: string;
  userId?: string;
  userEmail?: string;
  userAgent?: string;
  ipAddress?: string;
  startTime: number;
}

// Sanitize sensitive data from request body
function sanitizeBody(body: any): string {
  if (!body) return '';

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization', 'creditCard', 'cvv'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  try {
    return JSON.stringify(sanitized, null, 2).slice(0, 5000); // Limit size
  } catch {
    return '[Unable to serialize]';
  }
}

// Format error for Claude debugging
function formatForClaude(entry: LogEntry, error?: Error): string {
  const lines = [
    '='.repeat(60),
    `STANNEL SYSTEM LOG - ${entry.severity}`,
    '='.repeat(60),
    '',
    `Category: ${entry.category}`,
    `Title: ${entry.title}`,
    `Time: ${new Date().toISOString()}`,
    '',
    `Message: ${entry.message}`,
  ];

  if (entry.endpoint) {
    lines.push(`Endpoint: ${entry.method || 'GET'} ${entry.endpoint}`);
  }

  if (entry.userId) {
    lines.push(`User: ${entry.userEmail || entry.userId}`);
  }

  if (entry.responseTime) {
    lines.push(`Response Time: ${entry.responseTime}ms`);
  }

  if (entry.statusCode) {
    lines.push(`Status Code: ${entry.statusCode}`);
  }

  if (entry.details) {
    lines.push('', 'Details:', entry.details);
  }

  if (error) {
    lines.push('', 'Error Stack:', error.stack || error.message);
  }

  if (entry.requestBody) {
    lines.push('', 'Request Body:', entry.requestBody);
  }

  lines.push('', '='.repeat(60));
  lines.push('Copy this entire block to Claude for debugging assistance');
  lines.push('='.repeat(60));

  return lines.join('\n');
}

export const systemLogger = {
  // Main logging function
  async log(entry: LogEntry): Promise<string | null> {
    try {
      const log = await prisma.systemLog.create({
        data: {
          severity: entry.severity,
          category: entry.category,
          title: entry.title,
          message: entry.message,
          details: entry.details,
          endpoint: entry.endpoint,
          method: entry.method,
          userId: entry.userId,
          userEmail: entry.userEmail,
          requestBody: entry.requestBody,
          responseTime: entry.responseTime,
          statusCode: entry.statusCode,
          stackTrace: entry.stackTrace,
          userAgent: entry.userAgent,
          ipAddress: entry.ipAddress,
        },
      });

      // Console log for development
      const logLevel = entry.severity === 'ERROR' || entry.severity === 'CRITICAL'
        ? 'error'
        : entry.severity === 'WARNING'
          ? 'warn'
          : 'info';

      console[logLevel](`[${entry.category}] ${entry.title}: ${entry.message}`);

      return log.id;
    } catch (error) {
      // Fallback to console if DB fails
      console.error('[SystemLogger] Failed to write log to database:', error);
      console.error('[Original Log]', entry);
      return null;
    }
  },

  // Quick logging methods
  async info(category: LogCategory, title: string, message: string, extra?: Partial<LogEntry>): Promise<void> {
    await this.log({ severity: 'INFO', category, title, message, ...extra });
  },

  async warning(category: LogCategory, title: string, message: string, extra?: Partial<LogEntry>): Promise<void> {
    await this.log({ severity: 'WARNING', category, title, message, ...extra });
  },

  async error(category: LogCategory, title: string, message: string, error?: Error, extra?: Partial<LogEntry>): Promise<string | null> {
    const entry: LogEntry = {
      severity: 'ERROR',
      category,
      title,
      message,
      stackTrace: error?.stack,
      details: error ? formatForClaude({ severity: 'ERROR', category, title, message, ...extra }, error) : undefined,
      ...extra,
    };
    return await this.log(entry);
  },

  async critical(category: LogCategory, title: string, message: string, error?: Error, extra?: Partial<LogEntry>): Promise<string | null> {
    const entry: LogEntry = {
      severity: 'CRITICAL',
      category,
      title,
      message,
      stackTrace: error?.stack,
      details: error ? formatForClaude({ severity: 'CRITICAL', category, title, message, ...extra }, error) : undefined,
      ...extra,
    };
    return await this.log(entry);
  },

  // Log API request/response
  async logApiCall(
    context: RequestContext,
    statusCode: number,
    error?: Error,
    responseBody?: any
  ): Promise<void> {
    const responseTime = Date.now() - context.startTime;
    const isError = statusCode >= 400;
    const isCritical = statusCode >= 500;

    const category = this.getCategoryFromEndpoint(context.endpoint);
    const title = isError
      ? `API Error: ${context.method} ${context.endpoint}`
      : `API Call: ${context.method} ${context.endpoint}`;

    const message = isError
      ? `Request failed with status ${statusCode}`
      : `Request completed successfully in ${responseTime}ms`;

    await this.log({
      severity: isCritical ? 'CRITICAL' : isError ? 'ERROR' : 'INFO',
      category,
      title,
      message,
      endpoint: context.endpoint,
      method: context.method,
      userId: context.userId,
      userEmail: context.userEmail,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      responseTime,
      statusCode,
      stackTrace: error?.stack,
      details: error ? formatForClaude({
        severity: isCritical ? 'CRITICAL' : 'ERROR',
        category,
        title,
        message,
        endpoint: context.endpoint,
        method: context.method,
        userId: context.userId,
        userEmail: context.userEmail,
        responseTime,
        statusCode,
      }, error) : undefined,
    });
  },

  // Helper to determine category from endpoint
  getCategoryFromEndpoint(endpoint: string): LogCategory {
    if (endpoint.includes('/auth')) return 'AUTH';
    if (endpoint.includes('/invoices')) return 'INVOICE';
    if (endpoint.includes('/rewards')) return 'REWARDS';
    if (endpoint.includes('/wallet')) return 'WALLET';
    if (endpoint.includes('/events')) return 'EVENTS';
    if (endpoint.includes('/admin')) return 'ADMIN';
    if (endpoint.includes('/supplier')) return 'SUPPLIER';
    if (endpoint.includes('/users') || endpoint.includes('/profile')) return 'USER';
    return 'API_TEST';
  },

  // Get recent errors for daily report
  async getRecentErrors(hours: number = 24): Promise<any[]> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return prisma.systemLog.findMany({
      where: {
        severity: { in: ['ERROR', 'CRITICAL'] },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  },

  // Get error statistics
  async getErrorStats(hours: number = 24): Promise<{
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    criticalCount: number;
  }> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const errors = await prisma.systemLog.findMany({
      where: {
        severity: { in: ['ERROR', 'CRITICAL', 'WARNING'] },
        createdAt: { gte: since },
      },
      select: {
        severity: true,
        category: true,
      },
    });

    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let criticalCount = 0;

    for (const error of errors) {
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      if (error.severity === 'CRITICAL') criticalCount++;
    }

    return {
      total: errors.length,
      byCategory,
      bySeverity,
      criticalCount,
    };
  },

  // Mark error as resolved
  async resolveError(logId: string, resolvedBy: string): Promise<void> {
    await prisma.systemLog.update({
      where: { id: logId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy,
      },
    });
  },

  // Get unresolved errors
  async getUnresolvedErrors(): Promise<any[]> {
    return prisma.systemLog.findMany({
      where: {
        severity: { in: ['ERROR', 'CRITICAL'] },
        resolved: false,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Create context from Fastify request
  createContext(request: any): RequestContext {
    return {
      endpoint: request.url || request.routerPath || 'unknown',
      method: request.method || 'GET',
      userId: request.user?.id,
      userEmail: request.user?.email,
      userAgent: request.headers?.['user-agent'],
      ipAddress: request.ip || request.headers?.['x-forwarded-for'],
      startTime: Date.now(),
    };
  },

  // Sanitize body helper
  sanitizeBody,
};
