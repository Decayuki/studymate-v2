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
 * POST /api/contents/[id]/regenerate
 * Regenerate content with a different AI model
 *
 * This will:
 * - Create a new version with the alternate AI model
 * - Use the same prompt and specifications as the current version
 * - Mark the old version as 'rejected'
 * - Set the new version as current
 */

const RegenerateSchema = z.object({
  aiModel: z.enum(['gemini', 'claude'], {
    message: 'AI model must be either "gemini" or "claude"',
  }),
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
    const body = await request.json();
    const { aiModel, prompt, constraints } = RegenerateSchema.parse(body);

    // Find content with subject populated
    const content = await Content.findById(id).populate('subject').exec();

    if (!content) {
      return notFoundResponse('Content');
    }

    // Get current version
    const currentVersionIndex = content.currentVersion ?? content.versions.length - 1;
    const currentVersion = content.versions[currentVersionIndex];

    if (!currentVersion) {
      return errorResponse('BAD_REQUEST', 'No current version found to regenerate', 400);
    }

    // Check if we're trying to use the same model
    if (currentVersion.aiModel === aiModel) {
      return errorResponse(
        'BAD_REQUEST',
        `Content is already generated with ${aiModel}. Choose a different model.`,
        400
      );
    }

    // Check if content is published (warn but allow)
    if (currentVersion.status === 'published') {
      console.warn('Regenerating published content:', {
        contentId: content._id,
        currentModel: currentVersion.aiModel,
        newModel: aiModel,
      });
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

    // Generate with the new AI model
    const aiService = AIServiceFactory.getService(aiModel);
    const startTime = Date.now();
    
    let aiResponse;
    try {
      aiResponse = await aiService.generate(aiRequest);
    } catch (error) {
      console.error(`${aiModel} generation failed:`, error);
      return errorResponse(
        'EXTERNAL_SERVICE_ERROR',
        `Failed to generate content with ${aiModel}. Please try again.`,
        503
      );
    }
    
    const durationMs = Date.now() - startTime;

    // Mark current version as rejected
    content.versions[currentVersionIndex].status = 'rejected';
    content.versions[currentVersionIndex].rejectedAt = new Date();
    content.versions[currentVersionIndex].rejectionReason = `Regenerated with ${aiModel}`;

    // Create new version
    const newVersionNumber = Math.max(...content.versions.map(v => v.versionNumber)) + 1;
    const newVersion = {
      versionNumber: newVersionNumber,
      status: 'draft' as const,
      aiModel,
      prompt: fullPrompt,
      content: aiResponse.content,
      metadata: {
        tokensUsed: aiResponse.tokensUsed,
        durationMs: aiResponse.durationMs || durationMs,
        model: aiResponse.model,
        modelVersion: aiResponse.modelVersion,
        temperature: aiRequest.config?.temperature,
        maxTokens: aiRequest.config?.maxTokens,
      },
      createdAt: new Date(),
    };

    // Add new version and update current version pointer
    content.versions.push(newVersion);
    content.currentVersion = content.versions.length - 1;

    await content.save();

    // Populate subject for response
    await content.populate('subject');

    return successResponse(
      {
        ...content.toObject(),
        regenerationInfo: {
          previousModel: currentVersion.aiModel,
          newModel: aiModel,
          previousVersionNumber: currentVersion.versionNumber,
          newVersionNumber: newVersionNumber,
        },
      },
      `Content regenerated successfully with ${aiModel}`
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