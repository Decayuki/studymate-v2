/**
 * Notion Rate Limiter
 * 
 * Ensures we don't exceed Notion's 3 requests per second limit
 * Implements a simple token bucket algorithm
 */
export class NotionRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number = 3;
  private readonly refillRate: number = 3; // tokens per second
  private readonly queue: Array<() => void> = [];
  private processingQueue = false;

  constructor() {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }

  /**
   * Wait for rate limit availability and execute function
   */
  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  /**
   * Process the queue of pending requests
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.queue.length === 0) {
      return;
    }

    this.processingQueue = true;

    while (this.queue.length > 0) {
      // Refill tokens based on elapsed time
      this.refillTokens();

      if (this.tokens >= 1) {
        // We have tokens, execute the next request
        this.tokens -= 1;
        const nextFn = this.queue.shift();
        if (nextFn) {
          nextFn();
        }
      } else {
        // No tokens available, wait a bit
        await this.sleep(100); // Wait 100ms before checking again
      }
    }

    this.processingQueue = false;
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(): void {
    const now = Date.now();
    const timeSinceLastRefill = (now - this.lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = Math.floor(timeSinceLastRefill * this.refillRate);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current token count (for debugging)
   */
  getCurrentTokens(): number {
    this.refillTokens();
    return this.tokens;
  }

  /**
   * Reset the rate limiter (for testing)
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
    this.queue.length = 0;
    this.processingQueue = false;
  }
}