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
 * PATCH /api/contents/[id]/versions/[versionNumber]/promote
 * Promote a rejected version to active (draft) status
 *
 * This will:
 * - Change the specified version from 'rejected' to 'draft'
 * - Mark the current active version as 'rejected'
 * - Update currentVersion pointer
 * - Clear rejection metadata from promoted version
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

    const versionToPromote = content.versions[versionIndex];

    // Check if version is rejected
    if (versionToPromote.status !== 'rejected') {
      return errorResponse(
        'BAD_REQUEST',
        `Version ${versionNum} is not rejected. Current status: ${versionToPromote.status}. Only rejected versions can be promoted.`,
        400
      );
    }

    // Get current active version
    const currentVersionIndex = content.currentVersion;
    let currentVersion = null;
    if (currentVersionIndex !== undefined) {
      currentVersion = content.versions[currentVersionIndex];
    }

    // Mark current version as rejected (if exists)
    if (currentVersion) {
      currentVersion.status = 'rejected';
      currentVersion.rejectedAt = new Date();
      currentVersion.rejectionReason = `Replaced by promoted version ${versionNum} (${versionToPromote.aiModel})`;
    }

    // Promote the rejected version
    content.versions[versionIndex].status = 'draft';
    content.versions[versionIndex].rejectedAt = undefined;
    content.versions[versionIndex].rejectionReason = undefined;
    content.currentVersion = versionIndex;

    await content.save();

    // Log the promotion for analytics
    console.log('Version promoted:', {
      contentId: content._id,
      promotedVersion: versionNum,
      promotedModel: versionToPromote.aiModel,
      previousVersion: currentVersion?.versionNumber,
      previousModel: currentVersion?.aiModel,
    });

    return successResponse(
      {
        ...content.toObject(),
        promotionInfo: {
          promotedVersion: versionNum,
          promotedModel: versionToPromote.aiModel,
          previousVersion: currentVersion?.versionNumber,
          previousModel: currentVersion?.aiModel,
        },
      },
      `Version ${versionNum} (${versionToPromote.aiModel}) promoted successfully`
    );
  } catch (error) {
    return handleApiError(error);
  }
}