// Performance optimization utilities

// Debounce function for search inputs and API calls
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

// Throttle function for scroll events and resize handlers
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memoization utility for expensive calculations
export const memoize = (fn, getKey = (...args) => JSON.stringify(args)) => {
  const cache = new Map();
  
  return (...args) => {
    const key = getKey(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Prevent memory leaks by limiting cache size
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
};

// Image optimization utility
export const optimizeImage = (src, options = {}) => {
  const {
    width,
    height,
    quality = 75,
    format = 'webp',
    fallback = 'jpg'
  } = options;

  // For Next.js Image component optimization
  const params = new URLSearchParams();
  if (width) params.append('w', width);
  if (height) params.append('h', height);
  params.append('q', quality);
  params.append('f', format);

  return {
    src: `${src}?${params.toString()}`,
    fallbackSrc: `${src}?${params.toString().replace(`f=${format}`, `f=${fallback}`)}`
  };
};

// Virtual scrolling utility for large lists
export class VirtualScroller {
  constructor(container, itemHeight, renderItem, totalItems) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.renderItem = renderItem;
    this.totalItems = totalItems;
    this.visibleItems = Math.ceil(container.clientHeight / itemHeight) + 2;
    this.scrollTop = 0;
    
    this.init();
  }

  init() {
    this.container.style.height = `${this.totalItems * this.itemHeight}px`;
    this.container.style.position = 'relative';
    this.container.style.overflow = 'auto';
    
    this.viewport = document.createElement('div');
    this.viewport.style.position = 'absolute';
    this.viewport.style.top = '0';
    this.viewport.style.left = '0';
    this.viewport.style.right = '0';
    
    this.container.appendChild(this.viewport);
    
    this.container.addEventListener('scroll', throttle(() => {
      this.scrollTop = this.container.scrollTop;
      this.render();
    }, 16));
    
    this.render();
  }

  render() {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const endIndex = Math.min(startIndex + this.visibleItems, this.totalItems);
    
    this.viewport.style.transform = `translateY(${startIndex * this.itemHeight}px)`;
    this.viewport.innerHTML = '';
    
    for (let i = startIndex; i < endIndex; i++) {
      const item = this.renderItem(i);
      item.style.height = `${this.itemHeight}px`;
      this.viewport.appendChild(item);
    }
  }
}

// Bundle splitting utility (disabled - no chunks directory)
// export const loadChunk = async (chunkName) => {
//   try {
//     const module = await import(
//       /* webpackChunkName: "[request]" */
//       `../chunks/${chunkName}`
//     );
//     return module.default || module;
//   } catch (error) {
//     console.error(`Failed to load chunk: ${chunkName}`, error);
//     throw error;
//   }
// };

// Service Worker registration for caching
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// Preload critical resources
export const preloadCriticalResources = () => {
  const criticalResources = [
    { href: '/fonts/inter.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
    { href: '/api/auth/me', as: 'fetch', crossOrigin: 'same-origin' },
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    Object.assign(link, resource);
    document.head.appendChild(link);
  });
};

// Intersection Observer utility for lazy loading
export const createIntersectionObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
  };

  return new IntersectionObserver(callback, { ...defaultOptions, ...options });
};

// Performance monitoring utilities
export const measurePerformance = (name, fn) => {
  return async (...args) => {
    const start = performance.now();
    const result = await fn(...args);
    const end = performance.now();
    
    console.log(`${name} took ${end - start} milliseconds`);
    
    // Report to analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'timing_complete', {
        name: name,
        value: Math.round(end - start)
      });
    }
    
    return result;
  };
};

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = performance.memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
  }
  return null;
};

// Critical rendering path optimization
export const optimizeCriticalRenderingPath = () => {
  // Inline critical CSS
  const criticalCSS = `
    .loading-spinner { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .btn-primary { background-color: #1B365D; color: white; }
  `;
  
  const style = document.createElement('style');
  style.textContent = criticalCSS;
  document.head.appendChild(style);
  
  // Preconnect to external domains
  const preconnectDomains = ['https://fonts.googleapis.com', 'https://api.example.com'];
  preconnectDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    document.head.appendChild(link);
  });
};

// Resource hints for better loading performance
export const addResourceHints = () => {
  const hints = [
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://api.example.com' },
    { rel: 'prefetch', href: '/student/grades' }, // Likely next page
  ];

  hints.forEach(hint => {
    const link = document.createElement('link');
    Object.assign(link, hint);
    document.head.appendChild(link);
  });
};

// Code splitting by route
export const loadRouteComponent = (route) => {
  const routeMap = {
    '/student/attendance': () => import('../pages/student/attendance'),
    '/student/fees': () => import('../pages/student/fees'),
    '/student/grades': () => import('../pages/student/grades'),
    '/student/profile': () => import('../pages/student/profile'),
    '/student/timetable': () => import('../pages/student/timetable'),
    '/teacher/analytics': () => import('../pages/teacher/analytics'),
    '/teacher/attendance': () => import('../pages/teacher/attendance'),
    '/teacher/classes': () => import('../pages/teacher/classes'),
    '/teacher/grades': () => import('../pages/teacher/grades'),
    '/hod/analytics': () => import('../pages/hod/analytics'),
    '/hod/approvals': () => import('../pages/hod/approvals'),
    '/hod/department': () => import('../pages/hod/department'),
    '/finance/fees': () => import('../pages/finance/fees'),
    '/finance/payments': () => import('../pages/finance/payments'),
    '/finance/reports': () => import('../pages/finance/reports'),
    '/admin/system': () => import('../pages/admin/system'),
    '/admin/users': () => import('../pages/admin/users'),
    '/dashboard': () => import('../pages/dashboard'),
    '/login': () => import('../pages/login'),
  };

  return routeMap[route] ? routeMap[route]() : Promise.reject(new Error(`Route ${route} not found`));
};

// Optimize bundle size by removing unused code
export const removeUnusedCode = () => {
  // This would typically be handled by webpack tree-shaking
  // But we can provide runtime optimizations
  
  // Remove unused event listeners
  const unusedListeners = [];
  
  return {
    cleanup: () => {
      unusedListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
    }
  };
};

export default {
  debounce,
  throttle,
  memoize,
  optimizeImage,
  VirtualScroller,
  registerServiceWorker,
  preloadCriticalResources,
  createIntersectionObserver,
  measurePerformance,
  monitorMemoryUsage,
  optimizeCriticalRenderingPath,
  addResourceHints,
  loadRouteComponent,
  removeUnusedCode
};
