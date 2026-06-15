// STANNEL API Client - Main Export

export { config, setAuthToken, getAuthToken, getHeaders, getMultipartHeaders, setTokenRefreshCallback, fetchWithAuth } from './config';
export { authApi } from './auth';
export { invoicesApi } from './invoices';
export { walletApi } from './wallet';
export { rewardsApi } from './rewards';
export { eventsApi } from './events';
export { adminApi } from './admin';
export { aiApi } from './ai';
export { notificationsApi } from './notifications';
export { goalsApi } from './goals';
export { serviceProvidersApi } from './service-providers';
export { analyticsApi } from './analytics';
export { supplierApi } from './supplier';
export { suppliersDirectoryApi } from './suppliers-directory';
export { meetingsApi } from './meetings';

// Local imports for apiClient convenience object
import { authApi } from './auth';
import { invoicesApi } from './invoices';
import { walletApi } from './wallet';
import { rewardsApi } from './rewards';
import { eventsApi } from './events';
import { adminApi } from './admin';
import { aiApi } from './ai';
import { notificationsApi } from './notifications';
import { goalsApi } from './goals';
import { serviceProvidersApi } from './service-providers';
import { analyticsApi } from './analytics';
import { supplierApi } from './supplier';
import { suppliersDirectoryApi } from './suppliers-directory';
import { meetingsApi } from './meetings';

// API Error class for better error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Combined API client for convenience
export const apiClient = {
  get auth() { return authApi; },
  get invoices() { return invoicesApi; },
  get wallet() { return walletApi; },
  get rewards() { return rewardsApi; },
  get events() { return eventsApi; },
  get admin() { return adminApi; },
  get ai() { return aiApi; },
  get notifications() { return notificationsApi; },
  get goals() { return goalsApi; },
  get serviceProviders() { return serviceProvidersApi; },
  get analytics() { return analyticsApi; },
  get supplier() { return supplierApi; },
  get suppliersDirectory() { return suppliersDirectoryApi; },
  get meetings() { return meetingsApi; },
};
