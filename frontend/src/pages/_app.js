import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { useEffect } from 'react';
import { useWebVitalsMonitor, useMemoryMonitor } from '../hooks/usePerformanceMonitor';
import { initializeA11y } from '../utils/accessibility';
import { registerServiceWorker, preloadCriticalResources, optimizeCriticalRenderingPath } from '../utils/performance';

function MyApp({ Component, pageProps }) {
  // Initialize performance monitoring
  useWebVitalsMonitor();
  useMemoryMonitor();

  useEffect(() => {
    // Initialize accessibility features
    initializeA11y();

    // Register service worker for caching
    registerServiceWorker();

    // Preload critical resources
    preloadCriticalResources();

    // Optimize critical rendering path
    optimizeCriticalRenderingPath();

    // Performance monitoring
    if (typeof window !== 'undefined') {
      // Report Core Web Vitals to analytics
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        function sendToAnalytics(metric) {
          // Send to your analytics service
          console.log('Web Vital:', metric);

          if (typeof gtag !== 'undefined') {
            gtag('event', metric.name, {
              value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
              event_category: 'web_vitals',
              event_label: metric.id,
              non_interaction: true,
            });
          }
        }

        getCLS(sendToAnalytics);
        getFID(sendToAnalytics);
        getFCP(sendToAnalytics);
        getLCP(sendToAnalytics);
        getTTFB(sendToAnalytics);
      }).catch(() => {
        console.warn('Web Vitals library not available');
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
