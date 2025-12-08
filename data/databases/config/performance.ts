/**
 * Performance Configuration Module
 * Performance tuning and optimization settings
 */

import { z } from 'zod';

// Performance configuration schema
export interface PerformanceConfig {
  queryTimeout: number;
  maxConnections: number;
  connectionPooling: {
    enabled: boolean;
    maxPoolSize: number;
    minPoolSize: number;
    acquireTimeoutMillis: number;
    idleTimeoutMillis: number;
    reapIntervalMillis: number;
  };
  queryOptimization: {
    enableQueryPlanAnalysis: boolean;
    enableSlowQueryLogging: boolean;
    slowQueryThreshold: number; // milliseconds
    enableExplainAnalysis: boolean;
  };
  caching: {
    enabled: boolean;
    maxCacheSize: number;
    ttl: number; // seconds
    cacheStrategy: 'lru' | 'fifo' | 'none';
  };
  monitoring: {
    enableMetrics: boolean;
    metricsInterval: number; // seconds
    enableQueryStats: boolean;
    enableConnectionStats: boolean;
  };
}

// Default performance settings
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  queryTimeout: 30000, // 30 seconds
  maxConnections: 10,
  connectionPooling: {
    enabled: true,
    maxPoolSize: 5,
    minPoolSize: 1,
    acquireTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
  },
  queryOptimization: {
    enableQueryPlanAnalysis: false,
    enableSlowQueryLogging: true,
    slowQueryThreshold: 1000, // 1 second
    enableExplainAnalysis: false,
  },
  caching: {
    enabled: false,
    maxCacheSize: 100,
    ttl: 300, // 5 minutes
    cacheStrategy: 'lru',
  },
  monitoring: {
    enableMetrics: true,
    metricsInterval: 60, // 1 minute
    enableQueryStats: true,
    enableConnectionStats: true,
  },
};

/**
 * Load performance configuration from environment variables
 */
export function loadPerformanceConfig(): PerformanceConfig {
  const config: PerformanceConfig = { ...DEFAULT_PERFORMANCE_CONFIG };

  // Override with environment variables
  if (process.env.QUERY_TIMEOUT) {
    config.queryTimeout = parseInt(process.env.QUERY_TIMEOUT, 10);
  }

  if (process.env.MAX_CONNECTIONS) {
    config.maxConnections = parseInt(process.env.MAX_CONNECTIONS, 10);
  }

  // Connection pooling settings
  if (process.env.ENABLE_CONNECTION_POOLING) {
    config.connectionPooling.enabled = process.env.ENABLE_CONNECTION_POOLING === 'true';
  }

  if (process.env.MAX_POOL_SIZE) {
    config.connectionPooling.maxPoolSize = parseInt(process.env.MAX_POOL_SIZE, 10);
  }

  if (process.env.MIN_POOL_SIZE) {
    config.connectionPooling.minPoolSize = parseInt(process.env.MIN_POOL_SIZE, 10);
  }

  // Query optimization settings
  if (process.env.ENABLE_SLOW_QUERY_LOGGING) {
    config.queryOptimization.enableSlowQueryLogging = process.env.ENABLE_SLOW_QUERY_LOGGING === 'true';
  }

  if (process.env.SLOW_QUERY_THRESHOLD) {
    config.queryOptimization.slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD, 10);
  }

  // Caching settings
  if (process.env.ENABLE_QUERY_CACHING) {
    config.caching.enabled = process.env.ENABLE_QUERY_CACHING === 'true';
  }

  if (process.env.QUERY_CACHE_SIZE) {
    config.caching.maxCacheSize = parseInt(process.env.QUERY_CACHE_SIZE, 10);
  }

  if (process.env.QUERY_CACHE_TTL) {
    config.caching.ttl = parseInt(process.env.QUERY_CACHE_TTL, 10);
  }

  // Monitoring settings
  if (process.env.ENABLE_PERFORMANCE_METRICS) {
    config.monitoring.enableMetrics = process.env.ENABLE_PERFORMANCE_METRICS === 'true';
  }

  validatePerformanceConfig(config);
  return config;
}

/**
 * Validate performance configuration values
 */
function validatePerformanceConfig(config: PerformanceConfig): void {
  // Validate timeout
  if (config.queryTimeout < 1000 || config.queryTimeout > 300000) {
    throw new Error('Query timeout must be between 1000ms and 300000ms (5 minutes)');
  }

  // Validate connection limits
  if (config.maxConnections < 1 || config.maxConnections > 50) {
    throw new Error('Max connections must be between 1 and 50');
  }

  // Validate pool settings
  if (config.connectionPooling.enabled) {
    if (config.connectionPooling.maxPoolSize < 1 || config.connectionPooling.maxPoolSize > 20) {
      throw new Error('Max pool size must be between 1 and 20');
    }

    if (config.connectionPooling.minPoolSize < 0 || config.connectionPooling.minPoolSize > config.connectionPooling.maxPoolSize) {
      throw new Error('Min pool size must be between 0 and max pool size');
    }
  }

  // Validate slow query threshold
  if (config.queryOptimization.slowQueryThreshold < 100 || config.queryOptimization.slowQueryThreshold > 60000) {
    throw new Error('Slow query threshold must be between 100ms and 60000ms (1 minute)');
  }

  // Validate cache settings
  if (config.caching.enabled) {
    if (config.caching.maxCacheSize < 1 || config.caching.maxCacheSize > 1000) {
      throw new Error('Cache size must be between 1 and 1000');
    }

    if (config.caching.ttl < 60 || config.caching.ttl > 3600) {
      throw new Error('Cache TTL must be between 60 seconds and 3600 seconds (1 hour)');
    }
  }

  // Validate monitoring settings
  if (config.monitoring.metricsInterval < 10 || config.monitoring.metricsInterval > 3600) {
    throw new Error('Metrics interval must be between 10 seconds and 3600 seconds (1 hour)');
  }
}

/**
 * Performance metrics collector
 */
export class PerformanceMetrics {
  private metrics = {
    totalQueries: 0,
    slowQueries: 0,
    errorQueries: 0,
    totalExecutionTime: 0,
    averageExecutionTime: 0,
    activeConnections: 0,
    peakConnections: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  private queryHistory: Array<{
    timestamp: number;
    duration: number;
    query: string;
    success: boolean;
  }> = [];

  private readonly maxHistorySize = 1000;

  /**
   * Record query execution
   */
  recordQuery(query: string, duration: number, success: boolean): void {
    this.metrics.totalQueries++;
    this.metrics.totalExecutionTime += duration;
    this.metrics.averageExecutionTime = this.metrics.totalExecutionTime / this.metrics.totalQueries;

    if (!success) {
      this.metrics.errorQueries++;
    }

    // Add to history
    this.queryHistory.push({
      timestamp: Date.now(),
      duration,
      query: this.sanitizeQuery(query),
      success,
    });

    // Trim history if needed
    if (this.queryHistory.length > this.maxHistorySize) {
      this.queryHistory = this.queryHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Record slow query
   */
  recordSlowQuery(query: string, duration: number): void {
    this.metrics.slowQueries++;
    console.warn(`[PERFORMANCE] Slow query detected (${duration}ms):`, this.sanitizeQuery(query));
  }

  /**
   * Record cache hit/miss
   */
  recordCacheHit(hit: boolean): void {
    if (hit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
  }

  /**
   * Update connection count
   */
  updateConnectionCount(count: number): void {
    this.metrics.activeConnections = count;
    if (count > this.metrics.peakConnections) {
      this.metrics.peakConnections = count;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.cacheHits + this.metrics.cacheMisses > 0
        ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100
        : 0,
      errorRate: this.metrics.totalQueries > 0
        ? (this.metrics.errorQueries / this.metrics.totalQueries) * 100
        : 0,
    };
  }

  /**
   * Get recent query history
   */
  getQueryHistory(limit = 50) {
    return this.queryHistory.slice(-limit);
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {
      totalQueries: 0,
      slowQueries: 0,
      errorQueries: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      activeConnections: 0,
      peakConnections: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
    this.queryHistory = [];
  }

  /**
   * Sanitize query for logging
   */
  private sanitizeQuery(query: string): string {
    // Remove sensitive data and limit length
    let sanitized = query
      .replace(/(['"])[^'"]*\1/g, '$1***$1') // Replace string literals
      .replace(/\b\d+\b/g, '***'); // Replace numbers

    return sanitized.length > 200 ? sanitized.substring(0, 200) + '...' : sanitized;
  }
}

export { PerformanceConfig };