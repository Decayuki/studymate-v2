import { NextRequest } from 'next/server';
import { connectToDatabase, Content } from '@studymate/db';
import { AIServiceFactory } from '@studymate/ai';
import {
  successResponse,
  notFoundResponse,
  handleApiError,
  isValidObjectId,
  errorResponse,
} from '@/lib/api-utils';
import { z } from 'zod';

/**
 * POST /api/contents/[id]/compare
 * Generate new versions with both AI models for comparison
 *
 * This will:
 * - Generate content with both Gemini and Claude
 * - Create two new versions with status 'comparing'
 * - Return both versions for side-by-side comparison
 * - User can then select which version to keep
 */

const CompareSchema = z.object({
  prompt: z.string().optional(), // Optional: Override the original prompt
  constraints: z.string().optional(), // Optional: Add new constraints
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Connect to database
    await connectToDatabase();

    // Await params (Next.js 15+)
    const { id } = await params;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid content ID format', 400);
    }

    // Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const { prompt, constraints } = CompareSchema.parse(body);

    // Find content with subject populated
    const content = await Content.findById(id).populate('subject').exec();

    if (!content) {
      return notFoundResponse('Content');
    }

    // Get current version for prompt reference
    const currentVersionIndex = content.currentVersion ?? content.versions.length - 1;
    const currentVersion = content.versions[currentVersionIndex];

    if (!currentVersion) {
      return errorResponse('BAD_REQUEST', 'No current version found for comparison', 400);
    }

    // Prepare AI generation request
    const systemPrompt = `Tu es un assistant pédagogique qui génère du contenu éducatif de qualité pour des enseignants.
Le contenu doit être structuré, clair et adapté au niveau demandé.

Type de contenu : ${content.type}
Matière : ${(content.subject as any)?.name || 'Unknown'}
Niveau : ${(content.subject as any)?.level || 'Unknown'}

Génère le contenu en markdown avec une structure appropriée (titres, listes, etc.).`;

    // Use provided prompt or original prompt with optional additional constraints
    const finalPrompt = prompt || currentVersion.prompt;
    const fullPrompt = constraints 
      ? `${finalPrompt}\n\nContraintes supplémentaires : ${constraints}`
      : finalPrompt;

    const aiRequest = {
      prompt: fullPrompt,
      systemPrompt,
      config: {
        temperature: 0.7,
        maxTokens: 4000,
      },
    };

    // Generate with both models in parallel
    const geminiService = AIServiceFactory.getService('gemini');
    const claudeService = AIServiceFactory.getService('claude');

    const startTime = Date.now();
    
    const [geminiResult, claudeResult] = await Promise.allSettled([
      geminiService.generate(aiRequest),
      claudeService.generate(aiRequest),
    ]);
    
    const durationMs = Date.now() - startTime;

    // Check results
    if (geminiResult.status === 'rejected' && claudeResult.status === 'rejected') {
      console.error('Both AI models failed:', {
        geminiError: geminiResult.reason,
        claudeError: claudeResult.reason,
      });
      return errorResponse(
        'EXTERNAL_SERVICE_ERROR',
        'Both AI models failed to generate content. Please try again.',
        503
      );
    }

    // Determine next version numbers
    const maxVersionNumber = Math.max(...content.versions.map(v => v.versionNumber));
    
    const newVersions: any[] = [];

    // Create Gemini version if successful
    if (geminiResult.status === 'fulfilled') {
      const geminiResponse = geminiResult.value;
      newVersions.push({
        versionNumber: maxVersionNumber + 1,
        status: 'comparing',
        aiModel: 'gemini',
        prompt: fullPrompt,
        content: geminiResponse.content,
        metadata: {
          tokensUsed: geminiResponse.tokensUsed,
          durationMs: geminiResponse.durationMs || durationMs / 2,
          model: geminiResponse.model,
          modelVersion: geminiResponse.modelVersion,
          temperature: aiRequest.config?.temperature,
          maxTokens: aiRequest.config?.maxTokens,
        },
        createdAt: new Date(),
      });
    }

    // Create Claude version if successful
    if (claudeResult.status === 'fulfilled') {
      const claudeResponse = claudeResult.value;
      newVersions.push({
        versionNumber: geminiResult.status === 'fulfilled' ? maxVersionNumber + 2 : maxVersionNumber + 1,
        status: 'comparing',
        aiModel: 'claude',
        prompt: fullPrompt,
        content: claudeResponse.content,
        metadata: {
          tokensUsed: claudeResponse.tokensUsed,
          durationMs: claudeResponse.durationMs || durationMs / 2,
          model: claudeResponse.model,
          modelVersion: claudeResponse.modelVersion,
          temperature: aiRequest.config?.temperature,
          maxTokens: aiRequest.config?.maxTokens,
        },
        createdAt: new Date(),
      });
    }

    // If only one model succeeded, return error suggesting regenerate instead
    if (newVersions.length === 1) {
      const successfulModel = newVersions[0].aiModel;
      const failedModel = successfulModel === 'gemini' ? 'claude' : 'gemini';
      
      return errorResponse(
        'EXTERNAL_SERVICE_ERROR',
        `Only ${successfulModel} succeeded. ${failedModel} failed. Use regenerate instead of compare.`,
        503
      );
    }

    // Add new versions to content
    content.versions.push(...newVersions);
    
    // Don't set currentVersion yet - user will choose from comparison
    
    await content.save();

    // Populate subject for response
    await content.populate('subject');

    return successResponse(
      {
        content: content.toObject(),
        comparisonVersions: {
          gemini: newVersions.find(v => v.aiModel === 'gemini'),
          claude: newVersions.find(v => v.aiModel === 'claude'),
        },
        errors: {
          gemini: geminiResult.status === 'rejected' ? geminiResult.reason?.message : null,
          claude: claudeResult.status === 'rejected' ? claudeResult.reason?.message : null,
        },
      },
      'Content generated with both models for comparison'
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        'VALIDATION_ERROR',
        error.issues.map(e => e.message).join(', '),
        400
      );
    }
    
    return handleApiError(error);
  }
}