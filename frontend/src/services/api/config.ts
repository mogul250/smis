import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiError } from './types';

// API Configuration
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Create axios instance
const api: AxiosInstance = axios.create(API_CONFIG);

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Get token from localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Log requests in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      });
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  (error: AxiosError) => {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      status: error.response?.status,
      code: error.code,
      details: error.response?.data,
    };

    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      apiError.message = (data as any)?.message || `HTTP ${status} Error`;
      apiError.status = status;

      // Log error in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
          status,
          message: apiError.message,
          data,
        });
      }

      // Handle specific status codes
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('authToken');
            localStorage.removeItem('loginTimestamp');
            // Only redirect if not already on login page and not an auth endpoint
            const isAuthEndpoint = error.config?.url?.includes('/auth/');
            if (window.location.pathname !== '/login' && !isAuthEndpoint) {
              console.log('Session expired, redirecting to login');
              window.location.href = '/login?expired=true';
            }
          }
          apiError.message = 'Session expired. Please log in again.';
          break;

        case 403:
          // Forbidden - insufficient permissions
          apiError.message = 'You do not have permission to perform this action.';
          console.warn('🚫 Permission denied:', error.config?.url);
          break;

        case 404:
          // Not found
          apiError.message = 'The requested resource was not found.';
          break;

        case 409:
          // Conflict - duplicate data
          apiError.message = (data as any)?.message || 'A conflict occurred. The data may already exist.';
          break;

        case 422:
          // Validation error
          apiError.message = (data as any)?.message || 'Validation failed. Please check your input.';
          break;

        case 429:
          // Rate limit exceeded
          apiError.message = 'Too many requests. Please try again later.';
          break;

        case 500:
          // Internal server error
          apiError.message = 'Internal server error. Please try again later.';
          console.error('🔥 Server error:', error.config?.url, data);
          break;

        case 502:
        case 503:
        case 504:
          // Service unavailable
          apiError.message = 'Service temporarily unavailable. Please try again later.';
          break;

        default:
          apiError.message = (data as any)?.message || `HTTP ${status} Error`;
      }
    } else if (error.request) {
      // Network error - no response received
      apiError.message = 'Network error. Please check your internet connection.';
      apiError.code = 'NETWORK_ERROR';
      console.error('🌐 Network error:', error.message);
    } else {
      // Request setup error
      apiError.message = error.message || 'Request configuration error';
      console.error('⚙️ Request setup error:', error.message);
    }

    return Promise.reject(apiError);
  }
);

// Helper function to handle API responses
export const handleApiResponse = <T>(response: AxiosResponse<T>): T => {
  return response.data;
};

// Helper function to create API error
export const createApiError = (message: string, status?: number, code?: string): ApiError => {
  return {
    message,
    status,
    code,
  };
};

// Helper function to check if error is API error
export const isApiError = (error: any): error is ApiError => {
  return error && typeof error.message === 'string';
};

// Helper function to get error message
export const getErrorMessage = (error: any): string => {
  if (isApiError(error)) {
    return error.message;
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('authToken');
};

// Helper function to get current user token
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
};

// Helper function to set auth token
export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
};

// Helper function to clear auth token
export const clearAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
  }
};

// Helper function to convert page to offset for admin endpoints
export const pageToOffset = (page: number, limit: number): number => {
  return Math.max(0, (page - 1) * limit);
};

// Helper function to format date for API
export const formatDateForApi = (date: Date | string): string => {
  if (typeof date === 'string') {
    return date;
  }
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
};

// Helper function to validate required fields
export const validateRequiredFields = (data: Record<string, any>, requiredFields: string[]): void => {
  const missingFields = requiredFields.filter(field => !data[field]);
  if (missingFields.length > 0) {
    throw createApiError(`Missing required fields: ${missingFields.join(', ')}`, 400, 'VALIDATION_ERROR');
  }
};

// Helper function to validate email format
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to validate date format (YYYY-MM-DD)
export const validateDateFormat = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(date);
};

// Helper function to validate positive number
export const validatePositiveNumber = (value: any): boolean => {
  return typeof value === 'number' && value > 0;
};

// Helper function to validate year range
export const validateYear = (year: number): boolean => {
  const currentYear = new Date().getFullYear();
  return year >= 2000 && year <= currentYear + 10;
};

// Helper function to validate attendance status
export const validateAttendanceStatus = (status: string): boolean => {
  return ['present', 'absent', 'late'].includes(status);
};

// Helper function to validate user role
export const validateUserRole = (role: string): boolean => {
  return ['student', 'teacher', 'hod', 'finance', 'admin'].includes(role);
};

// Helper function to validate student status
export const validateStudentStatus = (status: string): boolean => {
  return ['active', 'inactive', 'graduated', 'suspended'].includes(status);
};

export default api;
