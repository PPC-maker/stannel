// Auth API Client

import { config, getHeaders, setAuthToken, fetchWithRetry } from './config';
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
      throw new Error(errorData.error || errorData.message || 'Registration failed');
    }

    const result = await response.json();
    setAuthToken(result.token);
    return result;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${config.baseUrl}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Login failed');
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
      throw new Error(errorData.error || errorData.message || 'Token verification failed');
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
      throw new Error(errorData.error || errorData.message || 'Google authentication failed');
    }

    const result = await response.json();
    setAuthToken(result.token);
    return result;
  },

  async getMe(): Promise<AuthUser> {
    const response = await fetch(`${config.baseUrl}/auth/me`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Failed to get user');
    }

    return response.json();
  },

  async updateProfile(data: Partial<AuthUser>): Promise<AuthUser> {
    const response = await fetch(`${config.baseUrl}/auth/profile`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Failed to update profile');
    }

    return response.json();
  },

  async uploadProfileImage(file: File): Promise<{ user: AuthUser; imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const headers = getHeaders();
    // Remove Content-Type to let browser set it with boundary for multipart
    delete (headers as Record<string, string>)['Content-Type'];

    const response = await fetch(`${config.baseUrl}/auth/profile/image`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Failed to upload profile image');
    }

    return response.json();
  },

  logout() {
    setAuthToken(null);
  },
};
