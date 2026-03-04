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
