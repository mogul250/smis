import { useState, useEffect, useCallback } from 'react';

export const useApi = (apiFunction, dependencies = [], options = {}) => {
  const { throwOnError = false, fallbackData = null } = options;
  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFunction(...args);
      setData(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      console.warn('API Error:', errorMessage, err);
      
      // For 404 errors, set fallback data instead of throwing
      if (err.response?.status === 404) {
        setData(fallbackData);
        return fallbackData;
      }
      
      // For other errors, either throw or set fallback data based on options
      if (throwOnError) {
        throw err;
      } else {
        setData(fallbackData);
        return fallbackData;
      }
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    if (dependencies.length === 0) {
      execute();
    }
  }, dependencies);

  const refetch = useCallback(() => execute(), [execute]);

  return {
    data,
    loading,
    error,
    execute,
    refetch,
  };
};

export const useAsyncOperation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (operation) => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    loading,
    error,
    execute,
    clearError,
  };
};
