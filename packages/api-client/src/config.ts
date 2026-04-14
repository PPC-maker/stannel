// API Client Configuration

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:7070';

export const config = {
  baseUrl: `${API_BASE_URL}/api/v1`,
  timeout: 30000,
  retryAttempts: 2,
  retryDelay: 1500,
};

// Fetch with automatic retry for cold start issues
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  attempts = config.retryAttempts
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    // Retry on 500/503 (likely cold start or DB connection issue)
    if ((response.status === 500 || response.status === 503) && attempts > 0) {
      console.log(`[API] Retrying request (${attempts} attempts left)...`);
      await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      return fetchWithRetry(url, options, attempts - 1);
    }

    return response;
  } catch (error) {
    // Retry on network errors
    if (attempts > 0) {
      console.log(`[API] Network error, retrying (${attempts} attempts left)...`);
      await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      return fetchWithRetry(url, options, attempts - 1);
    }
    throw error;
  }
}

let authToken: string | null = null;
let tokenRefreshCallback: (() => Promise<string | null>) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

// Register a callback to refresh the token on 401
export const setTokenRefreshCallback = (cb: () => Promise<string | null>) => {
  tokenRefreshCallback = cb;
};

// Mutex for token refresh to prevent multiple simultaneous refreshes
let refreshPromise: Promise<string | null> | null = null;

// Try to refresh token and retry request on 401
export async function fetchWithAuth(url: string, options: RequestInit): Promise<Response> {
  let response = await fetchWithRetry(url, options);

  if (response.status === 401 && tokenRefreshCallback) {
    try {
      // Deduplicate concurrent refresh calls - reuse in-flight refresh
      if (!refreshPromise) {
        refreshPromise = tokenRefreshCallback().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;
      if (newToken) {
        authToken = newToken;
        // Update Authorization header and retry
        const newHeaders = { ...(options.headers as Record<string, string>) };
        newHeaders['Authorization'] = `Bearer ${newToken}`;
        response = await fetchWithRetry(url, { ...options, headers: newHeaders });
      }
    } catch {
      // Refresh failed, return original 401
    }
  }

  return response;
}

export const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
};

export const getMultipartHeaders = (): HeadersInit => {
  const headers: HeadersInit = {};

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
};

export const getHeadersNoBody = (): HeadersInit => {
  const headers: HeadersInit = {};

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
};
