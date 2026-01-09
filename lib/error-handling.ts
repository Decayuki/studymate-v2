/**
 * Production-Ready Error Handling System
 * Comprehensive error management with logging, monitoring, and user-friendly messages
 */

import { NextResponse } from 'next/server';

// ============================================================================
// ERROR TYPES AND INTERFACES
// ============================================================================

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  userAgent?: string;
  timestamp: Date;
  additionalData?: Record<string, any>;
}

export interface ErrorLogEntry {
  id: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  code: string;
  stack?: string;
  context: ErrorContext;
  resolved: boolean;
  createdAt: Date;
}

export enum ErrorCodes {
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_OBJECT_ID = 'INVALID_OBJECT_ID',
  
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Database Errors
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  
  // AI Service Errors
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  AI_QUOTA_EXCEEDED = 'AI_QUOTA_EXCEEDED',
  AI_GENERATION_TIMEOUT = 'AI_GENERATION_TIMEOUT',
  AI_CONTENT_FILTERED = 'AI_CONTENT_FILTERED',
  
  // External Services
  NOTION_API_ERROR = 'NOTION_API_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Internal Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  FEATURE_NOT_IMPLEMENTED = 'FEATURE_NOT_IMPLEMENTED',
  
  // Business Logic Errors
  INVALID_OPERATION = 'INVALID_OPERATION',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
}

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context: Partial<ErrorContext>;

  constructor(
    message: string,
    code: string = ErrorCodes.INTERNAL_SERVER_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true,
    context: Partial<ErrorContext> = {}
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = {
      ...context,
      timestamp: new Date(),
    };

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string, context?: Partial<ErrorContext>) {
    super(
      message,
      ErrorCodes.VALIDATION_ERROR,
      400,
      true,
      { ...context, field }
    );
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string, context?: Partial<ErrorContext>) {
    super(
      `${resource}${id ? ` with ID ${id}` : ''} not found`,
      ErrorCodes.DOCUMENT_NOT_FOUND,
      404,
      true,
      { ...context, resource, resourceId: id }
    );
  }
}

export class AIServiceError extends AppError {
  constructor(
    message: string, 
    code: string = ErrorCodes.AI_SERVICE_UNAVAILABLE,
    context?: Partial<ErrorContext>
  ) {
    super(message, code, 503, true, context);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, operation?: string, context?: Partial<ErrorContext>) {
    super(
      message,
      ErrorCodes.DATABASE_QUERY_ERROR,
      500,
      false,
      { ...context, operation }
    );
  }
}

// ============================================================================
// ERROR LOGGER
// ============================================================================

class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 1000;

  log(error: Error | AppError, level: 'error' | 'warn' | 'info' = 'error', context: Partial<ErrorContext> = {}) {
    const id = this.generateId();
    const isAppError = error instanceof AppError;
    
    const logEntry: ErrorLogEntry = {
      id,
      level,
      message: error.message,
      code: isAppError ? error.code : ErrorCodes.INTERNAL_SERVER_ERROR,
      stack: error.stack,
      context: {
        timestamp: new Date(),
        ...context,
        ...(isAppError ? error.context : {}),
      },
      resolved: false,
      createdAt: new Date(),
    };

    this.logs.unshift(logEntry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${level.toUpperCase()}] ${error.message}`, {
        code: logEntry.code,
        context: logEntry.context,
        stack: error.stack,
      });
    }

    // In production, you would send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(logEntry);
    }

    return id;
  }

  getLogs(limit = 50): ErrorLogEntry[] {
    return this.logs.slice(0, limit);
  }

  getLogById(id: string): ErrorLogEntry | undefined {
    return this.logs.find(log => log.id === id);
  }

  markResolved(id: string): boolean {
    const log = this.logs.find(log => log.id === id);
    if (log) {
      log.resolved = true;
      return true;
    }
    return false;
  }

  getStats(): { total: number; unresolved: number; byLevel: Record<string, number> } {
    const total = this.logs.length;
    const unresolved = this.logs.filter(log => !log.resolved).length;
    const byLevel = this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, unresolved, byLevel };
  }

  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sendToExternalLogger(logEntry: ErrorLogEntry) {
    // Placeholder for external logging service (e.g., Sentry, LogRocket, etc.)
    // In a real production environment, you would implement this
    console.warn('External logging not implemented:', logEntry.id);
  }
}

export const errorLogger = new ErrorLogger();

// ============================================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================================

export class ErrorHandler {
  static handle(error: Error | AppError, context: Partial<ErrorContext> = {}): NextResponse {
    const isAppError = error instanceof AppError;
    const isOperational = isAppError ? error.isOperational : false;
    
    // Log the error
    const logLevel = this.getLogLevel(error);
    const logId = errorLogger.log(error, logLevel, context);

    // Determine response
    const statusCode = isAppError ? error.statusCode : 500;
    const errorCode = isAppError ? error.code : ErrorCodes.INTERNAL_SERVER_ERROR;

    // Create user-friendly response
    const response = {
      success: false,
      error: {
        code: errorCode,
        message: this.getUserFriendlyMessage(error),
        logId,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && {
          originalMessage: error.message,
          stack: error.stack,
          context: isAppError ? error.context : {},
        }),
      },
    };

    // For non-operational errors, alert the development team
    if (!isOperational) {
      this.alertDevelopmentTeam(error, logId, context);
    }

    return NextResponse.json(response, { status: statusCode });
  }

  private static getLogLevel(error: Error | AppError): 'error' | 'warn' | 'info' {
    if (error instanceof AppError) {
      if (error.statusCode >= 500) return 'error';
      if (error.statusCode >= 400) return 'warn';
      return 'info';
    }
    return 'error';
  }

  private static getUserFriendlyMessage(error: Error | AppError): string {
    if (error instanceof AppError) {
      const friendlyMessages: Record<string, string> = {
        [ErrorCodes.VALIDATION_ERROR]: 'Les données fournies ne sont pas valides. Veuillez vérifier votre saisie.',
        [ErrorCodes.DOCUMENT_NOT_FOUND]: 'La ressource demandée n\'a pas été trouvée.',
        [ErrorCodes.UNAUTHORIZED]: 'Vous n\'êtes pas autorisé à accéder à cette ressource.',
        [ErrorCodes.FORBIDDEN]: 'Vous n\'avez pas les permissions nécessaires.',
        [ErrorCodes.AI_SERVICE_UNAVAILABLE]: 'Le service d\'IA est temporairement indisponible. Veuillez réessayer plus tard.',
        [ErrorCodes.AI_QUOTA_EXCEEDED]: 'Quota d\'utilisation IA atteint. Veuillez réessayer plus tard.',
        [ErrorCodes.AI_GENERATION_TIMEOUT]: 'La génération de contenu a pris trop de temps. Veuillez réessayer.',
        [ErrorCodes.DATABASE_CONNECTION_ERROR]: 'Problème de connexion à la base de données. Veuillez réessayer.',
        [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Trop de requêtes. Veuillez patienter avant de réessayer.',
        [ErrorCodes.DUPLICATE_ENTRY]: 'Cette ressource existe déjà.',
        [ErrorCodes.INVALID_OPERATION]: 'Cette opération n\'est pas autorisée.',
        [ErrorCodes.NOTION_API_ERROR]: 'Erreur lors de la publication sur Notion. Veuillez réessayer.',
      };

      return friendlyMessages[error.code] || error.message;
    }

    return 'Une erreur interne s\'est produite. Notre équipe a été notifiée.';
  }

  private static alertDevelopmentTeam(error: Error, logId: string, context: Partial<ErrorContext>) {
    // Placeholder for alerting system (e.g., Slack, email, PagerDuty)
    console.error(`🚨 Critical error [${logId}]:`, {
      message: error.message,
      stack: error.stack,
      context,
    });
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export class ValidationHelper {
  static validateObjectId(id: string, fieldName: string = 'ID'): void {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(id)) {
      throw new ValidationError(`${fieldName} format is invalid`, fieldName);
    }
  }

  static validateRequired(value: any, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }
  }

  static validateStringLength(
    value: string, 
    fieldName: string, 
    min?: number, 
    max?: number
  ): void {
    if (min !== undefined && value.length < min) {
      throw new ValidationError(
        `${fieldName} must be at least ${min} characters long`,
        fieldName
      );
    }
    if (max !== undefined && value.length > max) {
      throw new ValidationError(
        `${fieldName} must be at most ${max} characters long`,
        fieldName
      );
    }
  }

  static validateEnum<T>(
    value: string, 
    validValues: T[], 
    fieldName: string
  ): void {
    if (!validValues.includes(value as T)) {
      throw new ValidationError(
        `${fieldName} must be one of: ${validValues.join(', ')}`,
        fieldName
      );
    }
  }

  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format', 'email');
    }
  }

  static validateNumber(
    value: number, 
    fieldName: string, 
    min?: number, 
    max?: number
  ): void {
    if (isNaN(value)) {
      throw new ValidationError(`${fieldName} must be a valid number`, fieldName);
    }
    if (min !== undefined && value < min) {
      throw new ValidationError(
        `${fieldName} must be at least ${min}`,
        fieldName
      );
    }
    if (max !== undefined && value > max) {
      throw new ValidationError(
        `${fieldName} must be at most ${max}`,
        fieldName
      );
    }
  }
}

// ============================================================================
// RETRY MECHANISM
// ============================================================================

export class RetryHelper {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delayMs: number = 1000,
    backoffMultiplier: number = 2
  ): Promise<T> {
    let lastError: Error;
    let delay = delayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          break;
        }

        // Don't retry on validation errors or client errors
        if (error instanceof AppError && error.statusCode < 500) {
          throw error;
        }

        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
        await this.sleep(delay);
        delay *= backoffMultiplier;
      }
    }

    throw new AppError(
      `Operation failed after ${maxAttempts} attempts: ${lastError.message}`,
      ErrorCodes.INTERNAL_SERVER_ERROR,
      500,
      false,
      { originalError: lastError.message, maxAttempts }
    );
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// CIRCUIT BREAKER PATTERN
// ============================================================================

export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime?: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private maxFailures: number = 5,
    private timeoutMs: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new AppError(
          'Service temporarily unavailable (Circuit breaker is OPEN)',
          ErrorCodes.AI_SERVICE_UNAVAILABLE,
          503
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    return this.lastFailureTime && 
           (Date.now() - this.lastFailureTime.getTime()) >= this.timeoutMs;
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.maxFailures) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export class PerformanceMonitor {
  private static measurements: Map<string, number[]> = new Map();

  static startMeasurement(operationName: string): string {
    const measurementId = `${operationName}_${Date.now()}_${Math.random()}`;
    const startTime = performance.now();
    
    // Store start time temporarily
    this.measurements.set(measurementId, [startTime]);
    
    return measurementId;
  }

  static endMeasurement(measurementId: string): number | null {
    const measurement = this.measurements.get(measurementId);
    if (!measurement) return null;

    const endTime = performance.now();
    const duration = endTime - measurement[0];
    
    // Store the duration
    measurement[1] = duration;
    
    // Log slow operations
    if (duration > 5000) { // 5 seconds
      console.warn(`Slow operation detected: ${measurementId} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  static async measure<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
    const measurementId = this.startMeasurement(operationName);
    
    try {
      const result = await operation();
      this.endMeasurement(measurementId);
      return result;
    } catch (error) {
      this.endMeasurement(measurementId);
      throw error;
    }
  }

  static getStats(operationName?: string): Record<string, any> {
    if (operationName) {
      const measurements = Array.from(this.measurements.entries())
        .filter(([key]) => key.startsWith(operationName))
        .map(([, value]) => value[1])
        .filter(Boolean);

      if (measurements.length === 0) return {};

      return {
        count: measurements.length,
        avg: measurements.reduce((a, b) => a + b, 0) / measurements.length,
        min: Math.min(...measurements),
        max: Math.max(...measurements),
      };
    }

    // Return all stats
    return Object.fromEntries(
      Array.from(new Set(Array.from(this.measurements.keys()).map(key => key.split('_')[0])))
        .map(op => [op, this.getStats(op)])
    );
  }
}