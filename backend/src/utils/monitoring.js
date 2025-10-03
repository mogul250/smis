import os from 'os';
import process from 'process';
import { enhancedLogger } from './logger.js';

// System monitoring class
class SystemMonitor {
  constructor() {
    this.metrics = {
      cpu: { usage: 0, loadAverage: [] },
      memory: { used: 0, free: 0, total: 0, percentage: 0 },
      disk: { used: 0, free: 0, total: 0, percentage: 0 },
      network: { bytesIn: 0, bytesOut: 0 },
      uptime: 0,
      activeConnections: 0,
      errorRate: 0,
      responseTime: 0
    };
    
    this.intervals = new Map();
    this.isMonitoring = false;
    this.alertThresholds = {
      cpu: 80,
      memory: 85,
      disk: 90,
      errorRate: 5,
      responseTime: 2000
    };
  }

  start(interval = 60000) { // Default: 1 minute
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    enhancedLogger.info('System monitoring started', { interval });

    // CPU monitoring
    this.intervals.set('cpu', setInterval(() => {
      this.collectCPUMetrics();
    }, interval));

    // Memory monitoring
    this.intervals.set('memory', setInterval(() => {
      this.collectMemoryMetrics();
    }, interval));

    // System health check
    this.intervals.set('health', setInterval(() => {
      this.performHealthCheck();
    }, interval * 2)); // Every 2 minutes

    // Log metrics
    this.intervals.set('logging', setInterval(() => {
      this.logMetrics();
    }, interval));
  }

  stop() {
    if (!this.isMonitoring) return;
    
    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.intervals.clear();
    this.isMonitoring = false;
    
    enhancedLogger.info('System monitoring stopped');
  }

  collectCPUMetrics() {
    const cpus = os.cpus();
    const loadAverage = os.loadavg();
    
    // Calculate CPU usage
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);
    
    this.metrics.cpu = {
      usage,
      loadAverage,
      cores: cpus.length
    };

    // Alert if CPU usage is high
    if (usage > this.alertThresholds.cpu) {
      this.sendAlert('cpu', 'high', { usage, threshold: this.alertThresholds.cpu });
    }
  }

  collectMemoryMetrics() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryPercentage = (usedMemory / totalMemory) * 100;
    
    this.metrics.memory = {
      total: Math.round(totalMemory / 1024 / 1024), // MB
      free: Math.round(freeMemory / 1024 / 1024), // MB
      used: Math.round(usedMemory / 1024 / 1024), // MB
      percentage: Math.round(memoryPercentage)
    };

    // Process memory
    const processMemory = process.memoryUsage();
    this.metrics.processMemory = {
      rss: Math.round(processMemory.rss / 1024 / 1024), // MB
      heapTotal: Math.round(processMemory.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(processMemory.heapUsed / 1024 / 1024), // MB
      external: Math.round(processMemory.external / 1024 / 1024) // MB
    };

    // Alert if memory usage is high
    if (memoryPercentage > this.alertThresholds.memory) {
      this.sendAlert('memory', 'high', { 
        percentage: memoryPercentage, 
        threshold: this.alertThresholds.memory 
      });
    }
  }

  collectNetworkMetrics() {
    const networkInterfaces = os.networkInterfaces();
    let totalBytesIn = 0;
    let totalBytesOut = 0;

    // This is a simplified version - in production, you'd use more sophisticated network monitoring
    Object.values(networkInterfaces).forEach(interfaces => {
      interfaces.forEach(iface => {
        if (!iface.internal) {
          // Network metrics would typically come from system stats
          // This is a placeholder implementation
        }
      });
    });

    this.metrics.network = {
      bytesIn: totalBytesIn,
      bytesOut: totalBytesOut
    };
  }

  performHealthCheck() {
    const uptime = process.uptime();
    const systemUptime = os.uptime();
    
    this.metrics.uptime = {
      process: Math.round(uptime),
      system: Math.round(systemUptime)
    };

    // Check various system components
    const healthChecks = {
      database: this.checkDatabaseHealth(),
      memory: this.metrics.memory.percentage < this.alertThresholds.memory,
      cpu: this.metrics.cpu.usage < this.alertThresholds.cpu,
      disk: this.checkDiskHealth(),
      network: this.checkNetworkHealth()
    };

    const overallHealth = Object.values(healthChecks).every(check => check);
    
    enhancedLogger.systemHealth('overall', overallHealth ? 'healthy' : 'warning', {
      checks: healthChecks,
      uptime: this.metrics.uptime
    });
  }

  checkDatabaseHealth() {
    // Placeholder - implement actual database health check
    return true;
  }

  checkDiskHealth() {
    // Placeholder - implement actual disk health check
    return true;
  }

  checkNetworkHealth() {
    // Placeholder - implement actual network health check
    return true;
  }

  logMetrics() {
    enhancedLogger.performance('system_metrics', null, {
      cpu: this.metrics.cpu,
      memory: this.metrics.memory,
      processMemory: this.metrics.processMemory,
      uptime: this.metrics.uptime,
      timestamp: new Date().toISOString()
    });
  }

  sendAlert(component, severity, details) {
    enhancedLogger.warn(`System Alert: ${component}`, {
      type: 'system_alert',
      component,
      severity,
      ...details,
      timestamp: new Date().toISOString()
    });

    // In production, you would send alerts to external services
    // like Slack, PagerDuty, email, etc.
    if (process.env.NODE_ENV === 'production') {
      this.sendExternalAlert(component, severity, details);
    }
  }

  sendExternalAlert(component, severity, details) {
    // Implement external alerting (Slack, email, etc.)
    console.warn(`ALERT: ${component} ${severity}`, details);
  }

  getMetrics() {
    return { ...this.metrics };
  }

  setAlertThreshold(component, threshold) {
    if (this.alertThresholds.hasOwnProperty(component)) {
      this.alertThresholds[component] = threshold;
      enhancedLogger.info(`Alert threshold updated`, { component, threshold });
    }
  }
}

// Application performance monitoring
class ApplicationMonitor {
  constructor() {
    this.requestMetrics = {
      total: 0,
      successful: 0,
      failed: 0,
      averageResponseTime: 0,
      slowRequests: 0
    };
    
    this.endpointMetrics = new Map();
    this.errorMetrics = new Map();
    this.userMetrics = new Map();
  }

  recordRequest(req, res, responseTime) {
    this.requestMetrics.total++;
    
    if (res.statusCode < 400) {
      this.requestMetrics.successful++;
    } else {
      this.requestMetrics.failed++;
    }

    // Update average response time
    this.requestMetrics.averageResponseTime = 
      (this.requestMetrics.averageResponseTime * (this.requestMetrics.total - 1) + responseTime) / 
      this.requestMetrics.total;

    // Track slow requests
    if (responseTime > 2000) { // 2 seconds threshold
      this.requestMetrics.slowRequests++;
    }

    // Track endpoint-specific metrics
    const endpoint = `${req.method} ${req.route?.path || req.url}`;
    if (!this.endpointMetrics.has(endpoint)) {
      this.endpointMetrics.set(endpoint, {
        count: 0,
        averageResponseTime: 0,
        errors: 0
      });
    }

    const endpointData = this.endpointMetrics.get(endpoint);
    endpointData.count++;
    endpointData.averageResponseTime = 
      (endpointData.averageResponseTime * (endpointData.count - 1) + responseTime) / 
      endpointData.count;

    if (res.statusCode >= 400) {
      endpointData.errors++;
    }

    // Track user activity
    if (req.user?.id) {
      if (!this.userMetrics.has(req.user.id)) {
        this.userMetrics.set(req.user.id, {
          requests: 0,
          lastActivity: new Date(),
          role: req.user.role
        });
      }

      const userData = this.userMetrics.get(req.user.id);
      userData.requests++;
      userData.lastActivity = new Date();
    }
  }

  recordError(error, context = {}) {
    const errorKey = `${error.name}: ${error.message}`;
    
    if (!this.errorMetrics.has(errorKey)) {
      this.errorMetrics.set(errorKey, {
        count: 0,
        firstOccurrence: new Date(),
        lastOccurrence: new Date(),
        contexts: []
      });
    }

    const errorData = this.errorMetrics.get(errorKey);
    errorData.count++;
    errorData.lastOccurrence = new Date();
    errorData.contexts.push({
      ...context,
      timestamp: new Date()
    });

    // Keep only last 10 contexts to prevent memory issues
    if (errorData.contexts.length > 10) {
      errorData.contexts = errorData.contexts.slice(-10);
    }
  }

  getMetrics() {
    return {
      requests: this.requestMetrics,
      endpoints: Object.fromEntries(this.endpointMetrics),
      errors: Object.fromEntries(this.errorMetrics),
      activeUsers: this.userMetrics.size,
      errorRate: this.requestMetrics.total > 0 ? 
        (this.requestMetrics.failed / this.requestMetrics.total) * 100 : 0
    };
  }

  reset() {
    this.requestMetrics = {
      total: 0,
      successful: 0,
      failed: 0,
      averageResponseTime: 0,
      slowRequests: 0
    };
    this.endpointMetrics.clear();
    this.errorMetrics.clear();
    this.userMetrics.clear();
  }
}

// Database monitoring
class DatabaseMonitor {
  constructor() {
    this.queryMetrics = {
      total: 0,
      successful: 0,
      failed: 0,
      averageExecutionTime: 0,
      slowQueries: 0
    };
    
    this.connectionMetrics = {
      active: 0,
      idle: 0,
      total: 0
    };
  }

  recordQuery(query, executionTime, success = true) {
    this.queryMetrics.total++;
    
    if (success) {
      this.queryMetrics.successful++;
    } else {
      this.queryMetrics.failed++;
    }

    // Update average execution time
    this.queryMetrics.averageExecutionTime = 
      (this.queryMetrics.averageExecutionTime * (this.queryMetrics.total - 1) + executionTime) / 
      this.queryMetrics.total;

    // Track slow queries (>1000ms)
    if (executionTime > 1000) {
      this.queryMetrics.slowQueries++;
      enhancedLogger.warn('Slow database query detected', {
        query: query.substring(0, 200),
        executionTime,
        type: 'slow_query'
      });
    }
  }

  updateConnectionMetrics(active, idle, total) {
    this.connectionMetrics = { active, idle, total };
  }

  getMetrics() {
    return {
      queries: this.queryMetrics,
      connections: this.connectionMetrics
    };
  }
}

// Create monitor instances
export const systemMonitor = new SystemMonitor();
export const applicationMonitor = new ApplicationMonitor();
export const databaseMonitor = new DatabaseMonitor();

// Monitoring middleware
export const monitoringMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    applicationMonitor.recordRequest(req, res, responseTime);
  });
  
  next();
};

// Error monitoring middleware
export const errorMonitoringMiddleware = (error, req, res, next) => {
  applicationMonitor.recordError(error, {
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  next(error);
};

// Health check endpoint data
export const getHealthStatus = () => {
  const systemMetrics = systemMonitor.getMetrics();
  const appMetrics = applicationMonitor.getMetrics();
  const dbMetrics = databaseMonitor.getMetrics();
  
  return {
    status: 'healthy', // This should be calculated based on thresholds
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    system: {
      cpu: systemMetrics.cpu,
      memory: systemMetrics.memory,
      uptime: systemMetrics.uptime
    },
    application: {
      requests: appMetrics.requests,
      errorRate: appMetrics.errorRate,
      activeUsers: appMetrics.activeUsers
    },
    database: dbMetrics,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };
};

// Start monitoring by default
if (process.env.NODE_ENV === 'production') {
  systemMonitor.start();
}

export default {
  SystemMonitor,
  ApplicationMonitor,
  DatabaseMonitor,
  systemMonitor,
  applicationMonitor,
  databaseMonitor,
  getHealthStatus
};
