// STANNEL API Client - Main Export

export { config, setAuthToken, getAuthToken, getHeaders, getMultipartHeaders } from './config';
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
  get auth() {
    return require('./auth').authApi;
  },
  get invoices() {
    return require('./invoices').invoicesApi;
  },
  get wallet() {
    return require('./wallet').walletApi;
  },
  get rewards() {
    return require('./rewards').rewardsApi;
  },
  get events() {
    return require('./events').eventsApi;
  },
  get admin() {
    return require('./admin').adminApi;
  },
  get ai() {
    return require('./ai').aiApi;
  },
  get notifications() {
    return require('./notifications').notificationsApi;
  },
  get goals() {
    return require('./goals').goalsApi;
  },
  get serviceProviders() {
    return require('./service-providers').serviceProvidersApi;
  },
  get analytics() {
    return require('./analytics').analyticsApi;
  },
  get supplier() {
    return require('./supplier').supplierApi;
  },
};
