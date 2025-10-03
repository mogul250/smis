// Performance optimization utilities for the frontend

// Image lazy loading and optimization
export class ImageOptimizer {
  constructor() {
    this.observer = null;
    this.images = new Set();
    this.init();
  }

  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadImage(entry.target);
              this.observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '50px 0px',
          threshold: 0.01
        }
      );
    }
  }

  observe(img) {
    if (this.observer) {
      this.images.add(img);
      this.observer.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img);
    }
  }

  loadImage(img) {
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      img.classList.remove('lazy');
      img.classList.add('loaded');
    }
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.images.clear();
  }
}

// Bundle splitting and code splitting utilities
export const loadComponent = (componentPath) => {
  return import(componentPath).catch(error => {
    console.error(`Failed to load component: ${componentPath}`, error);
    // Return a fallback component
    return { default: () => null };
  });
};

// Resource preloading
export class ResourcePreloader {
  constructor() {
    this.preloadedResources = new Set();
  }

  preloadScript(src, priority = 'low') {
    if (this.preloadedResources.has(src)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = src;
    link.fetchPriority = priority;
    
    document.head.appendChild(link);
    this.preloadedResources.add(src);
  }

  preloadStyle(href, priority = 'low') {
    if (this.preloadedResources.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    link.fetchPriority = priority;
    
    document.head.appendChild(link);
    this.preloadedResources.add(href);
  }

  preloadImage(src, priority = 'low') {
    if (this.preloadedResources.has(src)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    link.fetchPriority = priority;
    
    document.head.appendChild(link);
    this.preloadedResources.add(src);
  }

  preloadFont(href, type = 'font/woff2') {
    if (this.preloadedResources.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = type;
    link.href = href;
    link.crossOrigin = 'anonymous';
    
    document.head.appendChild(link);
    this.preloadedResources.add(href);
  }
}

// Performance monitoring
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: null,
      firstContentfulPaint: null,
      largestContentfulPaint: null,
      firstInputDelay: null,
      cumulativeLayoutShift: null,
      timeToInteractive: null
    };
    
    this.init();
  }

  init() {
    // Measure page load time
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      this.metrics.pageLoad = navigation.loadEventEnd - navigation.fetchStart;
    });

    // Measure Core Web Vitals
    this.measureCoreWebVitals();
    
    // Measure custom metrics
    this.measureCustomMetrics();
  }

  measureCoreWebVitals() {
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.firstContentfulPaint = entry.startTime;
          }
        });
      }).observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.largestContentfulPaint = lastEntry.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.cumulativeLayoutShift = clsValue;
          }
        });
      }).observe({ entryTypes: ['layout-shift'] });
    }
  }

  measureCustomMetrics() {
    // Time to Interactive (simplified)
    const checkInteractive = () => {
      if (document.readyState === 'complete') {
        this.metrics.timeToInteractive = performance.now();
      } else {
        setTimeout(checkInteractive, 100);
      }
    };
    checkInteractive();
  }

  getMetrics() {
    return { ...this.metrics };
  }

  reportMetrics() {
    const metrics = this.getMetrics();
    
    // Send to analytics service
    if (typeof gtag !== 'undefined') {
      Object.entries(metrics).forEach(([name, value]) => {
        if (value !== null) {
          gtag('event', 'performance_metric', {
            metric_name: name,
            metric_value: Math.round(value),
            custom_parameter: 'performance'
          });
        }
      });
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.table(metrics);
    }

    return metrics;
  }
}

// Virtual scrolling for large lists
export class VirtualScroller {
  constructor(container, itemHeight, renderItem, totalItems) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.renderItem = renderItem;
    this.totalItems = totalItems;
    this.visibleItems = Math.ceil(container.clientHeight / itemHeight) + 2;
    this.startIndex = 0;
    
    this.init();
  }

  init() {
    this.container.style.height = `${this.totalItems * this.itemHeight}px`;
    this.container.style.position = 'relative';
    
    this.viewport = document.createElement('div');
    this.viewport.style.position = 'absolute';
    this.viewport.style.top = '0';
    this.viewport.style.left = '0';
    this.viewport.style.right = '0';
    
    this.container.appendChild(this.viewport);
    
    this.container.addEventListener('scroll', this.handleScroll.bind(this));
    this.render();
  }

  handleScroll() {
    const scrollTop = this.container.scrollTop;
    const newStartIndex = Math.floor(scrollTop / this.itemHeight);
    
    if (newStartIndex !== this.startIndex) {
      this.startIndex = newStartIndex;
      this.render();
    }
  }

  render() {
    const endIndex = Math.min(this.startIndex + this.visibleItems, this.totalItems);
    
    this.viewport.innerHTML = '';
    this.viewport.style.transform = `translateY(${this.startIndex * this.itemHeight}px)`;
    
    for (let i = this.startIndex; i < endIndex; i++) {
      const item = this.renderItem(i);
      item.style.height = `${this.itemHeight}px`;
      this.viewport.appendChild(item);
    }
  }

  updateTotalItems(newTotal) {
    this.totalItems = newTotal;
    this.container.style.height = `${this.totalItems * this.itemHeight}px`;
    this.render();
  }
}

// Memory management utilities
export class MemoryManager {
  constructor() {
    this.observers = new Set();
    this.timers = new Set();
    this.eventListeners = new Map();
  }

  addObserver(observer) {
    this.observers.add(observer);
    return observer;
  }

  addTimer(timer) {
    this.timers.add(timer);
    return timer;
  }

  addEventListener(element, event, handler, options) {
    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, new Map());
    }
    
    const elementListeners = this.eventListeners.get(element);
    if (!elementListeners.has(event)) {
      elementListeners.set(event, new Set());
    }
    
    elementListeners.get(event).add(handler);
    element.addEventListener(event, handler, options);
  }

  cleanup() {
    // Disconnect observers
    this.observers.forEach(observer => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect();
      }
    });
    this.observers.clear();

    // Clear timers
    this.timers.forEach(timer => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    this.timers.clear();

    // Remove event listeners
    this.eventListeners.forEach((eventMap, element) => {
      eventMap.forEach((handlers, event) => {
        handlers.forEach(handler => {
          element.removeEventListener(event, handler);
        });
      });
    });
    this.eventListeners.clear();
  }
}

// Service Worker utilities
export class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.isSupported = 'serviceWorker' in navigator;
  }

  async register(scriptURL, options = {}) {
    if (!this.isSupported) {
      console.warn('Service Workers are not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register(scriptURL, options);
      console.log('Service Worker registered successfully');
      
      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available
            this.showUpdateNotification();
          }
        });
      });

      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  showUpdateNotification() {
    // Show user notification about available update
    if (confirm('New version available! Reload to update?')) {
      window.location.reload();
    }
  }

  async unregister() {
    if (this.registration) {
      await this.registration.unregister();
      this.registration = null;
    }
  }
}

// Bundle analyzer utilities
export const analyzeBundle = () => {
  if (process.env.NODE_ENV === 'development') {
    // Analyze chunk sizes
    const chunks = [];
    const scripts = document.querySelectorAll('script[src]');
    
    scripts.forEach(script => {
      const src = script.src;
      if (src.includes('chunk') || src.includes('bundle')) {
        chunks.push({
          name: src.split('/').pop(),
          url: src
        });
      }
    });

    console.group('Bundle Analysis');
    console.table(chunks);
    console.groupEnd();

    return chunks;
  }
};

// Create singleton instances
export const imageOptimizer = new ImageOptimizer();
export const resourcePreloader = new ResourcePreloader();
export const performanceMonitor = new PerformanceMonitor();
export const memoryManager = new MemoryManager();
export const serviceWorkerManager = new ServiceWorkerManager();

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Start performance monitoring
  performanceMonitor.init();
  
  // Report metrics after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.reportMetrics();
    }, 5000); // Wait 5 seconds after load
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    memoryManager.cleanup();
    imageOptimizer.disconnect();
  });
}

export default {
  ImageOptimizer,
  ResourcePreloader,
  PerformanceMonitor,
  VirtualScroller,
  MemoryManager,
  ServiceWorkerManager,
  loadComponent,
  analyzeBundle,
  imageOptimizer,
  resourcePreloader,
  performanceMonitor,
  memoryManager,
  serviceWorkerManager
};
