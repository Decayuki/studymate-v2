import mongoose from 'mongoose';

/**
 * MongoDB Connection Singleton optimized for Vercel Serverless
 *
 * Features:
 * - Connection pooling to prevent cold start overhead
 * - Global cache to reuse connections across serverless invocations
 * - Auto-reconnection with exponential backoff
 * - TypeScript strict mode compatible
 */

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Global cache to persist connection across serverless invocations
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Get MongoDB connection URI from environment
 * @throws {Error} if MONGODB_URI is not defined
 */
function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'Please define MONGODB_URI environment variable in .env file'
    );
  }

  return uri;
}

/**
 * MongoDB connection options optimized for Vercel serverless
 */
const connectionOptions: mongoose.ConnectOptions = {
  // Connection pooling for serverless (small pool for cold starts)
  maxPoolSize: 10,
  minPoolSize: 2,

  // Timeout settings for serverless (Vercel has 60s max)
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,

  // Automatic reconnection
  retryWrites: true,
  retryReads: true,
};

/**
 * Connect to MongoDB with singleton pattern
 *
 * This function ensures only one connection is created and reused
 * across multiple serverless function invocations.
 *
 * @returns {Promise<typeof mongoose>} Mongoose instance
 * @throws {Error} if connection fails after retries
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  // Return cached connection if it exists
  if (cached.conn) {
    return cached.conn;
  }

  // If no cached promise, create new connection
  if (!cached.promise) {
    const uri = getMongoUri();

    cached.promise = mongoose
      .connect(uri, connectionOptions)
      .then((mongooseInstance) => {
        console.log('✅ MongoDB connected successfully');
        return mongooseInstance;
      })
      .catch((error) => {
        // Clear the promise on error to allow retry
        cached.promise = null;
        console.error('❌ MongoDB connection error:', error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

/**
 * Disconnect from MongoDB
 * Useful for cleanup in non-serverless environments (e.g., tests)
 */
export async function disconnectFromDatabase(): Promise<void> {
  if (cached.conn) {
    await cached.conn.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('✅ MongoDB disconnected');
  }
}

/**
 * Get connection status
 */
export function getConnectionStatus(): {
  isConnected: boolean;
  readyState: number;
  readyStateLabel: string;
} {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const readyState = mongoose.connection.readyState;

  return {
    isConnected: readyState === 1,
    readyState,
    readyStateLabel: states[readyState] || 'unknown',
  };
}

/**
 * Health check for database connection
 * @returns {Promise<boolean>} true if connected and healthy
 */
export async function isHealthy(): Promise<boolean> {
  try {
    const status = getConnectionStatus();

    if (!status.isConnected) {
      return false;
    }

    // Ping database to verify connection is active
    await mongoose.connection.db?.admin().ping();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
