import Anthropic from '@anthropic-ai/sdk';
import { AIService } from '../interfaces/AIService';
import type {
  AIGenerationRequest,
  AIGenerationResponse,
  AIRetryConfig,
  AIRateLimitInfo,
  AIServiceError,
} from '@studymate/shared';
import {
  AIErrorType,
  DEFAULT_RETRY_CONFIG,
} from '@studymate/shared';

/**
 * ClaudeService Implementation
 *
 * Implements AI generation using Anthropic's Claude 3.5 Sonnet model
 * Features:
 * - 200K token context window
 * - System message support
 * - Retry logic with exponential backoff
 * - Rate limiting awareness
 * - Health checking
 */
export class ClaudeService extends AIService {
  private client: Anthropic;
  private rateLimitInfo: AIRateLimitInfo | null = null;
  private readonly modelVersion = 'claude-3-5-sonnet-20241022';

  constructor(apiKey: string) {
    super(apiKey);

    this.client = new Anthropic({
      apiKey: apiKey,
    });
  }

  /**
   * Generate content using Claude
   */
  async generate(
    request: AIGenerationRequest,
    retryConfig?: Partial<AIRetryConfig>
  ): Promise<AIGenerationResponse> {
    const startTime = Date.now();
    const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

    try {
      const result = await this.executeWithRetry(
        () => this.generateInternal(request),
        config
      );

      const latency = Date.now() - startTime;
      this.updateStats(true, result.tokensUsed, latency);

      return result;
    } catch (error) {
      const latency = Date.now() - startTime;
      const errorType = this.getErrorType(error);
      this.updateStats(false, 0, latency, errorType);

      throw this.wrapError(error);
    }
  }

  /**
   * Internal generation method (called with retry logic)
   */
  private async generateInternal(
    request: AIGenerationRequest
  ): Promise<AIGenerationResponse> {
    // Build messages array with context if provided
    let userMessage = request.prompt;

    if (request.contextDocuments && request.contextDocuments.length > 0) {
      const context = request.contextDocuments.join('\n\n---\n\n');
      userMessage = `<context>\n${context}\n</context>\n\n<task>\n${request.prompt}\n</task>`;
    }

    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // Generate content
    const response = await this.client.messages.create({
      model: this.modelVersion,
      max_tokens: request.config?.maxTokens ?? 8192,
      temperature: request.config?.temperature ?? 1,
      top_p: request.config?.topP ?? 0.95,
      system: request.systemPrompt,
      messages,
      stop_sequences: request.config?.stopSequences,
    });

    // Extract rate limit info from headers if available
    this.updateRateLimitInfo(response);

    // Extract content
    const content =
      response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as Anthropic.TextBlock).text)
        .join('\n\n') || '';

    // Calculate tokens used
    const tokensUsed =
      response.usage.input_tokens + response.usage.output_tokens;

    // Map finish reason
    const finishReason = this.mapStopReason(response.stop_reason);

    return {
      content,
      model: 'claude',
      modelVersion: this.modelVersion,
      tokensUsed,
      durationMs: 0, // Will be calculated by caller
      finishReason,
      metadata: {
        temperature: request.config?.temperature ?? 1,
        maxTokens: request.config?.maxTokens ?? 8192,
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
      },
    };
  }

  /**
   * Health check for Claude API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.messages.create({
        model: this.modelVersion,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }],
      });

      return response.content.length > 0;
    } catch (error) {
      console.error('Claude health check failed:', error);
      return false;
    }
  }

  /**
   * Get rate limit information
   */
  getRateLimitInfo(): AIRateLimitInfo | null {
    return this.rateLimitInfo;
  }

  /**
   * Update rate limit info from response headers
   */
  private updateRateLimitInfo(response: Anthropic.Message): void {
    // Anthropic includes rate limit info in response headers
    // This would need to be extracted from the raw HTTP response
    // For now, use known limits for Claude 3.5 Sonnet

    this.rateLimitInfo = {
      requestsPerMinute: 50, // Tier 1: 50 RPM
      tokensPerMinute: 40000, // Tier 1: 40K TPM
      requestsRemaining: undefined, // Would come from headers
      tokensRemaining: undefined, // Would come from headers
    };
  }

  /**
   * Map Claude stop reason to our standard format
   */
  private mapStopReason(
    stopReason: string | null
  ): 'stop' | 'length' | 'error' | 'other' {
    switch (stopReason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      default:
        return 'other';
    }
  }

  /**
   * Determine error type from Claude error
   */
  private getErrorType(error: unknown): AIErrorType {
    if (error instanceof Anthropic.APIError) {
      // Rate limit error
      if (error.status === 429) {
        return AIErrorType.RATE_LIMIT;
      }

      // Authentication error
      if (error.status === 401 || error.status === 403) {
        return AIErrorType.AUTHENTICATION_ERROR;
      }

      // Invalid request
      if (error.status === 400) {
        return AIErrorType.INVALID_REQUEST;
      }

      // Overloaded (temporarily unavailable)
      if (error.status === 529) {
        return AIErrorType.RATE_LIMIT;
      }
    }

    if (error instanceof Anthropic.APIConnectionError) {
      return AIErrorType.NETWORK_ERROR;
    }

    if (error instanceof Anthropic.APIConnectionTimeoutError) {
      return AIErrorType.TIMEOUT;
    }

    return AIErrorType.UNKNOWN_ERROR;
  }

  /**
   * Wrap native error into AIServiceError
   */
  private wrapError(error: unknown): AIServiceError {
    const errorType = this.getErrorType(error);
    const message =
      error instanceof Error ? error.message : 'Unknown Claude error';
    const retryable = [AIErrorType.RATE_LIMIT, AIErrorType.TIMEOUT, AIErrorType.NETWORK_ERROR].includes(
      errorType
    );

    const aiError = new Error(message) as AIServiceError;
    aiError.name = 'AIServiceError';
    aiError.type = errorType;
    aiError.originalError = error;
    aiError.retryable = retryable;

    return aiError;
  }

  /**
   * Check if error is retryable
   */
  protected isRetryableError(
    error: unknown,
    retryConfig: AIRetryConfig
  ): boolean {
    const errorType = this.getErrorType(error);
    return retryConfig.retryableErrors.includes(errorType);
  }
}
