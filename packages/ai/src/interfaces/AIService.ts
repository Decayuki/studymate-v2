import type {
  AIGenerationRequest,
  AIGenerationResponse,
  AIRetryConfig,
  AIServiceStats,
  AIRateLimitInfo,
  AIErrorType,
} from '@studymate/shared';

/**
 * AIService Abstract Interface
 *
 * This interface defines the contract for all AI service implementations.
 * Both GeminiService and ClaudeService implement this interface.
 */
export class AIService {
  protected apiKey: string;
  protected stats: AIServiceStats;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('API key is required for AI service');
    }

    this.apiKey = apiKey;
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokensUsed: 0,
      averageLatencyMs: 0,
      errorsByType: {} as Record<string, number>,
    };
  }

  /**
   * Generate content using the AI model
   *
   * @param request - Generation request with prompt and config
   * @param retryConfig - Optional retry configuration
   * @returns Promise with generated content and metadata
   */
  async generate(
    request: AIGenerationRequest,
    retryConfig?: Partial<AIRetryConfig>
  ): Promise<AIGenerationResponse> {
    throw new Error('Method not implemented.');
  }

  /**
   * Check if the service is healthy and can make requests
   *
   * @returns Promise<boolean> indicating service health
   */
  async healthCheck(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  /**
   * Get current rate limit information
   *
   * @returns Rate limit info if available
   */
  getRateLimitInfo(): AIRateLimitInfo | null {
    throw new Error('Method not implemented.');
  }

  /**
   * Get service usage statistics
   *
   * @returns Current service stats
   */
  getStats(): AIServiceStats {
    return { ...this.stats };
  }

  /**
   * Reset service statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokensUsed: 0,
      averageLatencyMs: 0,
      errorsByType: {} as Record<string, number>,
    };
  }

  /**
   * Update stats after a request
   */
  protected updateStats(
    success: boolean,
    tokensUsed: number,
    latencyMs: number,
    errorType?: string
  ): void {
    this.stats.totalRequests++;

    if (success) {
      this.stats.successfulRequests++;
      this.stats.totalTokensUsed += tokensUsed;
    } else {
      this.stats.failedRequests++;
      const key = errorType as AIErrorType;
      this.stats.errorsByType[key] = (this.stats.errorsByType[key] || 0) + 1;
    }

    // Update average latency (running average)
    this.stats.averageLatencyMs =
      (this.stats.averageLatencyMs * (this.stats.totalRequests - 1) +
        latencyMs) /
      this.stats.totalRequests;
  }

  /**
   * Implement exponential backoff retry logic
   */
  protected async executeWithRetry<T>(
    fn: () => Promise<T>,
    retryConfig: AIRetryConfig
  ): Promise<T> {
    let lastError: Error | unknown;
    let delay = retryConfig.initialDelayMs;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        const isRetryable = this.isRetryableError(error, retryConfig);

        // If last attempt or not retryable, throw
        if (attempt === retryConfig.maxRetries || !isRetryable) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        await this.sleep(Math.min(delay, retryConfig.maxDelayMs));
        delay *= retryConfig.backoffMultiplier;
      }
    }

    throw lastError;
  }

  /**
   * Check if error is retryable based on config
   */
  protected isRetryableError(
    error: unknown,
    retryConfig: AIRetryConfig
  ): boolean {
    throw new Error('Method not implemented.');
  }

  /**
   * Sleep utility for retry delays
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
