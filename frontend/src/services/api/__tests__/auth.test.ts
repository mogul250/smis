import { jest } from '@jest/globals';
import axios from 'axios';
import authAPI, { 
  login, 
  studentLogin, 
  logout, 
  getProfile, 
  register, 
  forgotPassword, 
  resetPassword 
} from '../auth';
import { LoginRequest, LoginResponse } from '../types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    pathname: '/dashboard',
  },
  writable: true,
});

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-token');
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Success Cases', () => {
    it('should successfully login staff user', async () => {
      const credentials: LoginRequest = {
        email: 'teacher@example.com',
        password: 'password123',
      };

      const mockResponse: LoginResponse = {
        message: 'Login successful',
        user: {
          id: 1,
          email: 'teacher@example.com',
          role: 'teacher',
          userType: 'staff',
        },
        token: 'mock-jwt-token',
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await login(credentials);

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'mock-jwt-token');
      expect(result).toEqual(mockResponse);
    });

    it('should successfully login student', async () => {
      const credentials: LoginRequest = {
        email: 'student@example.com',
        password: 'password123',
      };

      const mockResponse: LoginResponse = {
        message: 'Login successful',
        user: {
          id: 1,
          email: 'student@example.com',
          role: 'student',
          userType: 'student',
        },
        token: 'mock-jwt-token',
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await studentLogin(credentials);

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/student/login', credentials);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'mock-jwt-token');
      expect(result).toEqual(mockResponse);
    });

    it('should successfully logout', async () => {
      const mockResponse = { message: 'Logout successful' };
      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await logout();

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/logout');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(result).toEqual(mockResponse);
    });

    it('should successfully get profile', async () => {
      const mockResponse = {
        user: {
          id: 1,
          email: 'user@example.com',
          role: 'teacher',
          userType: 'staff',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await getProfile();

      expect(mockedAxios.get).toHaveBeenCalledWith('/auth/profile');
      expect(result).toEqual(mockResponse);
    });

    it('should successfully register user', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'teacher' as const,
      };

      const mockResponse = {
        message: 'User registered successfully',
        userId: 1,
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await register(userData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(result).toEqual(mockResponse);
    });

    it('should successfully request password reset', async () => {
      const email = 'user@example.com';
      const mockResponse = {
        message: 'If the email exists, a reset link has been sent',
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await forgotPassword(email);

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/forgot-password', { email });
      expect(result).toEqual(mockResponse);
    });

    it('should successfully reset password', async () => {
      const token = 'reset-token';
      const newPassword = 'newpassword123';
      const mockResponse = {
        message: 'Password reset successfully',
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await resetPassword(token, newPassword);

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/reset-password', {
        token,
        newPassword,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error Cases', () => {
    it('should handle 400 Bad Request - missing fields', async () => {
      const credentials = {
        email: '',
        password: '',
      };

      await expect(login(credentials)).rejects.toThrow('Missing required fields: email, password');
    });

    it('should handle 400 Bad Request - invalid email format', async () => {
      const credentials = {
        email: 'invalid-email',
        password: 'password123',
      };

      await expect(login(credentials)).rejects.toThrow('Invalid email format');
    });

    it('should handle 401 Unauthorized - invalid credentials', async () => {
      const credentials: LoginRequest = {
        email: 'user@example.com',
        password: 'wrongpassword',
      };

      const errorResponse = {
        response: {
          status: 401,
          data: { message: 'Invalid credentials' },
        },
      };

      mockedAxios.post.mockRejectedValueOnce(errorResponse);

      await expect(login(credentials)).rejects.toMatchObject({
        status: 401,
        message: 'Invalid credentials',
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    });

    it('should handle 401 on profile request and clear token', async () => {
      const errorResponse = {
        response: {
          status: 401,
          data: { message: 'Token expired' },
        },
      };

      mockedAxios.get.mockRejectedValueOnce(errorResponse);

      await expect(getProfile()).rejects.toMatchObject({
        status: 401,
        message: 'Token expired',
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    });

    it('should handle 500 Internal Server Error', async () => {
      const credentials: LoginRequest = {
        email: 'user@example.com',
        password: 'password123',
      };

      const errorResponse = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };

      mockedAxios.post.mockRejectedValueOnce(errorResponse);

      await expect(login(credentials)).rejects.toMatchObject({
        status: 500,
        message: 'Internal server error',
      });
    });

    it('should validate password length for registration', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password: '123', // Too short
        role: 'teacher' as const,
      };

      await expect(register(userData)).rejects.toThrow('Password must be at least 6 characters long');
    });

    it('should validate role for registration', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'invalid-role' as any,
      };

      await expect(register(userData)).rejects.toThrow('Invalid role. Must be one of: teacher, hod, finance, admin');
    });

    it('should validate password length for reset', async () => {
      const token = 'reset-token';
      const newPassword = '123'; // Too short

      await expect(resetPassword(token, newPassword)).rejects.toThrow('Password must be at least 6 characters long');
    });
  });

  describe('Edge Cases', () => {
    it('should handle network timeout', async () => {
      const credentials: LoginRequest = {
        email: 'user@example.com',
        password: 'password123',
      };

      const networkError = {
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      };

      mockedAxios.post.mockRejectedValueOnce(networkError);

      await expect(login(credentials)).rejects.toMatchObject({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      });
    });

    it('should handle malformed response', async () => {
      const credentials: LoginRequest = {
        email: 'user@example.com',
        password: 'password123',
      };

      // Response without required fields
      const malformedResponse = {
        data: {
          message: 'Login successful',
          // Missing user and token fields
        },
      };

      mockedAxios.post.mockResolvedValueOnce(malformedResponse);

      const result = await login(credentials);
      expect(result).toEqual(malformedResponse.data);
    });

    it('should clear token on logout even if request fails', async () => {
      const errorResponse = {
        response: {
          status: 500,
          data: { message: 'Server error' },
        },
      };

      mockedAxios.post.mockRejectedValueOnce(errorResponse);

      await expect(logout()).rejects.toMatchObject({
        status: 500,
        message: 'Server error',
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    });

    it('should handle empty email for forgot password', async () => {
      await expect(forgotPassword('')).rejects.toThrow('Email is required');
    });

    it('should handle empty token for reset password', async () => {
      await expect(resetPassword('', 'newpassword')).rejects.toThrow('Reset token is required');
    });

    it('should handle empty new password for reset', async () => {
      await expect(resetPassword('token', '')).rejects.toThrow('New password is required');
    });
  });

  describe('Authentication State', () => {
    it('should check if user is authenticated', () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      expect(authAPI.isAuthenticated()).toBe(true);

      localStorageMock.getItem.mockReturnValue(null);
      expect(authAPI.isAuthenticated()).toBe(false);
    });

    it('should get current token', () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      expect(authAPI.getToken()).toBe('mock-token');

      localStorageMock.getItem.mockReturnValue(null);
      expect(authAPI.getToken()).toBe(null);
    });

    it('should clear authentication data', () => {
      authAPI.clearAuth();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    });
  });
});
