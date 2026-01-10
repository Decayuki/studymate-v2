import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, Content, Subject } from '@studymate/db';

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
    
    // Create TD content without AI generation (for speed)
    const content = await Content.create({
      title: body.title,
      type: 'td',
      subjectId: body.subjectId,
      primaryStatus: 'draft',
      versions: [{
        versionNumber: 1,
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
        status: 'draft',
        aiModel: 'manual',
        tokensUsed: 0,
        createdAt: new Date(),
      }],
      modelsUsed: ['manual'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
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
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du TD' },
      { status: 500 }
    );
  }
}