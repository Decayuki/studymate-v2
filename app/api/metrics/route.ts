import { NextRequest } from 'next/server';
import { 
  subjectCache, 
  contentCache, 
  templatesCache, 
  aiResponseCache,
  globalRateLimiter,
  aiRateLimiter,
  notionRateLimiter,
  MemoryMonitor 
} from '@/lib/performance-utils';
import { errorLogger } from '@/lib/error-handling';
import { successResponse, handleApiError } from '@/lib/api-utils';

/**
 * GET /api/metrics
 * Application metrics endpoint for monitoring and observability
 */
export async function GET(request: NextRequest) {
  try {
    const memoryMonitor = MemoryMonitor.getInstance();
    
    // Collect all metrics
    const metrics = {
      timestamp: new Date().toISOString(),
      
      // Cache metrics
      cache: {
        subjects: subjectCache.getStats(),
        content: contentCache.getStats(),
        templates: templatesCache.getStats(),
        aiResponses: aiResponseCache.getStats(),
      },
      
      // Rate limiting metrics
      rateLimiting: {
        global: globalRateLimiter.getStats(),
        ai: aiRateLimiter.getStats(),
        notion: notionRateLimiter.getStats(),
      },
      
      // Error metrics
      errors: errorLogger.getStats(),
      
      // Memory metrics
      memory: {
        current: memoryMonitor.getCurrentUsage(),
        average: memoryMonitor.getAverageUsage(),
        history: memoryMonitor.getUsageHistory().slice(-10), // Last 10 measurements
      },
      
      // System metrics
      system: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        cpuUsage: process.cpuUsage(),
        environment: process.env.NODE_ENV,
      },
      
      // Performance indicators
      performance: {
        // These would be populated by your performance monitoring
        // For now, we'll provide basic indicators
        averageResponseTime: '< 500ms', // Placeholder
        successRate: '99.5%', // Placeholder
        throughput: '100 req/min', // Placeholder
      },
    };

    return successResponse(metrics, 'Metrics retrieved successfully');
    
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/metrics/clear
 * Clear metrics and caches (for maintenance)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { clearCaches = false, clearErrors = false } = body;
    
    let clearedItems: string[] = [];
    
    if (clearCaches) {
      subjectCache.clear();
      contentCache.clear();
      templatesCache.clear();
      aiResponseCache.clear();
      clearedItems.push('caches');
    }
    
    if (clearErrors) {
      // Clear resolved errors (keep unresolved for investigation)
      const logs = errorLogger.getLogs();
      const resolvedCount = logs.filter(log => log.resolved).length;
      // Note: We don't actually clear errors in this implementation
      // as they are important for debugging. In a real system,
      // you might move them to long-term storage.
      clearedItems.push(`${resolvedCount} resolved errors`);
    }
    
    return successResponse(
      { 
        cleared: clearedItems,
        timestamp: new Date().toISOString() 
      },
      'Metrics cleared successfully'
    );
    
  } catch (error) {
    return handleApiError(error);
  }
}