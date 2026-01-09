import { NextRequest } from 'next/server';
import { healthChecker } from '@/lib/performance-utils';
import { errorLogger } from '@/lib/error-handling';
import { connectToDatabase } from '@studymate/db';

/**
 * GET /api/health
 * System health check endpoint for monitoring and observability
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Register database health check
    healthChecker.register({
      name: 'database',
      check: async () => {
        try {
          await connectToDatabase();
          return {
            healthy: true,
            message: 'Database connection successful',
          };
        } catch (error) {
          return {
            healthy: false,
            message: error instanceof Error ? error.message : 'Database connection failed',
          };
        }
      },
      timeout: 3000,
    });

    // Register error log health check
    healthChecker.register({
      name: 'errors',
      check: async () => {
        const errorStats = errorLogger.getStats();
        const recentUnresolved = errorStats.unresolved;
        const isHealthy = recentUnresolved < 10; // Threshold of 10 unresolved errors
        
        return {
          healthy: isHealthy,
          message: isHealthy 
            ? 'Error levels are normal' 
            : `High number of unresolved errors: ${recentUnresolved}`,
          metadata: errorStats,
        };
      },
    });

    // Run all health checks
    const healthReport = await healthChecker.runAllChecks();
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Determine overall status code
    const statusCode = healthReport.healthy ? 200 : 503;
    
    const response = {
      status: healthReport.healthy ? 'healthy' : 'unhealthy',
      timestamp: healthReport.timestamp,
      responseTime,
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: healthReport.checks,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version,
        platform: process.platform,
      },
    };

    return Response.json(response, { status: statusCode });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return Response.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}