import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { AIService } from '../interfaces/AIService';
import type {
  AIGenerationRequest,
  AIGenerationResponse,
  AIRetryConfig,
  AIRateLimitInfo,
  AIServiceError,
  AIErrorType,
} from '@studymate/shared';
import { DEFAULT_RETRY_CONFIG } from '@studymate/shared';

/**
 * GeminiService Implementation
 *
 * Implements AI generation using Google's Gemini 1.5 Pro model
 * Features:
 * - 1M token context window
 * - Retry logic with exponential backoff
 * - Rate limiting awareness
 * - Health checking
 */
export class GeminiService extends AIService {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  private rateLimitInfo: AIRateLimitInfo | null = null;

  constructor(apiKey: string) {
    super(apiKey);

    this.client = new GoogleGenerativeAI(apiKey);

    // Use gemini-pro model
    this.model = this.client.getGenerativeModel({
      model: 'gemini-pro',
    });
  }

  /**
   * Generate content using Gemini
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
    // Build prompt with system instruction and context
    let fullPrompt = request.prompt;

    if (request.systemPrompt) {
      fullPrompt = `${request.systemPrompt}\n\n${fullPrompt}`;
    }

    if (request.contextDocuments && request.contextDocuments.length > 0) {
      const context = request.contextDocuments.join('\n\n---\n\n');
      fullPrompt = `CONTEXT:\n${context}\n\n---\n\nTASK:\n${fullPrompt}`;
    }

    // Generate config
    const generationConfig = {
      temperature: request.config?.temperature ?? 1,
      topP: request.config?.topP ?? 0.95,
      topK: request.config?.topK ?? 40,
      maxOutputTokens: request.config?.maxTokens ?? 8192,
      stopSequences: request.config?.stopSequences,
    };

    // Generate content
    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig,
    });

    const response = result.response;
    const text = response.text();

    // Extract usage metadata
    const usageMetadata = response.usageMetadata;
    const tokensUsed =
      (usageMetadata?.promptTokenCount || 0) +
      (usageMetadata?.candidatesTokenCount || 0);

    // Determine finish reason
    const finishReason = this.mapFinishReason(
      response.candidates?.[0]?.finishReason
    );

    return {
      content: text,
      model: 'gemini',
      modelVersion: 'gemini-pro',
      tokensUsed,
      durationMs: 0, // Will be calculated by caller
      finishReason,
      metadata: {
        temperature: generationConfig.temperature,
        maxTokens: generationConfig.maxOutputTokens,
        promptTokens: usageMetadata?.promptTokenCount,
        completionTokens: usageMetadata?.candidatesTokenCount,
      },
    };
  }

  /**
   * Health check for Gemini API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        generationConfig: { maxOutputTokens: 10 },
      });

      return !!result.response.text();
    } catch (error) {
      console.error('Gemini health check failed:', error);
      return false;
    }
  }

  /**
   * Get rate limit information
   * Note: Gemini doesn't expose rate limits in headers, so this is estimated
   */
  getRateLimitInfo(): AIRateLimitInfo | null {
    return (
      this.rateLimitInfo || {
        requestsPerMinute: 60, // Gemini free tier: ~60 RPM
        tokensPerMinute: 1000000, // 1M TPM for free tier
      }
    );
  }

  /**
   * Map Gemini finish reason to our standard format
   */
  private mapFinishReason(
    finishReason?: string
  ): 'stop' | 'length' | 'error' | 'other' {
    switch (finishReason) {
      case 'STOP':
        return 'stop';
      case 'MAX_TOKENS':
        return 'length';
      case 'SAFETY':
      case 'RECITATION':
        return 'error';
      default:
        return 'other';
    }
  }

  /**
   * Determine error type from Gemini error
   */
  private getErrorType(error: unknown): AIErrorType {
    if (error && typeof error === 'object') {
      const err = error as any;

      // Check status code
      if (err.status === 429 || err.message?.includes('quota')) {
        return 'RATE_LIMIT';
      }

      if (err.status === 401 || err.status === 403) {
        return 'AUTHENTICATION_ERROR';
      }

      if (err.status === 400) {
        return 'INVALID_REQUEST';
      }

      if (err.message?.includes('timeout')) {
        return 'TIMEOUT';
      }

      if (err.message?.includes('network')) {
        return 'NETWORK_ERROR';
      }
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Wrap native error into AIServiceError
   */
  private wrapError(error: unknown): AIServiceError {
    const errorType = this.getErrorType(error);
    const message =
      error instanceof Error ? error.message : 'Unknown Gemini error';
    const retryable = [
      'RATE_LIMIT',
      'TIMEOUT',
      'NETWORK_ERROR',
    ].includes(errorType);

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
