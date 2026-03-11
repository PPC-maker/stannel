// STANNEL API Client - Main Export

export { config, setAuthToken, getAuthToken, getHeaders, getMultipartHeaders } from './config';
export { authApi } from './auth';
export { invoicesApi } from './invoices';
export { walletApi } from './wallet';
export { rewardsApi } from './rewards';
export { eventsApi } from './events';
export { adminApi } from './admin';
export { aiApi } from './ai';

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
};
