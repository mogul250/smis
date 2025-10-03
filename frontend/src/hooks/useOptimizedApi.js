import { useCallback, useRef, useEffect } from 'react';
import { useCache } from './useCache';
import { useAppState } from '../context/AppStateContext';

// Request deduplication
const pendingRequests = new Map();

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle utility
const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Enhanced API hook with caching, deduplication, and optimization
export const useOptimizedApi = (key, fetcher, options = {}) => {
  const {
    enabled = true,
    dedupe = true,
    throttleMs = 0,
    debounceMs = 0,
    retries = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
    optimisticUpdate = false,
    ...cacheOptions
  } = options;

  const { setError, setNotification, optimisticUpdate: appOptimisticUpdate } = useAppState();
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef(null);

  // Create optimized fetcher with retry logic
  const optimizedFetcher = useCallback(async (...args) => {
    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    const requestKey = `${key}-${JSON.stringify(args)}`;
    
    // Request deduplication
    if (dedupe && pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey);
    }

    const executeRequest = async (attempt = 0) => {
      try {
        const result = await fetcher(...args, {
          signal: abortControllerRef.current.signal
        });
        
        retryCountRef.current = 0;
        
        if (onSuccess) {
          onSuccess(result);
        }
        
        return result;
      } catch (error) {
        if (error.name === 'AbortError') {
          throw error;
        }

        if (attempt < retries && error.response?.status >= 500) {
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          return executeRequest(attempt + 1);
        }

        retryCountRef.current = attempt + 1;
        
        if (onError) {
          onError(error);
        } else {
          setError(error.response?.data?.message || error.message);
        }
        
        throw error;
      }
    };

    const promise = executeRequest();
    
    if (dedupe) {
      pendingRequests.set(requestKey, promise);
      
      // Clean up after request completes
      promise.finally(() => {
        pendingRequests.delete(requestKey);
      });
    }

    return promise;
  }, [key, fetcher, dedupe, retries, retryDelay, onSuccess, onError, setError]);

  // Apply throttling/debouncing if specified
  const throttledFetcher = useRef();
  const debouncedFetcher = useRef();

  useEffect(() => {
    if (throttleMs > 0) {
      throttledFetcher.current = throttle(optimizedFetcher, throttleMs);
    }
    
    if (debounceMs > 0) {
      debouncedFetcher.current = debounce(optimizedFetcher, debounceMs);
    }
  }, [optimizedFetcher, throttleMs, debounceMs]);

  const finalFetcher = useCallback((...args) => {
    if (debouncedFetcher.current) {
      return debouncedFetcher.current(...args);
    }
    if (throttledFetcher.current) {
      return throttledFetcher.current(...args);
    }
    return optimizedFetcher(...args);
  }, [optimizedFetcher]);

  // Use cache hook with optimized fetcher
  const cacheResult = useCache(
    enabled ? key : null,
    finalFetcher,
    cacheOptions
  );

  // Enhanced mutate with optimistic updates
  const optimisticMutate = useCallback(async (updateFn, options = {}) => {
    const { showNotification = true, revert = true } = options;
    
    if (optimisticUpdate && typeof updateFn === 'function') {
      let revertFn;
      
      try {
        // Apply optimistic update
        if (revert) {
          const optimisticResult = appOptimisticUpdate(key, updateFn);
          revertFn = optimisticResult.revert;
        }
        
        // Perform actual mutation
        const result = await cacheResult.mutate(updateFn, true);
        
        if (showNotification) {
          setNotification({
            type: 'success',
            message: 'Update successful',
            duration: 3000
          });
        }
        
        return result;
      } catch (error) {
        // Revert optimistic update on error
        if (revertFn) {
          revertFn();
        }
        
        if (showNotification) {
          setNotification({
            type: 'error',
            message: error.response?.data?.message || 'Update failed',
            duration: 5000
          });
        }
        
        throw error;
      }
    } else {
      return cacheResult.mutate(updateFn, options.shouldRevalidate);
    }
  }, [cacheResult.mutate, optimisticUpdate, appOptimisticUpdate, key, setNotification]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...cacheResult,
    mutate: optimisticMutate,
    retryCount: retryCountRef.current,
    abort: () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  };
};

// Hook for batch operations
export const useBatchApi = () => {
  const batchQueue = useRef([]);
  const batchTimeoutRef = useRef(null);
  const { setNotification } = useAppState();

  const addToBatch = useCallback((operation) => {
    batchQueue.current.push(operation);
    
    // Clear existing timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    
    // Set new timeout to execute batch
    batchTimeoutRef.current = setTimeout(async () => {
      const operations = [...batchQueue.current];
      batchQueue.current = [];
      
      try {
        // Execute all operations in parallel
        const results = await Promise.allSettled(
          operations.map(op => op.execute())
        );
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        if (successful > 0) {
          setNotification({
            type: 'success',
            message: `${successful} operations completed successfully`,
            duration: 3000
          });
        }
        
        if (failed > 0) {
          setNotification({
            type: 'error',
            message: `${failed} operations failed`,
            duration: 5000
          });
        }
        
        // Execute callbacks
        operations.forEach((op, index) => {
          const result = results[index];
          if (result.status === 'fulfilled' && op.onSuccess) {
            op.onSuccess(result.value);
          } else if (result.status === 'rejected' && op.onError) {
            op.onError(result.reason);
          }
        });
        
      } catch (error) {
        console.error('Batch execution error:', error);
      }
    }, 100); // 100ms batch window
  }, [setNotification]);

  const executeBatch = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
    
    // Trigger immediate execution
    const operations = [...batchQueue.current];
    batchQueue.current = [];
    
    return Promise.allSettled(
      operations.map(op => op.execute())
    );
  }, []);

  return {
    addToBatch,
    executeBatch,
    pendingCount: batchQueue.current.length
  };
};

// Hook for infinite scrolling/pagination
export const useInfiniteApi = (baseKey, fetcher, options = {}) => {
  const { pageSize = 10, ...otherOptions } = options;
  const pagesRef = useRef([]);
  const hasNextPageRef = useRef(true);

  const fetchPage = useCallback(async (pageIndex = 0) => {
    const result = await fetcher({
      page: pageIndex + 1,
      limit: pageSize
    });
    
    // Update pages
    pagesRef.current[pageIndex] = result;
    
    // Check if there are more pages
    hasNextPageRef.current = result.pagination?.page < result.pagination?.pages;
    
    return result;
  }, [fetcher, pageSize]);

  const {
    data,
    loading,
    error,
    mutate,
    revalidate
  } = useOptimizedApi(
    `${baseKey}-page-0`,
    () => fetchPage(0),
    otherOptions
  );

  const loadNextPage = useCallback(async () => {
    if (!hasNextPageRef.current) return null;
    
    const nextPageIndex = pagesRef.current.length;
    return fetchPage(nextPageIndex);
  }, [fetchPage]);

  const flatData = React.useMemo(() => {
    return pagesRef.current.reduce((acc, page) => {
      if (page?.data) {
        return [...acc, ...page.data];
      }
      return acc;
    }, data?.data || []);
  }, [data, pagesRef.current]);

  return {
    data: flatData,
    loading,
    error,
    hasNextPage: hasNextPageRef.current,
    loadNextPage,
    mutate,
    revalidate
  };
};

export default useOptimizedApi;
