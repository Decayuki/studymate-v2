import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, Content, Subject } from '@studymate/db';
import { Types } from 'mongoose';

interface QuickTDRequest {
  subjectId: string;
  title: string;
  topic: string;
  level?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: QuickTDRequest = await request.json();
    
    // Connect to database
    await connectToDatabase();
    
    // Verify subject exists
    const subject = await Subject.findById(body.subjectId).lean();
    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      );
    }
    
    // Create TD content with all required fields per Content schema
    const contentData = {
      subject: new Types.ObjectId(body.subjectId), // Use 'subject' not 'subjectId'
      title: body.title,
      type: 'td',
      versions: [{
        versionNumber: 1,
        status: 'draft',
        aiModel: 'gemini', // Use valid AI model instead of 'manual'
        prompt: `Créer un TD sur le thème : ${body.topic} pour la matière ${subject.name}`,
        content: `# ${body.title}

## Objectif
TD sur le thème : ${body.topic}

## Exercices

### Exercice 1
À compléter...

### Exercice 2  
À compléter...

---
*Ce contenu est un modèle de base. Vous pouvez le modifier dans l'éditeur.*`,
        metadata: { // Add required metadata
          tokensUsed: 0,
          durationMs: 0,
          model: 'gemini',
          modelVersion: '2.5-pro',
          estimatedCost: 0,
          costCurrency: 'USD',
        },
        createdAt: new Date(),
      }],
      specifications: {
        linkedCourseId: null,
      },
    };

    const content = await Content.create(contentData);
    
    return NextResponse.json({
      success: true,
      data: {
        contentId: content._id,
        title: content.title,
        subject: subject.name,
        message: 'TD créé avec succès ! Vous pouvez maintenant l\'éditer.'
      }
    });
    
  } catch (error) {
    console.error('Quick TD creation error:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la création du TD',
        debug: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}