// STANNEL Types - Main Export

export * from './user.types';
export * from './invoice.types';
export * from './wallet.types';
export * from './event.types';
export * from './contract.types';

// Common Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
}

// Audit Log
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

// System Log Types
export enum SystemLogSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export enum SystemLogCategory {
  HEALTH_CHECK = 'HEALTH_CHECK',
  SECURITY = 'SECURITY',
  API_TEST = 'API_TEST',
  DATABASE = 'DATABASE',
  PERFORMANCE = 'PERFORMANCE',
  SCHEDULER = 'SCHEDULER',
}

export interface SystemLog {
  id: string;
  severity: SystemLogSeverity;
  category: SystemLogCategory;
  title: string;
  message: string;
  details?: string;
  endpoint?: string;
  responseTime?: number;
  stackTrace?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
  claudeFormat?: string; // Formatted for copy/paste to Claude
}

export interface SystemLogStats {
  total: number;
  unresolved: number;
  critical: number;
  errors: number;
  warnings: number;
}
