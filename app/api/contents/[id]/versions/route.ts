import { NextRequest } from 'next/server';
import { connectToDatabase, Content } from '@studymate/db';
import { AIServiceFactory } from '@studymate/ai';
import {
  type AIGenerationRequest,
  type IContentVersion,
  AI_MODELS,
} from '@studymate/shared';
import {
  successResponse,
  notFoundResponse,
  handleApiError,
  isValidObjectId,
  errorResponse,
} from '@/lib/api-utils';
import { z } from 'zod';

/**
 * POST /api/contents/[id]/versions
 * Generate a new version of the content using AI
 *
 * Body:
 * {
 *   "prompt": string,
 *   "aiModel": "gemini" | "claude",
 *   "contextCourseId"?: string (optional - for TD/Control generation)
 * }
 */
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

    // Find content
    const content = await Content.findById(id).populate('subject').exec();

    if (!content) {
      return notFoundResponse('Content');
    }

    // Parse and validate request body
    const body = await request.json();
    const schema = z.object({
      prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
      aiModel: z.enum(AI_MODELS),
      contextCourseId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    });

    const validatedData = schema.parse(body);

    // Get AI service
    const aiService = AIServiceFactory.getService(validatedData.aiModel);

    // Prepare context documents if contextCourseId provided
    const contextDocuments: string[] = [];

    if (validatedData.contextCourseId) {
      const contextCourse = await Content.findById(
        validatedData.contextCourseId
      )
        .lean()
        .exec();

      if (contextCourse && contextCourse.versions.length > 0) {
        // Use published version or latest version
        const publishedVersion = contextCourse.versions.find(
          (v) => v.status === 'published'
        );
        const versionToUse =
          publishedVersion || contextCourse.versions[contextCourse.versions.length - 1];

        contextDocuments.push(
          `COURS: ${contextCourse.title}\n\n${versionToUse.content}`
        );
      }
    }

    // Prepare AI request
    const subject = content.subject as any; // Populated
    const aiRequest: AIGenerationRequest = {
      prompt: validatedData.prompt,
      contextDocuments: contextDocuments.length > 0 ? contextDocuments : undefined,
      systemPrompt: `Tu es un assistant pédagogique qui génère du contenu éducatif de qualité pour des enseignants.
Le contenu doit être structuré, clair et adapté au niveau demandé.

Type de contenu : ${content.type}
Matière : ${subject.name}
Niveau : ${subject.level}

${contextDocuments.length > 0 ? 'Tu as accès au cours complet dans le contexte. Utilise-le pour créer un contenu cohérent.' : ''}

Génère le contenu en markdown avec une structure appropriée (titres, listes, etc.).`,
      config: {
        temperature: 0.7,
        maxTokens: 4000,
      },
    };

    // Generate content with AI
    const startTime = Date.now();
    const aiResponse = await aiService.generate(aiRequest);
    const durationMs = Date.now() - startTime;

    // Add new version to content
    const newVersion: IContentVersion = {
      versionNumber: content.versions.length + 1,
      status: 'draft',
      aiModel: validatedData.aiModel,
      prompt: validatedData.prompt,
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

    content.versions.push(newVersion);
    await content.save();

    // Return the new version
    return successResponse(
      {
        content: content.toObject(),
        newVersion,
      },
      'New version generated successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
