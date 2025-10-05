import compression from 'compression';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import { promisify } from 'util';

// Request compression middleware
export const compressionMiddleware = compression({
  filter: (req, res) => {
    // Don't compress responses with this request header
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Fallback to standard filter function
    return compression.filter(req, res);
  },
  level: 6, // Compression level (1-9, 6 is default)
  threshold: 1024, // Only compress responses larger than 1KB
});

// Rate limiting middleware
export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests
  skipSuccessfulRequests: false,
  // Skip failed requests
  skipFailedRequests: false,
  // Custom key generator
  keyGenerator: (req) => {
    return req.ip;
  },
  // Custom handler for when limit is exceeded
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Admin-specific rate limiting (more restrictive)
export const adminRateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for admin operations
  message: {
    error: 'Too many admin requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});

// Slow down middleware for repeated requests
export const slowDownMiddleware = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 5000, // Maximum delay of 5 seconds
});

// Request timeout middleware
export const timeoutMiddleware = (timeout = 30000) => {
  return (req, res, next) => {
    // Set timeout for the request
    req.setTimeout(timeout, () => {
      const err = new Error('Request timeout');
      err.status = 408;
      next(err);
    });
    
    // Set timeout for the response
    res.setTimeout(timeout, () => {
      const err = new Error('Response timeout');
      err.status = 408;
      next(err);
    });
    
    next();
  };
};

// Response time tracking middleware
export const responseTimeMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.end to calculate response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Add response time header
    res.set('X-Response-Time', `${responseTime}ms`);
    
    // Log slow requests (>1000ms)
    if (responseTime > 1000) {
      console.warn(`Slow request: ${req.method} ${req.url} - ${responseTime}ms`);
    }
    
    // Log to performance monitoring service
    if (process.env.NODE_ENV === 'production') {
      // You can integrate with services like New Relic, DataDog, etc.
      logPerformanceMetric({
        method: req.method,
        url: req.url,
        responseTime,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }
    
    originalEnd.apply(this, args);
  };
  
  next();
};

// Memory usage monitoring middleware
export const memoryMonitoringMiddleware = (req, res, next) => {
  const memUsage = process.memoryUsage();
  
  // Log memory usage for monitoring
  req.memoryUsage = {
    rss: Math.round(memUsage.rss / 1024 / 1024), // MB
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
    external: Math.round(memUsage.external / 1024 / 1024), // MB
  };
  
  // Warn if memory usage is high
  if (req.memoryUsage.heapUsed > 500) { // 500MB threshold
    console.warn(`High memory usage: ${req.memoryUsage.heapUsed}MB`);
  }
  
  next();
};

// Request size limiting middleware
export const requestSizeLimitMiddleware = (limit = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxSize = parseSize(limit);
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        error: 'Request entity too large',
        message: `Request size ${contentLength} bytes exceeds limit of ${maxSize} bytes`,
        maxSize: maxSize
      });
    }
    
    next();
  };
};

// Cache control middleware
export const cacheControlMiddleware = (options = {}) => {
  const {
    maxAge = 300, // 5 minutes default
    public: isPublic = false,
    private: isPrivate = true,
    noCache = false,
    noStore = false,
    mustRevalidate = false
  } = options;
  
  return (req, res, next) => {
    if (noCache || noStore) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    } else {
      const cacheDirectives = [];
      
      if (isPublic) cacheDirectives.push('public');
      if (isPrivate) cacheDirectives.push('private');
      if (maxAge) cacheDirectives.push(`max-age=${maxAge}`);
      if (mustRevalidate) cacheDirectives.push('must-revalidate');
      
      res.set('Cache-Control', cacheDirectives.join(', '));
    }
    
    next();
  };
};

// ETag middleware for conditional requests
export const etagMiddleware = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (data && typeof data === 'string' || Buffer.isBuffer(data)) {
      const etag = generateETag(data);
      res.set('ETag', etag);
      
      // Check if client has cached version
      const clientETag = req.get('If-None-Match');
      if (clientETag === etag) {
        return res.status(304).end();
      }
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// CORS optimization middleware
export const optimizedCorsMiddleware = (req, res, next) => {
  const origin = req.get('Origin');
  const allowedOrigins = [
    'http://localhost:3000',
    'https://your-production-domain.com'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.set('Access-Control-Allow-Credentials', 'true');
  res.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
};

// Database connection pooling optimization
export const dbPoolMiddleware = (req, res, next) => {
  // Add database connection info to request
  req.dbPool = {
    maxConnections: 20,
    idleTimeout: 30000,
    acquireTimeout: 60000
  };
  
  next();
};

// Request logging middleware for performance analysis
export const performanceLoggingMiddleware = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      contentLength: res.get('Content-Length') || 0,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      memoryUsage: req.memoryUsage
    };
    
    // Log to file or monitoring service
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logData));
    } else {
      console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration.toFixed(2)}ms`);
    }
  });
  
  next();
};

// Utility functions
function parseSize(size) {
  if (typeof size === 'number') return size;
  
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return Math.floor(value * units[unit]);
}

function generateETag(data) {
  const crypto = require('crypto');
  return `"${crypto.createHash('md5').update(data).digest('hex')}"`;
}

function logPerformanceMetric(metric) {
  // Integration point for performance monitoring services
  // Example: New Relic, DataDog, custom analytics
  if (global.performanceMonitor) {
    global.performanceMonitor.log(metric);
  }
}

// Export all middleware as a bundle
export const performanceMiddlewareBundle = {
  compression: compressionMiddleware,
  rateLimit: rateLimitMiddleware,
  adminRateLimit: adminRateLimitMiddleware,
  slowDown: slowDownMiddleware,
  timeout: timeoutMiddleware,
  responseTime: responseTimeMiddleware,
  memoryMonitoring: memoryMonitoringMiddleware,
  requestSizeLimit: requestSizeLimitMiddleware,
  cacheControl: cacheControlMiddleware,
  etag: etagMiddleware,
  cors: optimizedCorsMiddleware,
  dbPool: dbPoolMiddleware,
  performanceLogging: performanceLoggingMiddleware
};

export default performanceMiddlewareBundle;
