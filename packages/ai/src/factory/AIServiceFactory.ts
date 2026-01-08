import type { AIModel } from '@studymate/shared';
import { AIService } from '../interfaces/AIService';
import { GeminiService } from '../services/GeminiService';
import { ClaudeService } from '../services/ClaudeService';

/**
 * AIServiceFactory
 *
 * Factory pattern for creating AI service instances
 * Manages API keys from environment variables and service instantiation
 */
export class AIServiceFactory {
  private static geminiInstance: GeminiService | null = null;
  private static claudeInstance: ClaudeService | null = null;

  /**
   * Get or create AI service instance
   *
   * Uses singleton pattern to reuse instances (important for serverless)
   *
   * @param model - 'gemini' or 'claude'
   * @returns AIService instance
   * @throws Error if API key is not configured
   */
  static getService(model: AIModel): AIService {
    switch (model) {
      case 'gemini':
        return this.getGeminiService();
      case 'claude':
        return this.getClaudeService();
      default:
        throw new Error(`Unsupported AI model: ${model}`);
    }
  }

  /**
   * Get or create Gemini service
   */
  private static getGeminiService(): GeminiService {
    if (!this.geminiInstance) {
      const apiKey = this.getGeminiApiKey();
      this.geminiInstance = new GeminiService(apiKey);
    }
    return this.geminiInstance;
  }

  /**
   * Get or create Claude service
   */
  private static getClaudeService(): ClaudeService {
    if (!this.claudeInstance) {
      const apiKey = this.getClaudeApiKey();
      this.claudeInstance = new ClaudeService(apiKey);
    }
    return this.claudeInstance;
  }

  /**
   * Get Gemini API key from environment
   */
  private static getGeminiApiKey(): string {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY environment variable is not set. ' +
          'Please add it to your .env file.'
      );
    }

    return apiKey;
  }

  /**
   * Get Claude API key from environment
   */
  private static getClaudeApiKey(): string {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY environment variable is not set. ' +
          'Please add it to your .env file.'
      );
    }

    return apiKey;
  }

  /**
   * Reset service instances (useful for testing)
   */
  static resetInstances(): void {
    this.geminiInstance = null;
    this.claudeInstance = null;
  }

  /**
   * Check if API keys are configured
   */
  static checkConfiguration(): {
    gemini: boolean;
    claude: boolean;
  } {
    return {
      gemini: !!process.env.GEMINI_API_KEY,
      claude: !!process.env.ANTHROPIC_API_KEY,
    };
  }

  /**
   * Get all available services
   */
  static getAvailableServices(): AIModel[] {
    const config = this.checkConfiguration();
    const available: AIModel[] = [];

    if (config.gemini) {
      available.push('gemini');
    }

    if (config.claude) {
      available.push('claude');
    }

    return available;
  }

  /**
   * Validate that at least one AI service is configured
   */
  static validateConfiguration(): void {
    const available = this.getAvailableServices();

    if (available.length === 0) {
      throw new Error(
        'No AI services configured. Please set at least one of: ' +
          'GEMINI_API_KEY or ANTHROPIC_API_KEY in your .env file.'
      );
    }
  }
}
