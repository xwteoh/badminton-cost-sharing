/**
 * Production Monitoring and Error Reporting
 * Purpose: Track errors, performance, and usage metrics
 */

import { getEnv } from './env-validation'

interface ErrorReport {
  message: string
  stack?: string
  url?: string
  userId?: string
  userAgent?: string
  timestamp: Date
  environment: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  context?: Record<string, unknown>
}

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  context?: Record<string, unknown>
}

/**
 * Error reporting service
 */
export class ErrorReporter {
  private static instance: ErrorReporter
  private errorQueue: ErrorReport[] = []
  private isEnabled: boolean

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production'
  }

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter()
    }
    return ErrorReporter.instance
  }

  /**
   * Report an error
   */
  reportError(
    error: Error | string,
    severity: ErrorReport['severity'] = 'medium',
    context?: Record<string, unknown>
  ): void {
    if (!this.isEnabled) {
      // In development, just log to console
      console.error('Error reported:', error, { severity, context })
      return
    }

    const errorReport: ErrorReport = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'unknown',
      severity,
      context,
    }

    this.errorQueue.push(errorReport)

    // Send to external service (e.g., Sentry)
    this.sendToExternalService(errorReport)
  }

  /**
   * Report financial calculation errors (always critical)
   */
  reportFinancialError(
    error: Error | string,
    calculation: string,
    inputs: Record<string, unknown>
  ): void {
    this.reportError(error, 'critical', {
      type: 'financial_calculation',
      calculation,
      inputs,
    })
  }

  /**
   * Report authentication errors
   */
  reportAuthError(error: Error | string, userId?: string): void {
    this.reportError(error, 'high', {
      type: 'authentication',
      userId,
    })
  }

  /**
   * Report database errors
   */
  reportDatabaseError(
    error: Error | string,
    operation: string,
    table?: string
  ): void {
    this.reportError(error, 'high', {
      type: 'database',
      operation,
      table,
    })
  }

  /**
   * Send error to external monitoring service
   */
  private async sendToExternalService(report: ErrorReport): Promise<void> {
    try {
      const env = getEnv()
      
      // Example: Send to Sentry
      if (env.SENTRY_DSN) {
        // In a real implementation, use @sentry/nextjs
        console.log('Would send to Sentry:', report)
      }

      // Example: Send to custom endpoint
      if (typeof fetch !== 'undefined') {
        await fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report),
        })
      }
    } catch (sendError) {
      // Fallback: log to console if external service fails
      console.error('Failed to send error report:', sendError)
      console.error('Original error report:', report)
    }
  }
}

/**
 * Performance monitoring service
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private isEnabled: boolean

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production'
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Track performance metric
   */
  trackMetric(
    name: string,
    value: number,
    unit: string = 'ms',
    context?: Record<string, unknown>
  ): void {
    if (!this.isEnabled) return

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      context,
    }

    this.metrics.push(metric)

    // Send to analytics service
    this.sendMetric(metric)
  }

  /**
   * Track financial calculation performance
   */
  trackFinancialCalculation(
    calculationType: string,
    executionTime: number,
    inputSize: number
  ): void {
    this.trackMetric(
      'financial_calculation_time',
      executionTime,
      'ms',
      {
        type: calculationType,
        inputSize,
      }
    )
  }

  /**
   * Track database operation performance
   */
  trackDatabaseOperation(
    operation: string,
    table: string,
    executionTime: number,
    recordCount?: number
  ): void {
    this.trackMetric(
      'database_operation_time',
      executionTime,
      'ms',
      {
        operation,
        table,
        recordCount,
      }
    )
  }

  /**
   * Track page load performance
   */
  trackPageLoad(route: string, loadTime: number): void {
    this.trackMetric(
      'page_load_time',
      loadTime,
      'ms',
      { route }
    )
  }

  /**
   * Send metric to external service
   */
  private async sendMetric(metric: PerformanceMetric): Promise<void> {
    try {
      const env = getEnv()

      // Example: Send to Vercel Analytics
      if (env.VERCEL_ANALYTICS_ID) {
        console.log('Would send to Vercel Analytics:', metric)
      }

      // Example: Send to Google Analytics
      if (env.NEXT_PUBLIC_GA_ID) {
        console.log('Would send to Google Analytics:', metric)
      }

      // Custom analytics endpoint
      if (typeof fetch !== 'undefined') {
        await fetch('/api/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metric),
        })
      }
    } catch (error) {
      // Silently fail for metrics to avoid impacting user experience
      console.warn('Failed to send performance metric:', error)
    }
  }
}

/**
 * Usage tracking service
 */
export class UsageTracker {
  private static instance: UsageTracker

  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker()
    }
    return UsageTracker.instance
  }

  /**
   * Track user action
   */
  trackAction(
    action: string,
    category: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): void {
    if (process.env.NODE_ENV !== 'production') return

    const event = {
      action,
      category,
      userId,
      timestamp: new Date(),
      metadata,
    }

    this.sendEvent(event)
  }

  /**
   * Track financial operations
   */
  trackFinancialOperation(
    operation: 'payment_recorded' | 'session_completed' | 'balance_checked',
    organizerId: string,
    metadata?: Record<string, unknown>
  ): void {
    this.trackAction(operation, 'financial', organizerId, metadata)
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(
    feature: string,
    userId: string,
    metadata?: Record<string, unknown>
  ): void {
    this.trackAction('feature_used', 'engagement', userId, { 
      feature, 
      ...metadata 
    })
  }

  /**
   * Send event to analytics
   */
  private async sendEvent(event: Record<string, unknown>): Promise<void> {
    try {
      // Send to analytics service
      if (typeof fetch !== 'undefined') {
        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        })
      }
    } catch (error) {
      console.warn('Failed to send usage event:', error)
    }
  }
}

/**
 * Convenience functions for global access
 */
export const reportError = (
  error: Error | string,
  severity?: ErrorReport['severity'],
  context?: Record<string, unknown>
) => ErrorReporter.getInstance().reportError(error, severity, context)

export const trackMetric = (
  name: string,
  value: number,
  unit?: string,
  context?: Record<string, unknown>
) => PerformanceMonitor.getInstance().trackMetric(name, value, unit, context)

export const trackAction = (
  action: string,
  category: string,
  userId?: string,
  metadata?: Record<string, unknown>
) => UsageTracker.getInstance().trackAction(action, category, userId, metadata)

/**
 * Higher-order function to track performance of async operations
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  metricName: string,
  context?: Record<string, unknown>
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = performance.now()
    
    try {
      const result = await fn(...args)
      const duration = performance.now() - startTime
      
      trackMetric(metricName, duration, 'ms', { 
        success: true,
        ...context 
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      trackMetric(metricName, duration, 'ms', { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        ...context 
      })
      
      reportError(error instanceof Error ? error : new Error(String(error)), 'medium', {
        operation: metricName,
        ...context
      })
      
      throw error
    }
  }) as T
}