import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import type {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiErrorCode,
  HttpStatus,
} from '@studymate/shared';

/**
 * API Utilities for Next.js API Routes
 *
 * Helper functions for consistent API responses and error handling
 */

// ============================================================================
// SUCCESS RESPONSES
// ============================================================================

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: HttpStatus = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * Create a created response (201)
 */
export function createdResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, message, 201);
}

/**
 * Create a no content response (204)
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

// ============================================================================
// ERROR RESPONSES
// ============================================================================

/**
 * Create an error response
 */
export function errorResponse(
  code: ApiErrorCode | string,
  message: string,
  status: HttpStatus = 500,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}

/**
 * Handle Zod validation errors
 */
export function validationErrorResponse(
  error: ZodError<any>
): NextResponse<ApiErrorResponse> {
  const formattedErrors = (error as any).errors.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return errorResponse(
    'VALIDATION_ERROR',
    'Validation failed',
    400,
    formattedErrors
  );
}

/**
 * Handle not found errors
 */
export function notFoundResponse(
  resource: string = 'Resource'
): NextResponse<ApiErrorResponse> {
  return errorResponse('NOT_FOUND', `${resource} not found`, 404);
}

/**
 * Handle method not allowed errors
 */
export function methodNotAllowedResponse(
  allowedMethods: string[]
): NextResponse<ApiErrorResponse> {
  const response = errorResponse(
    'METHOD_NOT_ALLOWED',
    `Method not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
    405
  );

  response.headers.set('Allow', allowedMethods.join(', '));
  return response;
}

/**
 * Handle database errors
 */
export function databaseErrorResponse(
  error: Error
): NextResponse<ApiErrorResponse> {
  console.error('Database error:', error);

  // Check for duplicate key error (MongoDB code 11000)
  if ('code' in error && error.code === 11000) {
    return errorResponse(
      'DUPLICATE_ENTRY',
      'A record with this data already exists',
      409
    );
  }

  return errorResponse(
    'DATABASE_QUERY_ERROR',
    'Database operation failed',
    500,
    process.env.NODE_ENV === 'development' ? error.message : undefined
  );
}

/**
 * Handle internal server errors
 */
export function internalServerErrorResponse(
  error?: Error
): NextResponse<ApiErrorResponse> {
  if (error) {
    console.error('Internal server error:', error);
  }

  return errorResponse(
    'INTERNAL_SERVER_ERROR',
    'An unexpected error occurred',
    500,
    process.env.NODE_ENV === 'development' && error ? error.message : undefined
  );
}

// ============================================================================
// ERROR HANDLER
// ============================================================================

/**
 * Centralized error handler for API routes
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  // Zod validation error
  if (error instanceof ZodError) {
    return validationErrorResponse(error);
  }

  // Standard Error
  if (error instanceof Error) {
    // Check for MongoDB errors
    if ('code' in error) {
      return databaseErrorResponse(error);
    }

    return internalServerErrorResponse(error);
  }

  // Unknown error
  return internalServerErrorResponse();
}

// ============================================================================
// REQUEST HELPERS
// ============================================================================

/**
 * Parse query parameters for pagination
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('limit') || '20', 10))
  );
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

  return { page, limit, sortBy, sortOrder };
}

/**
 * Validate MongoDB ObjectId format
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}
