import { NextRequest } from 'next/server';
import { connectToDatabase, Content } from '@studymate/db';
import { NotionService, NotionRateLimiter } from '@studymate/notion';
import {
  successResponse,
  notFoundResponse,
  handleApiError,
  isValidObjectId,
  errorResponse,
} from '@/lib/api-utils';

// Initialize Notion service (singleton pattern)
let notionService: NotionService | null = null;
let rateLimiter: NotionRateLimiter | null = null;

function getNotionService(): NotionService {
  if (!notionService) {
    const apiKey = process.env.NOTION_INTEGRATION_TOKEN;
    const databaseId = process.env.NOTION_PARENT_PAGE_ID;
    
    if (!apiKey || !databaseId) {
      throw new Error('NOTION_INTEGRATION_TOKEN and NOTION_PARENT_PAGE_ID must be set');
    }
    
    notionService = new NotionService(apiKey, databaseId);
    rateLimiter = new NotionRateLimiter();
  }
  
  return notionService;
}

function getRateLimiter(): NotionRateLimiter {
  if (!rateLimiter) {
    getNotionService(); // This will initialize both
  }
  return rateLimiter!;
}

/**
 * PATCH /api/contents/[id]/versions/[versionNumber]/publish
 * Publish a specific version of the content
 *
 * This will:
 * - Set the version status to 'published'
 * - Unpublish any previously published version (set to 'draft')
 * - Update currentVersion pointer
 * - Set publishedAt timestamp
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionNumber: string }> }
) {
  try {
    // Connect to database
    await connectToDatabase();

    // Await params (Next.js 15+)
    const { id, versionNumber } = await params;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid content ID format', 400);
    }

    // Validate version number
    const versionNum = parseInt(versionNumber, 10);
    if (isNaN(versionNum) || versionNum < 1) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid version number format',
        400
      );
    }

    // Find content
    const content = await Content.findById(id).populate('subject').exec();

    if (!content) {
      return notFoundResponse('Content');
    }

    // Find version by version number
    const versionIndex = content.versions.findIndex(
      (v) => v.versionNumber === versionNum
    );

    if (versionIndex === -1) {
      return errorResponse(
        'NOT_FOUND',
        `Version ${versionNum} not found`,
        404
      );
    }

    // Check if content is already published to avoid duplicate Notion pages
    const currentPublishedVersion = content.versions.find(v => v.status === 'published');
    if (currentPublishedVersion && content.notionPageId) {
      return errorResponse(
        'CONFLICT',
        'Content is already published to Notion. Unpublish first to publish a different version.',
        409
      );
    }

    // Publish to Notion first
    let notionPageId: string;
    try {
      const notion = getNotionService();
      const limiter = getRateLimiter();
      
      // Use rate limiter to respect Notion API limits
      notionPageId = await limiter.throttle(async () => {
        return await notion.publishContent(content);
      });
    } catch (error) {
      console.error('Failed to publish to Notion:', error);
      return errorResponse(
        'EXTERNAL_SERVICE_ERROR',
        'Failed to publish content to Notion. Please try again.',
        503
      );
    }

    // Update content status in database
    try {
      (content as any).publishVersion(versionNum);
      content.notionPageId = notionPageId;
      await content.save();
    } catch (error) {
      // If DB update fails after Notion publish, we have an inconsistency
      // Log this for manual cleanup
      console.error('Failed to update content after Notion publish:', error, {
        contentId: content._id,
        notionPageId,
      });
      
      if (error instanceof Error) {
        return errorResponse('VALIDATION_ERROR', error.message, 400);
      }
      throw error;
    }

    // Get Notion page URL for response
    const notion = getNotionService();
    const notionUrl = notion.getPageUrl(notionPageId);

    return successResponse(
      {
        ...content.toObject(),
        notionPageId,
        notionUrl,
      },
      `Version ${versionNum} published successfully to Notion`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
