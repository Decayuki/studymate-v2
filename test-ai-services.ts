/**
 * Test AI Services (Gemini & Claude)
 *
 * Run with: npx tsx test-ai-services.ts
 */

import 'dotenv/config';
import { AIServiceFactory } from './packages/ai/src';
import type { AIGenerationRequest } from '@studymate/shared';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

/**
 * Test helper
 */
async function test(
  name: string,
  fn: () => Promise<void>
): Promise<void> {
  const startTime = Date.now();

  try {
    await fn();
    const duration = Date.now() - startTime;
    results.push({ name, passed: true, duration });
    console.log(`✅ ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: errorMessage, duration });
    console.error(`❌ ${name} (${duration}ms): ${errorMessage}`);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Testing AI Services (Gemini & Claude)...\n');

  // Check configuration
  console.log('📋 Checking AI service configuration...');
  const config = AIServiceFactory.checkConfiguration();
  console.log(`   Gemini configured: ${config.gemini ? '✅' : '❌'}`);
  console.log(`   Claude configured: ${config.claude ? '✅' : '❌'}\n`);

  const available = AIServiceFactory.getAvailableServices();
  console.log(`🎯 Available services: ${available.join(', ')}\n`);

  if (available.length === 0) {
    console.error('❌ No AI services configured. Please check your .env file.');
    process.exit(1);
  }

  // Test request
  const testRequest: AIGenerationRequest = {
    prompt: 'Écris un court paragraphe (2-3 phrases) sur l\'importance des mathématiques.',
    config: {
      temperature: 0.7,
      maxTokens: 2000, // Increased for Gemini 2.5 Pro (has internal reasoning tokens)
    },
  };

  // Test Gemini if configured
  if (config.gemini) {
    await test('Gemini - Health check', async () => {
      const service = AIServiceFactory.getService('gemini');
      const healthy = await service.healthCheck();
      if (!healthy) {
        throw new Error('Gemini health check failed');
      }
    });

    await test('Gemini - Generate content', async () => {
      const service = AIServiceFactory.getService('gemini');
      const response = await service.generate(testRequest);

      if (!response.content) {
        throw new Error('No content generated');
      }

      if (response.content.length < 10) {
        throw new Error('Content too short');
      }

      if (response.tokensUsed === 0) {
        throw new Error('No tokens recorded');
      }

      console.log(`   Generated ${response.content.length} chars, ${response.tokensUsed} tokens`);
      console.log(`   Preview: ${response.content.substring(0, 80)}...`);
    });

    await test('Gemini - Get rate limit info', async () => {
      const service = AIServiceFactory.getService('gemini');
      const rateLimitInfo = service.getRateLimitInfo();

      if (!rateLimitInfo) {
        throw new Error('No rate limit info available');
      }

      console.log(`   RPM: ${rateLimitInfo.requestsPerMinute}, TPM: ${rateLimitInfo.tokensPerMinute}`);
    });

    await test('Gemini - Get stats', async () => {
      const service = AIServiceFactory.getService('gemini');
      const stats = service.getStats();

      if (stats.totalRequests < 1) {
        throw new Error('No requests recorded');
      }

      console.log(`   Total requests: ${stats.totalRequests}, Success: ${stats.successfulRequests}`);
      console.log(`   Tokens used: ${stats.totalTokensUsed}, Avg latency: ${Math.round(stats.averageLatencyMs)}ms`);
    });
  }

  // Test Claude if configured
  if (config.claude) {
    await test('Claude - Health check', async () => {
      const service = AIServiceFactory.getService('claude');
      const healthy = await service.healthCheck();
      if (!healthy) {
        throw new Error('Claude health check failed');
      }
    });

    await test('Claude - Generate content', async () => {
      const service = AIServiceFactory.getService('claude');
      const response = await service.generate(testRequest);

      if (!response.content) {
        throw new Error('No content generated');
      }

      if (response.content.length < 10) {
        throw new Error('Content too short');
      }

      if (response.tokensUsed === 0) {
        throw new Error('No tokens recorded');
      }

      console.log(`   Generated ${response.content.length} chars, ${response.tokensUsed} tokens`);
      console.log(`   Preview: ${response.content.substring(0, 80)}...`);
    });

    await test('Claude - Get rate limit info', async () => {
      const service = AIServiceFactory.getService('claude');
      const rateLimitInfo = service.getRateLimitInfo();

      if (!rateLimitInfo) {
        throw new Error('No rate limit info available');
      }

      console.log(`   RPM: ${rateLimitInfo.requestsPerMinute}, TPM: ${rateLimitInfo.tokensPerMinute}`);
    });

    await test('Claude - Get stats', async () => {
      const service = AIServiceFactory.getService('claude');
      const stats = service.getStats();

      if (stats.totalRequests < 1) {
        throw new Error('No requests recorded');
      }

      console.log(`   Total requests: ${stats.totalRequests}, Success: ${stats.successfulRequests}`);
      console.log(`   Tokens used: ${stats.totalTokensUsed}, Avg latency: ${Math.round(stats.averageLatencyMs)}ms`);
    });
  }

  // Test context documents
  if (available.length > 0) {
    const testModel = available[0];

    await test(`${testModel.charAt(0).toUpperCase() + testModel.slice(1)} - Generate with context`, async () => {
      const service = AIServiceFactory.getService(testModel);
      const response = await service.generate({
        prompt: 'Résume le cours en 1 phrase.',
        contextDocuments: [
          'COURS: Pythagore\n\nLe théorème de Pythagore dit que a² + b² = c²',
        ],
        config: {
          maxTokens: 1000, // Increased for Gemini 2.5 Pro reasoning
        },
      });

      if (!response.content) {
        throw new Error('No content generated');
      }

      if (!response.content.toLowerCase().includes('pythagore')) {
        throw new Error('Context not used in generation');
      }

      console.log(`   Context-aware response: ${response.content.substring(0, 80)}...`);
    });
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    process.exit(1);
  } else {
    console.log('\n🎉 All AI service tests passed!');
    process.exit(0);
  }
}

// Run tests
runTests();
