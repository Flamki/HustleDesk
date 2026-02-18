/**
 * Performance monitoring utilities
 * Tracks key metrics and provides integration points for performance monitoring services
 */

import { logger } from './logger';

export type PerformanceMetric = {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  tags?: Record<string, string>;
};

// Performance thresholds
const SLOW_OPERATION_THRESHOLD_MS = 1000; // Log operations slower than 1s
const SLOW_API_THRESHOLD_MS = 3000; // Log API calls slower than 3s

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private timers: Map<string, number> = new Map();

  /**
   * Start a performance timer
   */
  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  /**
   * End a performance timer and record the metric
   */
  endTimer(name: string, tags?: Record<string, string>): number | null {
    const startTime = this.timers.get(name);
    if (!startTime) {
      logger.warn('Timer not found', { name });
      return null;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      tags,
    });

    return duration;
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    const metrics = this.metrics.get(metric.name) || [];
    metrics.push(metric);
    
    // Keep only last 100 metrics per name to avoid memory issues
    if (metrics.length > 100) {
      metrics.shift();
    }
    
    this.metrics.set(metric.name, metrics);

    // Log slow operations
    if (metric.unit === 'ms' && metric.value > SLOW_OPERATION_THRESHOLD_MS) {
      logger.warn('Slow operation detected', {
        metric: metric.name,
        duration: metric.value,
        ...metric.tags,
      });
    }

    // Integration point for external performance monitoring
    // Example: if (window.newrelic) { window.newrelic.recordMetric(metric.name, metric.value); }
  }

  /**
   * Get metrics by name
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Get average value for a metric
   */
  getAverage(name: string): number | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) return null;

    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.timers.clear();
  }

  /**
   * Get Web Vitals (if available)
   */
  getWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const lcpEntry = entry as PerformanceEntry & { renderTime?: number; loadTime?: number };
        this.recordMetric({
          name: 'web_vital_lcp',
          value: lcpEntry.renderTime || lcpEntry.loadTime || 0,
          unit: 'ms',
          timestamp: Date.now(),
          tags: { type: 'lcp' },
        });
      }
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // LCP not supported
    }

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fidEntry = entry as PerformanceEntry & { processingStart?: number };
        this.recordMetric({
          name: 'web_vital_fid',
          value: fidEntry.processingStart ? fidEntry.processingStart - entry.startTime : 0,
          unit: 'ms',
          timestamp: Date.now(),
          tags: { type: 'fid' },
        });
      }
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // FID not supported
    }
  }

  /**
   * Monitor route changes
   */
  trackRouteChange(route: string): void {
    this.recordMetric({
      name: 'route_change',
      value: 1,
      unit: 'count',
      timestamp: Date.now(),
      tags: { route },
    });

    logger.debug('Route changed', { route });
  }

  /**
   * Monitor API calls
   */
  trackApiCall(endpoint: string, duration: number, status: number): void {
    this.recordMetric({
      name: 'api_call',
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      tags: {
        endpoint,
        status: String(status),
        success: status >= 200 && status < 300 ? 'true' : 'false',
      },
    });

    if (duration > SLOW_API_THRESHOLD_MS) {
      logger.warn('Slow API call', { endpoint, duration, status });
    }
  }

  /**
   * Get performance report
   */
  getReport(): Record<string, { count: number; average: number; min: number; max: number }> {
    const report: Record<string, { count: number; average: number; min: number; max: number }> = {};

    this.metrics.forEach((metrics, name) => {
      const values = metrics.map(m => m.value);
      report[name] = {
        count: values.length,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    });

    return report;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export class for testing
export { PerformanceMonitor };
