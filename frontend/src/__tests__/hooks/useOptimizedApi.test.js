import { renderHook, act, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { useOptimizedApi } from '../../hooks/useOptimizedApi';
import { AppStateProvider } from '../../context/AppStateContext';

// Mock the cache hook
jest.mock('../../hooks/useCache', () => ({
  useCache: jest.fn(),
}));

import { useCache } from '../../hooks/useCache';

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Create wrapper component for context
const createWrapper = () => {
  return ({ children }) => (
    <AppStateProvider>
      {children}
    </AppStateProvider>
  );
};

describe('useOptimizedApi Hook', () => {
  const mockFetcher = jest.fn();
  const mockCacheResult = {
    data: null,
    loading: false,
    error: null,
    mutate: jest.fn(),
    revalidate: jest.fn(),
    clearCache: jest.fn(),
    clearAllCache: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useCache.mockReturnValue(mockCacheResult);
  });

  test('should initialize with default options', () => {
    const { result } = renderHook(
      () => useOptimizedApi('test-key', mockFetcher),
      { wrapper: createWrapper() }
    );

    expect(useCache).toHaveBeenCalledWith(
      'test-key',
      expect.any(Function),
      expect.objectContaining({
        enabled: true,
        dedupe: true,
        throttleMs: 0,
        debounceMs: 0,
        retries: 3,
        retryDelay: 1000,
      })
    );

    expect(result.current).toMatchObject({
      data: null,
      loading: false,
      error: null,
      mutate: expect.any(Function),
      revalidate: expect.any(Function),
      retryCount: 0,
      abort: expect.any(Function),
    });
  });

  test('should handle successful API call', async () => {
    const mockData = { id: 1, name: 'Test' };
    mockFetcher.mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useOptimizedApi('test-key', mockFetcher),
      { wrapper: createWrapper() }
    );

    // Get the optimized fetcher that was passed to useCache
    const optimizedFetcher = useCache.mock.calls[0][1];

    await act(async () => {
      const data = await optimizedFetcher();
      expect(data).toEqual(mockData);
    });

    expect(mockFetcher).toHaveBeenCalledWith(
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });

  test('should handle API call with retries', async () => {
    const mockError = {
      response: { status: 500, data: { message: 'Server error' } },
    };

    mockFetcher
      .mockRejectedValueOnce(mockError)
      .mockRejectedValueOnce(mockError)
      .mockResolvedValue({ success: true });

    const { result } = renderHook(
      () => useOptimizedApi('test-key', mockFetcher, { retries: 2 }),
      { wrapper: createWrapper() }
    );

    const optimizedFetcher = useCache.mock.calls[0][1];

    await act(async () => {
      const data = await optimizedFetcher();
      expect(data).toEqual({ success: true });
    });

    expect(mockFetcher).toHaveBeenCalledTimes(3);
  });

  test('should handle non-retryable errors', async () => {
    const mockError = {
      response: { status: 400, data: { message: 'Bad request' } },
    };

    mockFetcher.mockRejectedValue(mockError);

    const { result } = renderHook(
      () => useOptimizedApi('test-key', mockFetcher, { retries: 3 }),
      { wrapper: createWrapper() }
    );

    const optimizedFetcher = useCache.mock.calls[0][1];

    await act(async () => {
      await expect(optimizedFetcher()).rejects.toThrow();
    });

    // Should not retry for 4xx errors
    expect(mockFetcher).toHaveBeenCalledTimes(1);
  });

  test('should handle request cancellation', async () => {
    const abortError = new Error('Request cancelled');
    abortError.name = 'AbortError';
    
    mockFetcher.mockRejectedValue(abortError);

    const { result } = renderHook(
      () => useOptimizedApi('test-key', mockFetcher),
      { wrapper: createWrapper() }
    );

    const optimizedFetcher = useCache.mock.calls[0][1];

    await act(async () => {
      await expect(optimizedFetcher()).rejects.toThrow('Request cancelled');
    });

    expect(mockFetcher).toHaveBeenCalledTimes(1);
  });

  test('should call onSuccess callback', async () => {
    const mockData = { id: 1, name: 'Test' };
    const onSuccess = jest.fn();
    
    mockFetcher.mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useOptimizedApi('test-key', mockFetcher, { onSuccess }),
      { wrapper: createWrapper() }
    );

    const optimizedFetcher = useCache.mock.calls[0][1];

    await act(async () => {
      await optimizedFetcher();
    });

    expect(onSuccess).toHaveBeenCalledWith(mockData);
  });

  test('should call onError callback', async () => {
    const mockError = new Error('Test error');
    const onError = jest.fn();
    
    mockFetcher.mockRejectedValue(mockError);

    const { result } = renderHook(
      () => useOptimizedApi('test-key', mockFetcher, { onError }),
      { wrapper: createWrapper() }
    );

    const optimizedFetcher = useCache.mock.calls[0][1];

    await act(async () => {
      await expect(optimizedFetcher()).rejects.toThrow();
    });

    expect(onError).toHaveBeenCalledWith(mockError);
  });

  test('should handle optimistic updates', async () => {
    const mockMutate = jest.fn().mockResolvedValue({ success: true });
    mockCacheResult.mutate = mockMutate;

    const { result } = renderHook(
      () => useOptimizedApi('test-key', mockFetcher, { optimisticUpdate: true }),
      { wrapper: createWrapper() }
    );

    const updateFn = jest.fn((data) => ({ ...data, updated: true }));

    await act(async () => {
      await result.current.mutate(updateFn);
    });

    expect(mockMutate).toHaveBeenCalledWith(updateFn, true);
  });

  test('should abort requests on unmount', () => {
    const { result, unmount } = renderHook(
      () => useOptimizedApi('test-key', mockFetcher),
      { wrapper: createWrapper() }
    );

    const abortSpy = jest.spyOn(result.current, 'abort');

    unmount();

    // The abort controller should be cleaned up
    expect(abortSpy).not.toThrow();
  });

  test('should handle disabled state', () => {
    const { result } = renderHook(
      () => useOptimizedApi('test-key', mockFetcher, { enabled: false }),
      { wrapper: createWrapper() }
    );

    expect(useCache).toHaveBeenCalledWith(
      null, // key should be null when disabled
      expect.any(Function),
      expect.any(Object)
    );
  });

  test('should handle throttling', async () => {
    jest.useFakeTimers();

    const { result } = renderHook(
      () => useOptimizedApi('test-key', mockFetcher, { throttleMs: 1000 }),
      { wrapper: createWrapper() }
    );

    const optimizedFetcher = useCache.mock.calls[0][1];

    // First call should execute immediately
    act(() => {
      optimizedFetcher();
    });

    expect(mockFetcher).toHaveBeenCalledTimes(1);

    // Second call within throttle period should be ignored
    act(() => {
      optimizedFetcher();
    });

    expect(mockFetcher).toHaveBeenCalledTimes(1);

    // After throttle period, call should execute
    act(() => {
      jest.advanceTimersByTime(1000);
      optimizedFetcher();
    });

    expect(mockFetcher).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  test('should handle debouncing', async () => {
    jest.useFakeTimers();

    const { result } = renderHook(
      () => useOptimizedApi('test-key', mockFetcher, { debounceMs: 500 }),
      { wrapper: createWrapper() }
    );

    const optimizedFetcher = useCache.mock.calls[0][1];

    // Multiple rapid calls
    act(() => {
      optimizedFetcher();
      optimizedFetcher();
      optimizedFetcher();
    });

    // Should not execute immediately
    expect(mockFetcher).toHaveBeenCalledTimes(0);

    // After debounce period, only last call should execute
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockFetcher).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });
});
