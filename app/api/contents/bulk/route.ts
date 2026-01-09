import { NextRequest } from 'next/server';
import { connectToDatabase, Content } from '@studymate/db';
import {
  successResponse,
  errorResponse,
  handleApiError,
  isValidObjectId,
} from '@/lib/api-utils';
import type { ContentStatus } from '@studymate/shared';

interface BulkOperation {
  action: 'delete' | 'update-status' | 'publish' | 'unpublish';
  contentIds: string[];
  params?: {
    status?: ContentStatus;
    versionNumber?: number;
    reason?: string;
  };
}

/**
 * POST /api/contents/bulk
 * Perform bulk operations on multiple content items
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body: BulkOperation = await request.json();
    const { action, contentIds, params } = body;

    // Validate input
    if (!action || !contentIds || !Array.isArray(contentIds)) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Missing required fields: action, contentIds (array)',
        400
      );
    }

    if (contentIds.length === 0) {
      return errorResponse(
        'VALIDATION_ERROR',
        'contentIds array cannot be empty',
        400
      );
    }

    if (contentIds.length > 50) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Maximum 50 items can be processed in bulk',
        400
      );
    }

    // Validate ObjectIds
    for (const id of contentIds) {
      if (!isValidObjectId(id)) {
        return errorResponse(
          'VALIDATION_ERROR',
          `Invalid content ID format: ${id}`,
          400
        );
      }
    }

    // Validate action
    const validActions = ['delete', 'update-status', 'publish', 'unpublish'];
    if (!validActions.includes(action)) {
      return errorResponse(
        'VALIDATION_ERROR',
        `Invalid action. Must be one of: ${validActions.join(', ')}`,
        400
      );
    }

    let results: any[] = [];
    let errors: any[] = [];

    switch (action) {
      case 'delete':
        results = await performBulkDelete(contentIds, errors);
        break;
      
      case 'update-status':
        results = await performBulkStatusUpdate(contentIds, params, errors);
        break;
      
      case 'publish':
        results = await performBulkPublish(contentIds, params, errors);
        break;
      
      case 'unpublish':
        results = await performBulkUnpublish(contentIds, errors);
        break;
      
      default:
        return errorResponse(
          'VALIDATION_ERROR',
          `Unsupported action: ${action}`,
          400
        );
    }

    const summary = {
      total: contentIds.length,
      successful: results.length,
      failed: errors.length,
      action,
    };

    console.log('Bulk operation completed:', {
      action,
      summary,
      contentIds: contentIds.slice(0, 5), // Log first 5 IDs only
    });

    return successResponse({
      summary,
      results,
      errors,
    }, `Bulk ${action} completed: ${summary.successful} successful, ${summary.failed} failed`);

  } catch (error) {
    console.error('Bulk operation error:', error);
    return handleApiError(error);
  }
}

// Helper function for bulk delete
async function performBulkDelete(contentIds: string[], errors: any[]): Promise<any[]> {
  const results = [];

  for (const contentId of contentIds) {
    try {
      const content = await Content.findById(contentId);
      
      if (!content) {
        errors.push({
          contentId,
          error: 'Content not found',
        });
        continue;
      }

      // Check if content has published versions
      const hasPublishedVersion = content.versions.some(v => v.status === 'published');
      if (hasPublishedVersion) {
        errors.push({
          contentId,
          title: content.title,
          error: 'Cannot delete content with published versions. Unpublish first.',
        });
        continue;
      }

      await Content.findByIdAndDelete(contentId);
      results.push({
        contentId,
        title: content.title,
        action: 'deleted',
      });

    } catch (error) {
      errors.push({
        contentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

// Helper function for bulk status update
async function performBulkStatusUpdate(
  contentIds: string[], 
  params: any, 
  errors: any[]
): Promise<any[]> {
  const results = [];
  const { status, versionNumber, reason } = params || {};

  if (!status) {
    throw new Error('status parameter is required for update-status action');
  }

  if (!['draft', 'rejected', 'comparing'].includes(status)) {
    throw new Error('status must be one of: draft, rejected, comparing');
  }

  for (const contentId of contentIds) {
    try {
      const content = await Content.findById(contentId);
      
      if (!content) {
        errors.push({
          contentId,
          error: 'Content not found',
        });
        continue;
      }

      if (!content.versions || content.versions.length === 0) {
        errors.push({
          contentId,
          title: content.title,
          error: 'No versions found',
        });
        continue;
      }

      // Update specific version or latest version
      const targetVersionNumber = versionNumber || content.versions.length;
      const versionIndex = content.versions.findIndex(
        v => v.versionNumber === targetVersionNumber
      );

      if (versionIndex === -1) {
        errors.push({
          contentId,
          title: content.title,
          error: `Version ${targetVersionNumber} not found`,
        });
        continue;
      }

      // Update version status
      content.versions[versionIndex].status = status;
      
      if (status === 'rejected') {
        content.versions[versionIndex].rejectedAt = new Date();
        if (reason) {
          content.versions[versionIndex].rejectionReason = reason;
        }
      }

      await content.save();
      results.push({
        contentId,
        title: content.title,
        action: `updated-to-${status}`,
        versionNumber: targetVersionNumber,
      });

    } catch (error) {
      errors.push({
        contentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

// Helper function for bulk publish
async function performBulkPublish(
  contentIds: string[], 
  params: any, 
  errors: any[]
): Promise<any[]> {
  const results = [];
  const { versionNumber } = params || {};

  for (const contentId of contentIds) {
    try {
      const content = await Content.findById(contentId);
      
      if (!content) {
        errors.push({
          contentId,
          error: 'Content not found',
        });
        continue;
      }

      if (!content.versions || content.versions.length === 0) {
        errors.push({
          contentId,
          title: content.title,
          error: 'No versions found',
        });
        continue;
      }

      // Determine which version to publish
      const targetVersionNumber = versionNumber || content.versions.length;
      const versionIndex = content.versions.findIndex(
        v => v.versionNumber === targetVersionNumber
      );

      if (versionIndex === -1) {
        errors.push({
          contentId,
          title: content.title,
          error: `Version ${targetVersionNumber} not found`,
        });
        continue;
      }

      const targetVersion = content.versions[versionIndex];

      // Check if version is in a publishable state
      if (targetVersion.status === 'rejected') {
        errors.push({
          contentId,
          title: content.title,
          error: `Cannot publish rejected version ${targetVersionNumber}`,
        });
        continue;
      }

      // Use the model method to publish
      (content as any).publishVersion(targetVersionNumber);
      await content.save();

      results.push({
        contentId,
        title: content.title,
        action: 'published',
        versionNumber: targetVersionNumber,
      });

    } catch (error) {
      errors.push({
        contentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

// Helper function for bulk unpublish
async function performBulkUnpublish(contentIds: string[], errors: any[]): Promise<any[]> {
  const results = [];

  for (const contentId of contentIds) {
    try {
      const content = await Content.findById(contentId);
      
      if (!content) {
        errors.push({
          contentId,
          error: 'Content not found',
        });
        continue;
      }

      // Check if content has a published version
      const publishedVersionIndex = content.versions.findIndex(v => v.status === 'published');
      
      if (publishedVersionIndex === -1) {
        errors.push({
          contentId,
          title: content.title,
          error: 'No published version found',
        });
        continue;
      }

      // Unpublish: change status to draft and clear publishedAt
      content.versions[publishedVersionIndex].status = 'draft';
      content.versions[publishedVersionIndex].publishedAt = undefined;
      
      // Clear currentVersion if it was pointing to this version
      if (content.currentVersion === publishedVersionIndex) {
        content.currentVersion = undefined;
      }

      // Clear Notion page ID
      content.notionPageId = undefined;

      await content.save();
      results.push({
        contentId,
        title: content.title,
        action: 'unpublished',
        versionNumber: content.versions[publishedVersionIndex].versionNumber,
      });

    } catch (error) {
      errors.push({
        contentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}