import { useEffect, useRef, useCallback } from 'react';

// Performance monitoring hook
export const usePerformanceMonitor = (componentName) => {
  const renderStartTime = useRef(null);
  const mountTime = useRef(null);

  useEffect(() => {
    mountTime.current = performance.now();
    
    return () => {
      // Component unmount
      if (mountTime.current) {
        const unmountTime = performance.now();
        const totalMountTime = unmountTime - mountTime.current;
        
        // Log performance metrics
        console.log(`[Performance] ${componentName} total mount time: ${totalMountTime.toFixed(2)}ms`);
        
        // Report to analytics if needed
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'component_performance', {
            component_name: componentName,
            mount_time: totalMountTime,
            event_category: 'performance'
          });
        }
      }
    };
  }, [componentName]);

  const measureRender = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRenderMeasurement = useCallback(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      console.log(`[Performance] ${componentName} render time: ${renderTime.toFixed(2)}ms`);
      
      // Warn about slow renders
      if (renderTime > 16) { // 60fps threshold
        console.warn(`[Performance] Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
      
      renderStartTime.current = null;
    }
  }, [componentName]);

  return { measureRender, endRenderMeasurement };
};

// API performance monitoring hook
export const useApiPerformanceMonitor = () => {
  const measureApiCall = useCallback((endpoint, method = 'GET') => {
    const startTime = performance.now();
    
    return {
      end: (success = true, statusCode = null) => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`[API Performance] ${method} ${endpoint}: ${duration.toFixed(2)}ms`);
        
        // Report slow API calls
        if (duration > 1000) {
          console.warn(`[API Performance] Slow API call detected: ${method} ${endpoint} took ${duration.toFixed(2)}ms`);
        }
        
        // Report to analytics
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'api_performance', {
            endpoint,
            method,
            duration,
            success,
            status_code: statusCode,
            event_category: 'performance'
          });
        }
        
        return duration;
      }
    };
  }, []);

  return { measureApiCall };
};

// Memory usage monitoring hook
export const useMemoryMonitor = (interval = 30000) => {
  useEffect(() => {
    if (!('memory' in performance)) {
      console.warn('[Performance] Memory API not supported');
      return;
    }

    const checkMemory = () => {
      const memory = performance.memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
      const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);
      
      console.log(`[Memory] Used: ${usedMB}MB, Total: ${totalMB}MB, Limit: ${limitMB}MB`);
      
      // Warn about high memory usage
      const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      if (usagePercentage > 80) {
        console.warn(`[Memory] High memory usage detected: ${usagePercentage.toFixed(1)}%`);
      }
      
      // Report to analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'memory_usage', {
          used_mb: usedMB,
          total_mb: totalMB,
          usage_percentage: usagePercentage,
          event_category: 'performance'
        });
      }
    };

    const intervalId = setInterval(checkMemory, interval);
    checkMemory(); // Initial check

    return () => clearInterval(intervalId);
  }, [interval]);
};

// Page load performance monitoring
export const usePageLoadMonitor = (pageName) => {
  useEffect(() => {
    const measurePageLoad = () => {
      if ('performance' in window && 'getEntriesByType' in performance) {
        const navigation = performance.getEntriesByType('navigation')[0];
        
        if (navigation) {
          const metrics = {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            request: navigation.responseStart - navigation.requestStart,
            response: navigation.responseEnd - navigation.responseStart,
            dom: navigation.domContentLoadedEventEnd - navigation.responseEnd,
            load: navigation.loadEventEnd - navigation.loadEventStart,
            total: navigation.loadEventEnd - navigation.navigationStart
          };
          
          console.log(`[Page Load] ${pageName} performance:`, metrics);
          
          // Report to analytics
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'page_load_performance', {
              page_name: pageName,
              ...metrics,
              event_category: 'performance'
            });
          }
          
          // Warn about slow page loads
          if (metrics.total > 3000) {
            console.warn(`[Page Load] Slow page load detected for ${pageName}: ${metrics.total}ms`);
          }
        }
      }
    };

    // Measure after page is fully loaded
    if (document.readyState === 'complete') {
      measurePageLoad();
    } else {
      window.addEventListener('load', measurePageLoad);
      return () => window.removeEventListener('load', measurePageLoad);
    }
  }, [pageName]);
};

// Core Web Vitals monitoring
export const useWebVitalsMonitor = () => {
  useEffect(() => {
    const reportWebVitals = (metric) => {
      console.log(`[Web Vitals] ${metric.name}: ${metric.value}`);
      
      // Report to analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', metric.name, {
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          event_category: 'web_vitals',
          event_label: metric.id,
          non_interaction: true,
        });
      }
    };

    // Import and use web-vitals library if available
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(reportWebVitals);
        getFID(reportWebVitals);
        getFCP(reportWebVitals);
        getLCP(reportWebVitals);
        getTTFB(reportWebVitals);
      }).catch(() => {
        console.warn('[Web Vitals] web-vitals library not available');
      });
    }
  }, []);
};

// Bundle size monitoring
export const useBundleMonitor = () => {
  useEffect(() => {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const resources = performance.getEntriesByType('resource');
      
      const jsResources = resources.filter(resource => 
        resource.name.includes('.js') && 
        (resource.name.includes('/_next/') || resource.name.includes('/static/'))
      );
      
      const totalJSSize = jsResources.reduce((total, resource) => {
        return total + (resource.transferSize || 0);
      }, 0);
      
      const totalJSSizeMB = (totalJSSize / 1048576).toFixed(2);
      
      console.log(`[Bundle] Total JS bundle size: ${totalJSSizeMB}MB`);
      
      // Warn about large bundles
      if (totalJSSize > 1048576) { // 1MB
        console.warn(`[Bundle] Large JS bundle detected: ${totalJSSizeMB}MB`);
      }
      
      // Report to analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'bundle_size', {
          size_mb: parseFloat(totalJSSizeMB),
          resource_count: jsResources.length,
          event_category: 'performance'
        });
      }
    }
  }, []);
};
