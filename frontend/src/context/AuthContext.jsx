import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { authAPI } from '../services/api';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  LOAD_USER: 'LOAD_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.LOAD_USER:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: !!action.payload.user,
        isLoading: false,
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const tokenRefreshInterval = useRef(null);
  const router = useRouter();

  // Load user on app start
  useEffect(() => {
    loadUser();
  }, []);

  // Set up token refresh interval when user is authenticated
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      // Clear any existing interval
      if (tokenRefreshInterval.current) {
        clearInterval(tokenRefreshInterval.current);
      }

      // Set up periodic token validation (every 30 minutes)
      tokenRefreshInterval.current = setInterval(() => {
        validateToken();
      }, 30 * 60 * 1000); // 30 minutes

      return () => {
        if (tokenRefreshInterval.current) {
          clearInterval(tokenRefreshInterval.current);
        }
      };
    }
  }, [state.isAuthenticated, state.user]);

  // Add visibility change listener to validate token when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && state.isAuthenticated) {
        // User returned to tab, validate token
        validateToken();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.isAuthenticated]);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Check if token is expired before making API call
        if (isTokenExpired(token)) {
          console.log('Token expired, clearing auth data');
          localStorage.removeItem('authToken');
          dispatch({
            type: AUTH_ACTIONS.LOAD_USER,
            payload: { user: null },
          });
          return;
        }

        const response = await authAPI.getProfile();
        dispatch({
          type: AUTH_ACTIONS.LOAD_USER,
          payload: { user: response.user },
        });
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOAD_USER,
          payload: { user: null },
        });
      }
    } catch (error) {
      console.error('Error loading user:', error);
      localStorage.removeItem('authToken');
      dispatch({
        type: AUTH_ACTIONS.LOAD_USER,
        payload: { user: null },
      });
    }
  };

  const validateToken = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        logout();
        return;
      }

      // Check if token is expired
      if (isTokenExpired(token)) {
        console.log('Token expired during validation, logging out');
        logout();
        return;
      }

      // Validate token with server
      await authAPI.getProfile();
    } catch (error) {
      console.error('Token validation failed:', error);
      logout();
    }
  };

  const isTokenExpired = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error parsing token:', error);
      return true;
    }
  };

  const login = async (credentials, isStudent = false) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const data = isStudent
        ? await authAPI.studentLogin(credentials)
        : await authAPI.login(credentials);

      const { user, token } = data;

      // Store token with expiration info
      localStorage.setItem('authToken', token);

      // Store login timestamp for session management
      localStorage.setItem('loginTimestamp', Date.now().toString());

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user },
      });

      return { success: true, user };
    } catch (error) {
      const errorMessage = error.message || 'Login failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorMessage },
      });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear token refresh interval
      if (tokenRefreshInterval.current) {
        clearInterval(tokenRefreshInterval.current);
        tokenRefreshInterval.current = null;
      }

      // Clear all auth-related data from localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('loginTimestamp');

      dispatch({ type: AUTH_ACTIONS.LOGOUT });

      // Redirect to login page
      router.push('/login');
    }
  };

  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      await authAPI.register(userData);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorMessage },
      });
      return { success: false, error: errorMessage };
    }
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const checkSessionValidity = () => {
    const token = localStorage.getItem('authToken');
    const loginTimestamp = localStorage.getItem('loginTimestamp');

    if (!token || !loginTimestamp) {
      return false;
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      return false;
    }

    // Check if session is older than 7 days (matching backend token expiration)
    const sessionAge = Date.now() - parseInt(loginTimestamp);
    const maxSessionAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    return sessionAge < maxSessionAge;
  };

  const value = {
    ...state,
    login,
    logout,
    register,
    clearError,
    loadUser,
    validateToken,
    checkSessionValidity,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
