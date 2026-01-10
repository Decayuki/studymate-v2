import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@studymate/db';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG API ===');
    console.log('Environment variables:');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    console.log('Attempting database connection...');
    const mongoose = await connectToDatabase();
    console.log('Database connection successful!');
    console.log('Connection ready state:', mongoose.connection.readyState);
    
    // Test simple query
    const collections = await mongoose.connection.db?.listCollections().toArray();
    console.log('Available collections:', collections?.map(c => c.name));
    
    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        readyState: mongoose.connection.readyState,
        collections: collections?.map(c => c.name) || [],
      },
      environment: {
        mongoUri: process.env.MONGODB_URI ? 'configured' : 'missing',
        nodeEnv: process.env.NODE_ENV,
      }
    });
  } catch (error) {
    console.error('Debug API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      environment: {
        mongoUri: process.env.MONGODB_URI ? 'configured' : 'missing',
        nodeEnv: process.env.NODE_ENV,
      }
    }, { status: 500 });
  }
}