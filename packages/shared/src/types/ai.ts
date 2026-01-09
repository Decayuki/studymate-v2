/**
 * AI Service Types
 *
 * Types for AI generation requests and responses
 * Supports both Gemini 1.5 Pro and Claude 3.5 Sonnet
 */

// ============================================================================
// AI MODELS & CONFIGURATION
// ============================================================================

export type AIModel = 'gemini' | 'claude';

export type AIModelVersion =
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-20241022';

/**
 * AI Generation Configuration
 */
export interface AIGenerationConfig {
  model: AIModel;
  temperature?: number; // 0-2 (default: 1)
  maxTokens?: number; // Max tokens to generate
  topP?: number; // 0-1 (default: 0.95)
  topK?: number; // Gemini only (default: 40)
  stopSequences?: string[]; // Optional stop sequences
}

// ============================================================================
// AI REQUEST & RESPONSE
// ============================================================================

/**
 * AI Generation Request
 */
export interface AIGenerationRequest {
  prompt: string;
  config?: Partial<AIGenerationConfig>;
  systemPrompt?: string; // System message for Claude, instruction for Gemini
  contextDocuments?: string[]; // Additional context (e.g., full course content)
}

/**
 * AI Generation Response
 */
export interface AIGenerationResponse {
  content: string;
  model: AIModel;
  modelVersion: string;
  tokensUsed: number;
  durationMs: number;
  finishReason: 'stop' | 'length' | 'error' | 'other';
  metadata?: {
    temperature?: number;
    maxTokens?: number;
    promptTokens?: number;
    completionTokens?: number;
  };
}

// ============================================================================
// AI ERRORS
// ============================================================================

/**
 * AI Error Types
 */
export enum AIErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  TOKEN_LIMIT = 'TOKEN_LIMIT',
  TIMEOUT = 'TIMEOUT',
  INVALID_REQUEST = 'INVALID_REQUEST',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * AI Service Error
 */
export class AIServiceError extends Error {
  constructor(
    public type: AIErrorType,
    message: string,
    public originalError?: unknown,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

// ============================================================================
// RETRY CONFIGURATION
// ============================================================================

/**
 * Retry Configuration for AI requests
 */
export interface AIRetryConfig {
  maxRetries: number; // Default: 3
  initialDelayMs: number; // Default: 1000
  maxDelayMs: number; // Default: 10000
  backoffMultiplier: number; // Default: 2 (exponential)
  retryableErrors: AIErrorType[];
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: AIRetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    AIErrorType.RATE_LIMIT,
    AIErrorType.TIMEOUT,
    AIErrorType.NETWORK_ERROR,
  ],
};

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Rate Limit Info
 */
export interface AIRateLimitInfo {
  requestsPerMinute: number;
  tokensPerMinute: number;
  requestsRemaining?: number;
  tokensRemaining?: number;
  resetAt?: Date;
}

// ============================================================================
// AI SERVICE STATS
// ============================================================================

/**
 * AI Service Usage Stats
 */
export interface AIServiceStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokensUsed: number;
  averageLatencyMs: number;
  errorsByType: Record<AIErrorType, number>;
}

// ============================================================================
// CONTENT GENERATION TYPES
// ============================================================================

import type { ContentType, EducationLevel } from './database';

/**
 * Content Generation Context
 * Used for generating TD/Control based on existing course
 */

/**
 * Content Generation Context
 * Used for generating TD/Control based on existing course
 */
export interface ContentGenerationContext {
  contentType: ContentType;
  subject: string;
  level: EducationLevel;
  title: string;
  courseMaterial?: string; // Full course content for TD/Control generation
  additionalInstructions?: string;
}

/**
 * Prompt Template Variables
 */
export interface PromptTemplateVariables {
  [key: string]: string | number | boolean | undefined;
}
