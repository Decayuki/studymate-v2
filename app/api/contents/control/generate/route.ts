import { NextRequest } from 'next/server';
import { connectToDatabase, Content, Subject } from '@studymate/db';
import { AIServiceFactory } from '@studymate/ai';
import {
  successResponse,
  errorResponse,
  handleApiError,
  isValidObjectId,
} from '@/lib/api-utils';
import type { AIModel, IControlSpecifications } from '@studymate/shared';

interface GenerateControlRequest {
  subjectId: string;
  title: string;
  linkedCourseIds: string[];
  duration: number; // Duration in minutes
  aiModel: AIModel;
  chapterTitle?: string;
  constraints?: string;
}

/**
 * POST /api/contents/control/generate
 * Generate Control content with multiple course contexts
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body: GenerateControlRequest = await request.json();
    const { 
      subjectId, 
      title, 
      linkedCourseIds, 
      duration, 
      aiModel, 
      chapterTitle, 
      constraints 
    } = body;

    // Validate required fields
    if (!subjectId || !title || !linkedCourseIds || !duration || !aiModel) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Missing required fields: subjectId, title, linkedCourseIds, duration, aiModel',
        400
      );
    }

    // Validate linkedCourseIds array
    if (!Array.isArray(linkedCourseIds) || linkedCourseIds.length === 0) {
      return errorResponse(
        'VALIDATION_ERROR',
        'linkedCourseIds must be a non-empty array',
        400
      );
    }

    if (linkedCourseIds.length > 5) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Maximum 5 courses can be referenced for a control',
        400
      );
    }

    // Validate ObjectIds
    if (!isValidObjectId(subjectId)) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid subjectId format',
        400
      );
    }

    for (const courseId of linkedCourseIds) {
      if (!isValidObjectId(courseId)) {
        return errorResponse(
          'VALIDATION_ERROR',
          `Invalid course ID format: ${courseId}`,
          400
        );
      }
    }

    // Validate AI model
    if (!['gemini', 'claude'].includes(aiModel)) {
      return errorResponse(
        'VALIDATION_ERROR',
        'aiModel must be either "gemini" or "claude"',
        400
      );
    }

    // Validate duration
    if (duration < 15 || duration > 600) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Duration must be between 15 minutes and 10 hours (600 minutes)',
        400
      );
    }

    // Find subject
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return errorResponse('NOT_FOUND', 'Subject not found', 404);
    }

    // Find all linked courses
    const linkedCourses = await Content.find({
      _id: { $in: linkedCourseIds },
      type: 'course',
    });

    if (linkedCourses.length !== linkedCourseIds.length) {
      const foundIds = linkedCourses.map(c => c._id.toString());
      const missingIds = linkedCourseIds.filter(id => !foundIds.includes(id));
      return errorResponse(
        'NOT_FOUND',
        `Courses not found or not course type: ${missingIds.join(', ')}`,
        404
      );
    }

    // Build combined context from all courses
    const courseContexts = linkedCourses.map(course => {
      const courseVersion = (course as any).publishedVersion || 
                           course.versions[course.versions.length - 1];
      
      if (!courseVersion) {
        return null;
      }

      return {
        title: course.title,
        content: courseVersion.content,
      };
    }).filter(Boolean);

    if (courseContexts.length === 0) {
      return errorResponse(
        'BAD_REQUEST',
        'None of the linked courses have available content versions',
        400
      );
    }

    // Build comprehensive context for control generation
    const combinedContext = `
**Cours de référence pour l'évaluation:**

${courseContexts.map((ctx, index) => `
**Cours ${index + 1}: ${ctx!.title}**
${ctx!.content}
`).join('\n---\n')}
    `.trim();

    // Build control generation prompt
    const controlPrompt = `
Tu es un professeur expert en ${subject.name} au niveau ${subject.level}.

Génère un contrôle/examen complet basé sur les cours fournis en contexte.

**Titre du contrôle:** ${title}
**Durée:** ${duration} minutes
${chapterTitle ? `**Chapitre:** ${chapterTitle}` : ''}
${constraints ? `**Contraintes spécifiques:** ${constraints}` : ''}

**Contexte des cours:**
${combinedContext}

**Instructions:**
1. Crée un examen équilibré couvrant tous les cours référencés
2. Adapte la difficulté et la quantité de questions à la durée (${duration} min)
3. Inclus différents types de questions (QCM, questions courtes, problèmes, rédaction)
4. Assure-toi que les questions testent la compréhension, l'application et l'analyse
5. Répartis équitablement les questions entre les différents cours
6. Inclus un barème de notation détaillé
7. Propose des questions progressives (facile → moyen → difficile)

**Format attendu:**
- En-tête avec consignes générales (durée, matériel autorisé, etc.)
- Questions organisées par sections/exercices
- Barème de notation pour chaque question/section
- Instructions claires pour chaque type de question
- Répartition temporelle conseillée

**Durée disponible:** ${duration} minutes
**Nombre de cours à couvrir:** ${courseContexts.length}

Génère un contrôle complet et équilibré en français.
    `.trim();

    // Generate content using AI service
    const startTime = Date.now();
    const aiService = AIServiceFactory.getService(aiModel);
    const generationResult = await aiService.generate({
      prompt: controlPrompt,
      config: {
        model: aiModel,
        temperature: 0.6, // Slightly lower for more structured exam content
        maxTokens: 10000, // Higher for comprehensive exams
      },
    });

    if (!generationResult.content) {
      return errorResponse(
        'AI_GENERATION_ERROR',
        'Failed to generate control content',
        500
      );
    }

    // Create Control specifications
    const specifications: IControlSpecifications = {
      linkedCourseIds,
      duration,
      chapterTitle,
      constraints,
    };

    // Create new content document
    const newContent = new Content({
      subject: subjectId,
      type: 'control',
      title,
      specifications,
      versions: [],
    });

    // Add first version
    const newVersion = (newContent as any).addVersion({
      status: 'draft',
      aiModel,
      prompt: controlPrompt,
      content: generationResult.content,
      metadata: {
        tokensUsed: generationResult.tokensUsed || 0,
        durationMs: generationResult.durationMs,
        model: generationResult.model,
        modelVersion: generationResult.modelVersion,
        temperature: 0.6,
        maxTokens: 10000,
      },
    });

    // Set as current version
    newContent.currentVersion = 0;

    await newContent.save();

    // Populate subject for response
    await newContent.populate('subject');

    console.log('Control content generated:', {
      contentId: newContent._id,
      title: newContent.title,
      linkedCourseIds,
      linkedCourseTitles: linkedCourses.map(c => c.title),
      duration,
      aiModel,
      tokensUsed: generationResult.tokensUsed,
      durationMs: generationResult.durationMs,
    });

    return successResponse(
      {
        ...newContent.toObject(),
        generationInfo: {
          linkedCourses: linkedCourses.map(course => ({
            _id: course._id,
            title: course.title,
            type: course.type,
          })),
          combinedContextLength: combinedContext.length,
          duration,
          tokensUsed: generationResult.tokensUsed,
          durationMs: generationResult.durationMs,
        },
      },
      'Control content generated successfully with multi-course context'
    );
  } catch (error) {
    return handleApiError(error);
  }
}