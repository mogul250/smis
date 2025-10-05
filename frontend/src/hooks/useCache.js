import { useState, useEffect, useCallback, useRef } from 'react';

// Simple in-memory cache with TTL support
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  set(key, data, ttl = 300000) { // Default 5 minutes TTL
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set data
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl);

    this.timers.set(key, timer);
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key) {
    this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  clear() {
    this.cache.clear();
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  has(key) {
    return this.cache.has(key) && this.get(key) !== null;
  }

  size() {
    return this.cache.size;
  }
}

// Global cache instance
const globalCache = new CacheManager();

// Hook for caching API responses
export const useCache = (key, fetcher, options = {}) => {
  const {
    ttl = 300000, // 5 minutes default
    staleWhileRevalidate = false,
    revalidateOnFocus = false,
    revalidateOnReconnect = true
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  
  const fetcherRef = useRef(fetcher);
  const keyRef = useRef(key);

  // Update refs when props change
  useEffect(() => {
    fetcherRef.current = fetcher;
    keyRef.current = key;
  }, [fetcher, key]);

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setIsValidating(true);
      setError(null);

      const result = await fetcherRef.current();
      
      // Cache the result
      globalCache.set(keyRef.current, result, ttl);
      setData(result);
      
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
      setIsValidating(false);
    }
  }, [ttl]);

  const mutate = useCallback(async (newData, shouldRevalidate = true) => {
    if (typeof newData === 'function') {
      // Optimistic update
      const currentData = data;
      try {
        const updatedData = newData(currentData);
        setData(updatedData);
        globalCache.set(keyRef.current, updatedData, ttl);
        
        if (shouldRevalidate) {
          await fetchData(false);
        }
      } catch (err) {
        // Rollback on error
        setData(currentData);
        globalCache.set(keyRef.current, currentData, ttl);
        throw err;
      }
    } else {
      // Direct update
      setData(newData);
      globalCache.set(keyRef.current, newData, ttl);
      
      if (shouldRevalidate) {
        await fetchData(false);
      }
    }
  }, [data, ttl, fetchData]);

  const revalidate = useCallback(() => {
    return fetchData(false);
  }, [fetchData]);

  // Initial load
  useEffect(() => {
    const cachedData = globalCache.get(key);
    
    if (cachedData && !staleWhileRevalidate) {
      setData(cachedData);
      setLoading(false);
    } else {
      if (cachedData && staleWhileRevalidate) {
        setData(cachedData);
        setLoading(false);
        // Revalidate in background
        fetchData(false);
      } else {
        fetchData();
      }
    }
  }, [key, fetchData, staleWhileRevalidate]);

  // Revalidate on window focus
  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => {
      if (!document.hidden) {
        revalidate();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [revalidate, revalidateOnFocus]);

  // Revalidate on network reconnect
  useEffect(() => {
    if (!revalidateOnReconnect) return;

    const handleOnline = () => revalidate();
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [revalidate, revalidateOnReconnect]);

  return {
    data,
    loading,
    error,
    isValidating,
    mutate,
    revalidate,
    // Cache utilities
    clearCache: () => globalCache.delete(key),
    clearAllCache: () => globalCache.clear()
  };
};

// Hook for invalidating cache entries
export const useCacheInvalidation = () => {
  const invalidate = useCallback((keys) => {
    if (Array.isArray(keys)) {
      keys.forEach(key => globalCache.delete(key));
    } else {
      globalCache.delete(keys);
    }
  }, []);

  const invalidatePattern = useCallback((pattern) => {
    const regex = new RegExp(pattern);
    const keysToDelete = [];
    
    globalCache.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => globalCache.delete(key));
  }, []);

  return { invalidate, invalidatePattern };
};

// Hook for cache statistics
export const useCacheStats = () => {
  const [stats, setStats] = useState({
    size: 0,
    hitRate: 0,
    keys: []
  });

  const updateStats = useCallback(() => {
    setStats({
      size: globalCache.size(),
      keys: Array.from(globalCache.cache.keys())
    });
  }, []);

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [updateStats]);

  return stats;
};

export default useCache;
