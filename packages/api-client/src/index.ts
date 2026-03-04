// STANNEL API Client - Main Export

export { config, setAuthToken, getAuthToken } from './config';
export { authApi } from './auth';
export { invoicesApi } from './invoices';
export { walletApi } from './wallet';
export { rewardsApi } from './rewards';
export { eventsApi } from './events';

// Combined API client for convenience
export const apiClient = {
  auth: await import('./auth').then(m => m.authApi),
  invoices: await import('./invoices').then(m => m.invoicesApi),
  wallet: await import('./wallet').then(m => m.walletApi),
  rewards: await import('./rewards').then(m => m.rewardsApi),
  events: await import('./events').then(m => m.eventsApi),
};
