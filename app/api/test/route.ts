import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/test
 * Simple connectivity test endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'API is working',
    data: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      database: process.env.MONGODB_URI ? 'configured' : 'not configured',
      gemini: process.env.GEMINI_API_KEY ? 'configured' : 'not configured',
    }
  });
}