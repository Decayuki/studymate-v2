/**
 * Performance Optimization Utilities
 * Caching, rate limiting, and performance monitoring for production
 */

import { LRUCache } from 'lru-cache';

// ============================================================================
// MEMORY CACHE
// ============================================================================

class MemoryCache {
  private cache: LRUCache<string, any>;
  
  constructor(maxSize: number = 1000, ttlMs: number = 300000) { // 5 minutes default
    this.cache = new LRUCache({
      max: maxSize,
      ttl: ttlMs,
    });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get(key) as T;
  }

  set(key: string, value: any, ttlMs?: number): void {
    this.cache.set(key, value, { ttl: ttlMs });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  getStats(): { size: number; max: number } {
    return {
      size: this.cache.size,
      max: this.cache.max,
    };
  }

  // Generate cache key from parameters
  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    return `${prefix}:${sortedParams}`;
  }
}

// Global cache instances
export const subjectCache = new MemoryCache(500, 600000); // 10 minutes for subjects
export const contentCache = new MemoryCache(1000, 300000); // 5 minutes for content
export const templatesCache = new MemoryCache(100, 1800000); // 30 minutes for templates
export const aiResponseCache = new MemoryCache(200, 3600000); // 1 hour for AI responses

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 900000 // 15 minutes
  ) {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  isAllowed(identifier: string): { allowed: boolean; remainingRequests?: number; resetTime?: number } {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry || now >= entry.resetTime) {
      // First request or window expired
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return {
        allowed: true,
        remainingRequests: this.maxRequests - 1,
        resetTime: now + this.windowMs,
      };
    }

    if (entry.count >= this.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment counter
    entry.count++;
    this.limits.set(identifier, entry);

    return {
      allowed: true,
      remainingRequests: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  getRemainingRequests(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry || Date.now() >= entry.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  reset(identifier: string): void {
    this.limits.delete(identifier);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now >= entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.limits.clear();
  }

  getStats(): { activeEntries: number; totalRequests: number } {
    let totalRequests = 0;
    for (const entry of this.limits.values()) {
      totalRequests += entry.count;
    }
    return {
      activeEntries: this.limits.size,
      totalRequests,
    };
  }
}

// Global rate limiters
export const globalRateLimiter = new RateLimiter(1000, 900000); // 1000 requests per 15 min
export const aiRateLimiter = new RateLimiter(50, 3600000); // 50 AI requests per hour
export const notionRateLimiter = new RateLimiter(10, 60000); // 10 Notion requests per minute

// ============================================================================
// DATABASE QUERY OPTIMIZATION
// ============================================================================

export class QueryOptimizer {
  // Pagination helper with cursor-based pagination for large datasets
  static buildPaginationQuery(
    page: number,
    limit: number,
    maxLimit: number = 100
  ): { skip: number; limit: number } {
    const clampedPage = Math.max(1, page);
    const clampedLimit = Math.min(maxLimit, Math.max(1, limit));
    const skip = (clampedPage - 1) * clampedLimit;

    return { skip, limit: clampedLimit };
  }

  // Build optimized MongoDB aggregation pipeline
  static buildOptimizedPipeline(filters: Record<string, any>): any[] {
    const pipeline: any[] = [];

    // Add match stage first for early filtering
    const matchStage = this.buildMatchStage(filters);
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    return pipeline;
  }

  private static buildMatchStage(filters: Record<string, any>): Record<string, any> {
    const match: Record<string, any> = {};

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        if (key.includes('.')) {
          // Nested field
          match[key] = value;
        } else if (typeof value === 'string' && key.includes('search')) {
          // Text search
          match.$text = { $search: value };
        } else if (Array.isArray(value) && value.length > 0) {
          // Array filters
          match[key] = { $in: value };
        } else {
          match[key] = value;
        }
      }
    }

    return match;
  }

  // Generate efficient sorting pipeline
  static addSortStage(pipeline: any[], sortBy: string = 'createdAt', sortOrder: 'asc' | 'desc' = 'desc'): void {
    const sortStage: Record<string, 1 | -1> = {};
    sortStage[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Always add _id as secondary sort for consistency
    if (sortBy !== '_id') {
      sortStage._id = -1;
    }
    
    pipeline.push({ $sort: sortStage });
  }

  // Add pagination stages
  static addPaginationStages(pipeline: any[], skip: number, limit: number): void {
    if (skip > 0) {
      pipeline.push({ $skip: skip });
    }
    pipeline.push({ $limit: limit });
  }

  // Optimize lookup operations
  static addOptimizedLookup(
    pipeline: any[],
    from: string,
    localField: string,
    foreignField: string,
    as: string,
    requiredFields?: string[]
  ): void {
    const lookupStage: any = {
      $lookup: {
        from,
        localField,
        foreignField,
        as,
      }
    };

    // Add projection to limit fields if specified
    if (requiredFields && requiredFields.length > 0) {
      const projection: Record<string, 1> = {};
      requiredFields.forEach(field => {
        projection[field] = 1;
      });
      
      lookupStage.$lookup.pipeline = [
        { $project: projection }
      ];
    }

    pipeline.push(lookupStage);
  }
}

// ============================================================================
// DEBOUNCE AND THROTTLE UTILITIES
// ============================================================================

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
    }, waitMs);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCallTime >= waitMs) {
      lastCallTime = now;
      func(...args);
    }
  };
}

// ============================================================================
// LAZY LOADING UTILITIES
// ============================================================================

export class LazyLoader<T> {
  private promise: Promise<T> | null = null;
  private value: T | null = null;
  private loaded = false;

  constructor(private loader: () => Promise<T>) {}

  async load(): Promise<T> {
    if (this.loaded) {
      return this.value!;
    }

    if (this.promise) {
      return this.promise;
    }

    this.promise = this.loader().then(value => {
      this.value = value;
      this.loaded = true;
      this.promise = null;
      return value;
    });

    return this.promise;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  getValue(): T | null {
    return this.value;
  }

  reset(): void {
    this.value = null;
    this.loaded = false;
    this.promise = null;
  }
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

export class BatchProcessor<T, R> {
  private batch: T[] = [];
  private processingPromise: Promise<R[]> | null = null;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(
    private processor: (batch: T[]) => Promise<R[]>,
    private batchSize: number = 10,
    private maxWaitMs: number = 1000
  ) {}

  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.batch.push(item);

      // Store the resolve/reject functions with the item
      const itemIndex = this.batch.length - 1;
      (item as any)._resolve = resolve;
      (item as any)._reject = reject;

      if (this.batch.length >= this.batchSize) {
        this.processBatch();
      } else if (!this.timeoutId) {
        this.timeoutId = setTimeout(() => {
          this.processBatch();
        }, this.maxWaitMs);
      }
    });
  }

  private async processBatch(): Promise<void> {
    if (this.batch.length === 0) return;
    if (this.processingPromise) return;

    const currentBatch = this.batch.splice(0, this.batchSize);
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.processingPromise = this.processor(currentBatch)
      .then(results => {
        // Resolve each item's promise
        currentBatch.forEach((item, index) => {
          if ((item as any)._resolve) {
            (item as any)._resolve(results[index]);
          }
        });
        return results;
      })
      .catch(error => {
        // Reject each item's promise
        currentBatch.forEach(item => {
          if ((item as any)._reject) {
            (item as any)._reject(error);
          }
        });
        throw error;
      })
      .finally(() => {
        this.processingPromise = null;
        // Process remaining items if any
        if (this.batch.length > 0) {
          this.processBatch();
        }
      });

    return this.processingPromise.then(() => {});
  }

  async flush(): Promise<void> {
    if (this.batch.length > 0) {
      await this.processBatch();
    }
    if (this.processingPromise) {
      await this.processingPromise;
    }
  }

  getQueueSize(): number {
    return this.batch.length;
  }
}

// ============================================================================
// MEMORY MONITORING
// ============================================================================

export class MemoryMonitor {
  private static instance: MemoryMonitor | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private measurements: Array<{ timestamp: Date; usage: NodeJS.MemoryUsage }> = [];
  private maxMeasurements = 100;

  static getInstance(): MemoryMonitor {
    if (!this.instance) {
      this.instance = new MemoryMonitor();
    }
    return this.instance;
  }

  startMonitoring(intervalMs: number = 30000): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      const usage = process.memoryUsage();
      this.measurements.push({
        timestamp: new Date(),
        usage,
      });

      // Keep only recent measurements
      if (this.measurements.length > this.maxMeasurements) {
        this.measurements = this.measurements.slice(-this.maxMeasurements);
      }

      // Alert on high memory usage
      const heapUsedMB = usage.heapUsed / 1024 / 1024;
      if (heapUsedMB > 500) { // 500 MB threshold
        console.warn(`High memory usage detected: ${heapUsedMB.toFixed(2)} MB`);
      }
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getCurrentUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  getUsageHistory(): Array<{ timestamp: Date; usage: NodeJS.MemoryUsage }> {
    return [...this.measurements];
  }

  getAverageUsage(): { heapUsed: number; heapTotal: number; external: number } {
    if (this.measurements.length === 0) {
      const current = process.memoryUsage();
      return {
        heapUsed: current.heapUsed,
        heapTotal: current.heapTotal,
        external: current.external,
      };
    }

    const sum = this.measurements.reduce(
      (acc, measurement) => ({
        heapUsed: acc.heapUsed + measurement.usage.heapUsed,
        heapTotal: acc.heapTotal + measurement.usage.heapTotal,
        external: acc.external + measurement.usage.external,
      }),
      { heapUsed: 0, heapTotal: 0, external: 0 }
    );

    const count = this.measurements.length;
    return {
      heapUsed: sum.heapUsed / count,
      heapTotal: sum.heapTotal / count,
      external: sum.external / count,
    };
  }

  forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
      console.log('Garbage collection forced');
    } else {
      console.warn('Garbage collection not available. Start with --expose-gc flag.');
    }
  }
}

// ============================================================================
// HEALTH CHECK SYSTEM
// ============================================================================

export interface HealthCheck {
  name: string;
  check: () => Promise<{ healthy: boolean; message?: string; metadata?: any }>;
  timeout?: number;
}

export class HealthChecker {
  private checks: Map<string, HealthCheck> = new Map();

  register(healthCheck: HealthCheck): void {
    this.checks.set(healthCheck.name, healthCheck);
  }

  unregister(name: string): void {
    this.checks.delete(name);
  }

  async runCheck(name: string): Promise<{ healthy: boolean; message?: string; duration: number; metadata?: any }> {
    const check = this.checks.get(name);
    if (!check) {
      return {
        healthy: false,
        message: `Health check '${name}' not found`,
        duration: 0,
      };
    }

    const start = Date.now();
    const timeout = check.timeout || 5000;

    try {
      const result = await Promise.race([
        check.check(),
        new Promise<{ healthy: boolean; message: string }>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), timeout)
        ),
      ]);

      return {
        ...result,
        duration: Date.now() - start,
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Health check failed',
        duration: Date.now() - start,
      };
    }
  }

  async runAllChecks(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    const promises = Array.from(this.checks.keys()).map(async name => {
      results[name] = await this.runCheck(name);
    });

    await Promise.all(promises);

    // Calculate overall health
    const allHealthy = Object.values(results).every((result: any) => result.healthy);
    
    return {
      healthy: allHealthy,
      timestamp: new Date().toISOString(),
      checks: results,
    };
  }

  getRegisteredChecks(): string[] {
    return Array.from(this.checks.keys());
  }
}

// Global health checker instance
export const healthChecker = new HealthChecker();

// Register basic health checks
healthChecker.register({
  name: 'memory',
  check: async () => {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    const isHealthy = heapUsedMB < 1000; // 1GB limit
    
    return {
      healthy: isHealthy,
      message: isHealthy ? 'Memory usage is normal' : 'High memory usage detected',
      metadata: {
        heapUsedMB: Math.round(heapUsedMB),
        heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024),
      },
    };
  },
});

healthChecker.register({
  name: 'uptime',
  check: async () => {
    const uptimeSeconds = process.uptime();
    const uptimeHours = uptimeSeconds / 3600;
    
    return {
      healthy: true,
      message: `Application running for ${uptimeHours.toFixed(2)} hours`,
      metadata: {
        uptimeSeconds,
        uptimeHours: Math.round(uptimeHours * 100) / 100,
      },
    };
  },
});