import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const logObject = {
      timestamp,
      level,
      message,
      ...(stack && { stack }),
      ...meta
    };
    return JSON.stringify(logObject);
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'smis-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, stack }) => {
          return `${timestamp} [${level}]: ${message}${stack ? '\n' + stack : ''}`;
        })
      )
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),

    // Separate file for errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),

    // Separate file for performance logs
    new winston.transports.File({
      filename: path.join(logsDir, 'performance.log'),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 3,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.printf((info) => {
          if (info.type === 'performance') {
            return JSON.stringify(info);
          }
          return '';
        })
      )
    })
  ],

  // Handle uncaught exceptions and unhandled rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 10485760,
      maxFiles: 3
    })
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 10485760,
      maxFiles: 3
    })
  ]
});

// Enhanced logging methods
class EnhancedLogger {
  constructor(winstonLogger) {
    this.logger = winstonLogger;
  }

  // Standard log levels
  error(message, meta = {}) {
    this.logger.error(message, {
      ...meta,
      timestamp: new Date().toISOString()
    });
  }

  warn(message, meta = {}) {
    this.logger.warn(message, {
      ...meta,
      timestamp: new Date().toISOString()
    });
  }

  info(message, meta = {}) {
    this.logger.info(message, {
      ...meta,
      timestamp: new Date().toISOString()
    });
  }

  debug(message, meta = {}) {
    this.logger.debug(message, {
      ...meta,
      timestamp: new Date().toISOString()
    });
  }

  // Specialized logging methods
  apiRequest(req, res, duration) {
    this.logger.info('API Request', {
      type: 'api_request',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      userRole: req.user?.role,
      timestamp: new Date().toISOString()
    });
  }

  apiError(req, error, statusCode = 500) {
    this.logger.error('API Error', {
      type: 'api_error',
      method: req.method,
      url: req.url,
      statusCode,
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      userRole: req.user?.role,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  }

  databaseQuery(query, duration, error = null) {
    const logLevel = error ? 'error' : 'debug';
    const message = error ? 'Database Query Error' : 'Database Query';
    
    this.logger[logLevel](message, {
      type: 'database_query',
      query: query.substring(0, 200), // Truncate long queries
      duration: `${duration}ms`,
      ...(error && { error: error.message, stack: error.stack }),
      timestamp: new Date().toISOString()
    });
  }

  authentication(userId, action, success, details = {}) {
    this.logger.info('Authentication Event', {
      type: 'authentication',
      userId,
      action, // 'login', 'logout', 'register', 'password_reset'
      success,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  security(event, severity, details = {}) {
    const logLevel = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
    
    this.logger[logLevel]('Security Event', {
      type: 'security',
      event,
      severity,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  performance(metric, value, context = {}) {
    this.logger.info('Performance Metric', {
      type: 'performance',
      metric,
      value,
      unit: context.unit || 'ms',
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  businessEvent(event, data = {}) {
    this.logger.info('Business Event', {
      type: 'business_event',
      event,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  systemHealth(component, status, metrics = {}) {
    const logLevel = status === 'healthy' ? 'info' : status === 'warning' ? 'warn' : 'error';
    
    this.logger[logLevel]('System Health Check', {
      type: 'system_health',
      component,
      status,
      ...metrics,
      timestamp: new Date().toISOString()
    });
  }

  // Audit logging for compliance
  audit(action, userId, resource, details = {}) {
    this.logger.info('Audit Log', {
      type: 'audit',
      action,
      userId,
      resource,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  // Structured error logging
  structuredError(error, context = {}) {
    this.logger.error('Structured Error', {
      type: 'structured_error',
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  // Log with correlation ID for request tracking
  withCorrelationId(correlationId) {
    return {
      error: (message, meta = {}) => this.error(message, { ...meta, correlationId }),
      warn: (message, meta = {}) => this.warn(message, { ...meta, correlationId }),
      info: (message, meta = {}) => this.info(message, { ...meta, correlationId }),
      debug: (message, meta = {}) => this.debug(message, { ...meta, correlationId }),
    };
  }
}

// Create enhanced logger instance
const enhancedLogger = new EnhancedLogger(logger);

// Middleware for request correlation
export const correlationMiddleware = (req, res, next) => {
  req.correlationId = req.get('X-Correlation-ID') || 
                     `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  res.set('X-Correlation-ID', req.correlationId);
  req.logger = enhancedLogger.withCorrelationId(req.correlationId);
  
  next();
};

// Request logging middleware
export const requestLoggingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request start
  enhancedLogger.debug('Request Started', {
    method: req.method,
    url: req.url,
    correlationId: req.correlationId,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    enhancedLogger.apiRequest(req, res, duration);
    originalEnd.apply(this, args);
  };

  next();
};

// Error logging middleware
export const errorLoggingMiddleware = (error, req, res, next) => {
  enhancedLogger.apiError(req, error, res.statusCode);
  next(error);
};

// Health check logging
export const logHealthCheck = (component, status, metrics = {}) => {
  enhancedLogger.systemHealth(component, status, metrics);
};

// Database connection logging
export const logDatabaseConnection = (status, details = {}) => {
  enhancedLogger.systemHealth('database', status, details);
};

// Export logger instances and utilities
export { logger, enhancedLogger };
export default enhancedLogger;
