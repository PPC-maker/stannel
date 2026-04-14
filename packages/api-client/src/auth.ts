// Auth API Client

import { config, getHeaders, setAuthToken, fetchWithRetry, fetchWithAuth } from './config';
import type { AuthResponse, LoginRequest, RegisterRequest, AuthUser } from '@stannel/types';

export const authApi = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetchWithRetry(`${config.baseUrl}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'שגיאה בהרשמה. נסה שוב או פנה למנהל.');
    }

    const result = await response.json();
    setAuthToken(result.token);
    return result;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetchWithRetry(`${config.baseUrl}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'שגיאה בהתחברות. בדוק את הפרטים ונסה שוב.');
    }

    const result = await response.json();
    setAuthToken(result.token);
    return result;
  },

  async verifyToken(firebaseToken: string): Promise<AuthResponse> {
    const response = await fetchWithRetry(`${config.baseUrl}/auth/verify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ token: firebaseToken }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    const result = await response.json();
    setAuthToken(result.token);
    return result;
  },

  async googleAuth(firebaseToken: string, role?: 'ARCHITECT' | 'SUPPLIER'): Promise<AuthResponse & { isNewUser?: boolean }> {
    const response = await fetchWithRetry(`${config.baseUrl}/auth/google`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ token: firebaseToken, role }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'שגיאה בהתחברות עם Google. נסה שוב.');
    }

    const result = await response.json();
    setAuthToken(result.token);
    return result;
  },

  async getMe(): Promise<AuthUser> {
    const response = await fetchWithAuth(`${config.baseUrl}/auth/me`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'שגיאה בטעינת פרטי המשתמש. נסה לרענן את הדף.');
    }

    return response.json();
  },

  async updateProfile(data: Partial<AuthUser>): Promise<AuthUser> {
    const response = await fetchWithAuth(`${config.baseUrl}/auth/profile`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'שגיאה בעדכון הפרופיל. נסה שוב.');
    }

    return response.json();
  },

  async uploadProfileImage(file: File): Promise<{ user: AuthUser; imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const headers = getHeaders();
    // Remove Content-Type to let browser set it with boundary for multipart
    delete (headers as Record<string, string>)['Content-Type'];

    const response = await fetchWithAuth(`${config.baseUrl}/auth/profile/image`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'שגיאה בהעלאת תמונת הפרופיל. נסה שוב.');
    }

    return response.json();
  },

  logout() {
    setAuthToken(null);
  },
};
