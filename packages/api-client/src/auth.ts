// Auth API Client

import { config, getHeaders, setAuthToken } from './config';
import type { AuthResponse, LoginRequest, RegisterRequest, AuthUser } from '@stannel/types';

export const authApi = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${config.baseUrl}/auth/register`, {
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
    const response = await fetch(`${config.baseUrl}/auth/verify`, {
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
    const response = await fetch(`${config.baseUrl}/auth/google`, {
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

  logout() {
    setAuthToken(null);
  },
};
