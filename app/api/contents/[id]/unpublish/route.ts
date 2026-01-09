import { NextRequest } from 'next/server';
import { connectToDatabase, Content } from '@studymate/db';
import {
  successResponse,
  notFoundResponse,
  handleApiError,
  isValidObjectId,
  errorResponse,
} from '@/lib/api-utils';

/**
 * PATCH /api/contents/[id]/unpublish
 * Unpublish content (set all versions to draft and remove Notion page ID)
 *
 * This will:
 * - Set all versions status to 'draft'
 * - Clear notionPageId (but keep it logged for reference)
 * - Clear currentVersion pointer
 * 
 * Note: This doesn't delete the Notion page itself, just removes the link
 */
export async function PATCH(
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

    // Check if content is actually published
    const publishedVersion = content.versions.find(v => v.status === 'published');
    if (!publishedVersion || !content.notionPageId) {
      return errorResponse(
        'BAD_REQUEST',
        'Content is not currently published',
        400
      );
    }

    // Store the old Notion page ID for logging
    const oldNotionPageId = content.notionPageId;

    // Update all versions to draft status
    content.versions.forEach(version => {
      if (version.status === 'published') {
        version.status = 'draft';
        version.publishedAt = undefined;
      }
    });

    // Clear Notion reference
    content.notionPageId = undefined;
    content.currentVersion = undefined;

    await content.save();

    // Log the unpublish action for audit trail
    console.log('Content unpublished:', {
      contentId: content._id,
      title: content.title,
      oldNotionPageId,
      unpublishedAt: new Date().toISOString(),
    });

    return successResponse(
      {
        ...content.toObject(),
        oldNotionPageId, // Include in response for reference
      },
      'Content unpublished successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}