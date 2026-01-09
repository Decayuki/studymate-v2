import { NextRequest } from 'next/server';
import { connectToDatabase, Content, Subject } from '@studymate/db';
import { AIServiceFactory } from '@studymate/ai';
import {
  successResponse,
  errorResponse,
  handleApiError,
  isValidObjectId,
} from '@/lib/api-utils';
import type { AIModel, ITDSpecifications } from '@studymate/shared';

interface GenerateTDRequest {
  subjectId: string;
  title: string;
  linkedCourseId: string;
  aiModel: AIModel;
  chapterTitle?: string;
  constraints?: string;
}

/**
 * POST /api/contents/td/generate
 * Generate TD content with course context
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body: GenerateTDRequest = await request.json();
    const { subjectId, title, linkedCourseId, aiModel, chapterTitle, constraints } = body;

    // Validate required fields
    if (!subjectId || !title || !linkedCourseId || !aiModel) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Missing required fields: subjectId, title, linkedCourseId, aiModel',
        400
      );
    }

    // Validate ObjectIds
    if (!isValidObjectId(subjectId) || !isValidObjectId(linkedCourseId)) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid ObjectId format for subjectId or linkedCourseId',
        400
      );
    }

    // Validate AI model
    if (!['gemini', 'claude'].includes(aiModel)) {
      return errorResponse(
        'VALIDATION_ERROR',
        'aiModel must be either "gemini" or "claude"',
        400
      );
    }

    // Find subject
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return errorResponse('NOT_FOUND', 'Subject not found', 404);
    }

    // Find linked course content
    const linkedCourse = await Content.findOne({
      _id: linkedCourseId,
      type: 'course',
    });

    if (!linkedCourse) {
      return errorResponse(
        'NOT_FOUND',
        'Linked course content not found or is not a course type',
        404
      );
    }

    // Get the published or most recent version of the course
    const courseVersion = (linkedCourse as any).publishedVersion || 
                         linkedCourse.versions[linkedCourse.versions.length - 1];

    if (!courseVersion) {
      return errorResponse(
        'BAD_REQUEST',
        'Linked course has no available content versions',
        400
      );
    }

    // Build context from course content
    const courseContext = `
**Cours de référence:** ${linkedCourse.title}
**Chapitre:** ${chapterTitle || 'Non spécifié'}
**Contenu du cours:**
${courseVersion.content}
    `.trim();

    // Build TD generation prompt
    const tdPrompt = `
Tu es un professeur expert en ${subject.name} au niveau ${subject.level}.

Génère un TD (Travaux Dirigés) complet basé sur le cours fourni en contexte.

**Titre du TD:** ${title}
${chapterTitle ? `**Chapitre:** ${chapterTitle}` : ''}
${constraints ? `**Contraintes spécifiques:** ${constraints}` : ''}

**Contexte du cours:**
${courseContext}

**Instructions:**
1. Crée des exercices progressifs qui exploitent les concepts du cours
2. Inclus des questions de compréhension, d'application et d'analyse
3. Propose des exercices variés (QCM, questions ouvertes, problèmes pratiques)
4. Assure-toi que le niveau corresponde au cours de référence
5. Inclus les corrections détaillées pour chaque exercice
6. Structure le TD de manière claire et pédagogique

**Format attendu:**
- Introduction avec objectifs pédagogiques
- Exercices numérotés avec énoncés clairs
- Corrections détaillées avec explications
- Conclusion avec points clés à retenir

Génère un TD complet et pédagogique en français.
    `.trim();

    // Generate content using AI service
    const startTime = Date.now();
    const aiService = AIServiceFactory.getService(aiModel);
    const generationResult = await aiService.generate({
      prompt: tdPrompt,
      config: {
        model: aiModel,
        temperature: 0.7,
        maxTokens: 8000,
      },
    });

    if (!generationResult.content) {
      return errorResponse(
        'AI_GENERATION_ERROR',
        'Failed to generate content',
        500
      );
    }

    const durationMs = Date.now() - startTime;

    // Create TD specifications
    const specifications: ITDSpecifications = {
      linkedCourseId,
      contextUsed: courseContext,
      chapterTitle,
      constraints,
    };

    // Create new content document
    const newContent = new Content({
      subject: subjectId,
      type: 'td',
      title,
      specifications,
      versions: [],
    });

    // Add first version
    const newVersion = (newContent as any).addVersion({
      status: 'draft',
      aiModel,
      prompt: tdPrompt,
      content: generationResult.content,
      metadata: {
        tokensUsed: generationResult.tokensUsed || 0,
        durationMs: generationResult.durationMs,
        model: generationResult.model,
        modelVersion: generationResult.modelVersion,
        temperature: 0.7,
        maxTokens: 8000,
      },
    });

    // Set as current version
    newContent.currentVersion = 0;

    await newContent.save();

    // Populate subject for response
    await newContent.populate('subject');

    console.log('TD content generated:', {
      contentId: newContent._id,
      title: newContent.title,
      linkedCourseId,
      linkedCourseTitle: linkedCourse.title,
      aiModel,
      tokensUsed: generationResult.tokensUsed,
      durationMs: generationResult.durationMs,
    });

    return successResponse(
      {
        ...newContent.toObject(),
        generationInfo: {
          linkedCourse: {
            _id: linkedCourse._id,
            title: linkedCourse.title,
            type: linkedCourse.type,
          },
          contextLength: courseContext.length,
          tokensUsed: generationResult.tokensUsed,
          durationMs: generationResult.durationMs,
        },
      },
      'TD content generated successfully with course context'
    );
  } catch (error) {
    return handleApiError(error);
  }
}