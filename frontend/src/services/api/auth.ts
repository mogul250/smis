import api, { handleApiResponse, validateRequiredFields, validateEmail, setAuthToken, clearAuthToken } from './config';
import { LoginRequest, LoginResponse, AuthUser } from './types';

/**
 * Authentication API Module
 * Handles all authentication-related API calls
 */
export class AuthAPI {
  /**
   * Login for staff users (teacher, hod, finance, admin)
   * POST /api/auth/login
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Validate required fields
    validateRequiredFields(credentials, ['email', 'password']);
    
    // Validate email format
    if (!validateEmail(credentials.email)) {
      throw new Error('Invalid email format');
    }

    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      const data = handleApiResponse(response);
      
      // Store token in localStorage
      if (data.token) {
        setAuthToken(data.token);
      }
      
      return data;
    } catch (error) {
      // Clear any existing token on login failure
      clearAuthToken();
      throw error;
    }
  }

  /**
   * Login for students
   * POST /api/auth/student/login
   */
  async studentLogin(credentials: LoginRequest): Promise<LoginResponse> {
    // Validate required fields
    validateRequiredFields(credentials, ['email', 'password']);
    
    // Validate email format
    if (!validateEmail(credentials.email)) {
      throw new Error('Invalid email format');
    }

    try {
      const response = await api.post<LoginResponse>('/auth/student/login', credentials);
      const data = handleApiResponse(response);
      
      // Store token in localStorage
      if (data.token) {
        setAuthToken(data.token);
      }
      
      return data;
    } catch (error) {
      // Clear any existing token on login failure
      clearAuthToken();
      throw error;
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(): Promise<{ message: string }> {
    try {
      const response = await api.post<{ message: string }>('/auth/logout');
      const data = handleApiResponse(response);
      
      // Clear token from localStorage
      clearAuthToken();
      
      return data;
    } catch (error) {
      // Clear token even if logout request fails
      clearAuthToken();
      throw error;
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/profile
   */
  async getProfile(): Promise<{ user: AuthUser }> {
    try {
      const response = await api.get<{ user: AuthUser }>('/auth/profile');
      return handleApiResponse(response);
    } catch (error) {
      // If profile request fails with 401, clear token
      if ((error as any).status === 401) {
        clearAuthToken();
      }
      throw error;
    }
  }

  /**
   * Register new staff user
   * POST /api/auth/register
   */
  async register(userData: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role: 'teacher' | 'hod' | 'finance' | 'admin';
  }): Promise<{ message: string; userId: number }> {
    // Validate required fields
    validateRequiredFields(userData, ['first_name', 'last_name', 'email', 'password', 'role']);
    
    // Validate email format
    if (!validateEmail(userData.email)) {
      throw new Error('Invalid email format');
    }

    // Validate password length
    if (userData.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Validate role
    const validRoles = ['teacher', 'hod', 'finance', 'admin'];
    if (!validRoles.includes(userData.role)) {
      throw new Error('Invalid role. Must be one of: teacher, hod, finance, admin');
    }

    const response = await api.post<{ message: string; userId: number }>('/auth/register', userData);
    return handleApiResponse(response);
  }

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    // Validate email
    if (!email) {
      throw new Error('Email is required');
    }
    
    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return handleApiResponse(response);
  }

  /**
   * Reset password with token
   * POST /api/auth/reset-password
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    // Validate required fields
    if (!token) {
      throw new Error('Reset token is required');
    }
    
    if (!newPassword) {
      throw new Error('New password is required');
    }

    // Validate password length
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const response = await api.post<{ message: string }>('/auth/reset-password', {
      token,
      newPassword,
    });
    return handleApiResponse(response);
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('authToken');
  }

  /**
   * Get current auth token
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  }

  /**
   * Clear authentication data
   */
  clearAuth(): void {
    clearAuthToken();
  }
}

// Create singleton instance
const authAPI = new AuthAPI();

// Export individual methods for backward compatibility
export const login = (credentials: LoginRequest) => authAPI.login(credentials);
export const studentLogin = (credentials: LoginRequest) => authAPI.studentLogin(credentials);
export const logout = () => authAPI.logout();
export const getProfile = () => authAPI.getProfile();
export const register = (userData: Parameters<typeof authAPI.register>[0]) => authAPI.register(userData);
export const forgotPassword = (email: string) => authAPI.forgotPassword(email);
export const resetPassword = (token: string, newPassword: string) => authAPI.resetPassword(token, newPassword);
export const isAuthenticated = () => authAPI.isAuthenticated();
export const getToken = () => authAPI.getToken();
export const clearAuth = () => authAPI.clearAuth();

// Export the class instance as default
export default authAPI;
