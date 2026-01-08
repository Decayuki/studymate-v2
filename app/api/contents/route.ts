import { NextRequest } from 'next/server';
import { connectToDatabase, Content, Subject } from '@studymate/db';
import { AIServiceFactory } from '@studymate/ai';
import {
  CreateContentSchema,
  ContentFiltersSchema,
  type AIGenerationRequest,
  type IContentVersion,
} from '@studymate/shared';
import {
  successResponse,
  createdResponse,
  handleApiError,
  parsePaginationParams,
  errorResponse,
} from '@/lib/api-utils';

/**
 * GET /api/contents
 * List all contents with optional filtering and pagination
 *
 * Query params:
 * - subject: ObjectId (optional - filter by subject)
 * - type: 'course' | 'td' | 'control' (optional)
 * - status: 'draft' | 'comparing' | 'published' | 'rejected' (optional)
 * - aiModel: 'gemini' | 'claude' (optional)
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - sortBy: string (default: 'createdAt')
 * - sortOrder: 'asc' | 'desc' (default: 'desc')
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, sortBy, sortOrder } =
      parsePaginationParams(searchParams);

    // Parse filters
    const filters: Record<string, unknown> = {};

    const subject = searchParams.get('subject');
    const type = searchParams.get('type');
    const aiModel = searchParams.get('aiModel');
    const title = searchParams.get('title');

    // Validate filters with Zod
    const validatedFilters = ContentFiltersSchema.parse({
      subject: subject || undefined,
      type: type || undefined,
      aiModel: aiModel || undefined,
      title: title || undefined,
    });

    // Build query filters
    if (validatedFilters.subject) {
      filters.subject = validatedFilters.subject;
    }

    if (validatedFilters.type) {
      filters.type = validatedFilters.type;
    }

    if (validatedFilters.title) {
      filters.title = { $regex: validatedFilters.title, $options: 'i' };
    }

    // Filter by AI model (in versions array)
    if (validatedFilters.aiModel) {
      filters['versions.aiModel'] = validatedFilters.aiModel;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with population
    const [contents, total] = await Promise.all([
      Content.find(filters)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .populate('subject')
        .lean()
        .exec(),
      Content.countDocuments(filters),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    return successResponse({
      data: contents,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/contents
 * Create a new content with AI generation
 *
 * Body:
 * {
 *   "subject": "ObjectId",
 *   "type": "course" | "td" | "control",
 *   "title": "Titre du contenu",
 *   "prompt": "Prompt pour l'IA",
 *   "aiModel": "gemini" | "claude"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateContentSchema.parse(body);

    // Verify subject exists
    const subject = await Subject.findById(validatedData.subject).lean().exec();
    if (!subject) {
      return errorResponse('NOT_FOUND', 'Subject not found', 404);
    }

    // Get AI service
    const aiService = AIServiceFactory.getService(validatedData.aiModel);

    // Prepare AI request
    const aiRequest: AIGenerationRequest = {
      prompt: validatedData.prompt,
      systemPrompt: `Tu es un assistant pédagogique qui génère du contenu éducatif de qualité pour des enseignants.
Le contenu doit être structuré, clair et adapté au niveau demandé.

Type de contenu : ${validatedData.type}
Matière : ${subject.name}
Niveau : ${subject.level}

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

    // Create content document
    const content = await Content.create({
      subject: validatedData.subject,
      type: validatedData.type,
      title: validatedData.title,
      versions: [
        {
          versionNumber: 1,
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
        } as IContentVersion,
      ],
      currentVersion: 0, // Index 0 = first version
    });

    // Populate subject before returning
    await content.populate('subject');

    return createdResponse(
      content.toObject(),
      'Content created and generated successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
