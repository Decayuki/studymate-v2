/**
 * API Response Types
 *
 * Standardized response formats for all API endpoints
 */

// ============================================================================
// GENERIC API RESPONSES
// ============================================================================

/**
 * Success response wrapper
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Error response wrapper
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// PAGINATION RESPONSES
// ============================================================================

/**
 * Paginated response wrapper
 */
export interface ApiPaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ============================================================================
// ERROR CODES
// ============================================================================

export enum ApiErrorCode {
  // General errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',

  // Database errors
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

  // AI Service errors
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  AI_RATE_LIMIT = 'AI_RATE_LIMIT',
  AI_TIMEOUT = 'AI_TIMEOUT',
  AI_TOKEN_LIMIT_EXCEEDED = 'AI_TOKEN_LIMIT_EXCEEDED',

  // Notion Integration errors
  NOTION_API_ERROR = 'NOTION_API_ERROR',
  NOTION_RATE_LIMIT = 'NOTION_RATE_LIMIT',
  NOTION_PAGE_NOT_FOUND = 'NOTION_PAGE_NOT_FOUND',

  // Content errors
  VERSION_LIMIT_EXCEEDED = 'VERSION_LIMIT_EXCEEDED',
  VERSION_NOT_FOUND = 'VERSION_NOT_FOUND',
  INVALID_VERSION_STATUS = 'INVALID_VERSION_STATUS',
  CONTENT_ALREADY_PUBLISHED = 'CONTENT_ALREADY_PUBLISHED',
}

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Query parameters for list endpoints
 */
export interface ListQueryParams {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Subject list query parameters
 */
export interface SubjectListQueryParams extends ListQueryParams {
  level?: 'lycee' | 'superieur';
  search?: string;
}

/**
 * Content list query parameters
 */
export interface ContentListQueryParams extends ListQueryParams {
  subject?: string;
  type?: 'course' | 'td' | 'control';
  status?: 'draft' | 'comparing' | 'published' | 'rejected';
  aiModel?: 'gemini' | 'claude';
}
