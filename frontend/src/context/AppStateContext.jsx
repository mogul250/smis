import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { useCacheInvalidation } from '../hooks/useCache';

// Action types
const APP_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_NOTIFICATION: 'SET_NOTIFICATION',
  CLEAR_NOTIFICATION: 'CLEAR_NOTIFICATION',
  UPDATE_USER_DATA: 'UPDATE_USER_DATA',
  SET_THEME: 'SET_THEME',
  SET_SIDEBAR_COLLAPSED: 'SET_SIDEBAR_COLLAPSED',
  SET_BREADCRUMBS: 'SET_BREADCRUMBS',
  INVALIDATE_CACHE: 'INVALIDATE_CACHE',
  SET_OFFLINE_STATUS: 'SET_OFFLINE_STATUS'
};

// Initial state
const initialState = {
  loading: false,
  error: null,
  notification: null,
  theme: 'light',
  sidebarCollapsed: false,
  breadcrumbs: [],
  isOffline: false,
  userData: {
    users: null,
    students: null,
    departments: null,
    stats: null
  }
};

// Reducer
const appStateReducer = (state, action) => {
  switch (action.type) {
    case APP_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case APP_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case APP_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case APP_ACTIONS.SET_NOTIFICATION:
      return {
        ...state,
        notification: action.payload
      };

    case APP_ACTIONS.CLEAR_NOTIFICATION:
      return {
        ...state,
        notification: null
      };

    case APP_ACTIONS.UPDATE_USER_DATA:
      return {
        ...state,
        userData: {
          ...state.userData,
          [action.payload.key]: action.payload.data
        }
      };

    case APP_ACTIONS.SET_THEME:
      return {
        ...state,
        theme: action.payload
      };

    case APP_ACTIONS.SET_SIDEBAR_COLLAPSED:
      return {
        ...state,
        sidebarCollapsed: action.payload
      };

    case APP_ACTIONS.SET_BREADCRUMBS:
      return {
        ...state,
        breadcrumbs: action.payload
      };

    case APP_ACTIONS.SET_OFFLINE_STATUS:
      return {
        ...state,
        isOffline: action.payload
      };

    default:
      return state;
  }
};

// Create context
const AppStateContext = createContext();

// Provider component
export const AppStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appStateReducer, initialState);
  const { invalidate, invalidatePattern } = useCacheInvalidation();

  // Actions
  const setLoading = useCallback((loading) => {
    dispatch({ type: APP_ACTIONS.SET_LOADING, payload: loading });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: APP_ACTIONS.SET_ERROR, payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: APP_ACTIONS.CLEAR_ERROR });
  }, []);

  const setNotification = useCallback((notification) => {
    dispatch({ type: APP_ACTIONS.SET_NOTIFICATION, payload: notification });
    
    // Auto-clear notification after 5 seconds
    if (notification && notification.autoClose !== false) {
      setTimeout(() => {
        dispatch({ type: APP_ACTIONS.CLEAR_NOTIFICATION });
      }, notification.duration || 5000);
    }
  }, []);

  const clearNotification = useCallback(() => {
    dispatch({ type: APP_ACTIONS.CLEAR_NOTIFICATION });
  }, []);

  const updateUserData = useCallback((key, data) => {
    dispatch({ 
      type: APP_ACTIONS.UPDATE_USER_DATA, 
      payload: { key, data } 
    });
  }, []);

  const setTheme = useCallback((theme) => {
    dispatch({ type: APP_ACTIONS.SET_THEME, payload: theme });
    localStorage.setItem('theme', theme);
  }, []);

  const setSidebarCollapsed = useCallback((collapsed) => {
    dispatch({ type: APP_ACTIONS.SET_SIDEBAR_COLLAPSED, payload: collapsed });
    localStorage.setItem('sidebarCollapsed', collapsed.toString());
  }, []);

  const setBreadcrumbs = useCallback((breadcrumbs) => {
    dispatch({ type: APP_ACTIONS.SET_BREADCRUMBS, payload: breadcrumbs });
  }, []);

  const setOfflineStatus = useCallback((isOffline) => {
    dispatch({ type: APP_ACTIONS.SET_OFFLINE_STATUS, payload: isOffline });
  }, []);

  // Cache management
  const invalidateCache = useCallback((keys) => {
    if (Array.isArray(keys)) {
      keys.forEach(key => invalidate(key));
    } else {
      invalidate(keys);
    }
  }, [invalidate]);

  const invalidateCachePattern = useCallback((pattern) => {
    invalidatePattern(pattern);
  }, [invalidatePattern]);

  // Optimistic updates
  const optimisticUpdate = useCallback((key, updateFn, revertFn) => {
    const currentData = state.userData[key];
    
    try {
      // Apply optimistic update
      const updatedData = updateFn(currentData);
      updateUserData(key, updatedData);
      
      return {
        revert: () => {
          if (revertFn) {
            updateUserData(key, revertFn(currentData));
          } else {
            updateUserData(key, currentData);
          }
        }
      };
    } catch (error) {
      console.error('Optimistic update failed:', error);
      return { revert: () => {} };
    }
  }, [state.userData, updateUserData]);

  // Network status monitoring
  React.useEffect(() => {
    const handleOnline = () => setOfflineStatus(false);
    const handleOffline = () => setOfflineStatus(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial status
    setOfflineStatus(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOfflineStatus]);

  // Load persisted state
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');

    if (savedTheme) {
      setTheme(savedTheme);
    }

    if (savedSidebarState) {
      setSidebarCollapsed(savedSidebarState === 'true');
    }
  }, [setTheme, setSidebarCollapsed]);

  const value = {
    ...state,
    // Actions
    setLoading,
    setError,
    clearError,
    setNotification,
    clearNotification,
    updateUserData,
    setTheme,
    setSidebarCollapsed,
    setBreadcrumbs,
    setOfflineStatus,
    // Cache management
    invalidateCache,
    invalidateCachePattern,
    // Optimistic updates
    optimisticUpdate
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

// Custom hook to use app state
export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

export default AppStateContext;
