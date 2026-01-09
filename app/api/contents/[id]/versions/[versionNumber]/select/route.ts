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
 * PATCH /api/contents/[id]/versions/[versionNumber]/select
 * Select a version from comparison mode
 *
 * This will:
 * - Set the selected version as current and status to 'draft'
 * - Mark other comparing versions as 'rejected'
 * - Update currentVersion pointer
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

    const selectedVersion = content.versions[versionIndex];

    // Check if version is in comparing state
    if (selectedVersion.status !== 'comparing') {
      return errorResponse(
        'BAD_REQUEST',
        `Version ${versionNum} is not in comparing state. Current status: ${selectedVersion.status}`,
        400
      );
    }

    // Find other comparing versions and mark them as rejected
    content.versions.forEach((version, index) => {
      if (version.status === 'comparing' && index !== versionIndex) {
        version.status = 'rejected';
        version.rejectedAt = new Date();
        version.rejectionReason = `Not selected during comparison (${selectedVersion.aiModel} was chosen)`;
      }
    });

    // Mark selected version as draft and set as current
    content.versions[versionIndex].status = 'draft';
    content.currentVersion = versionIndex;

    await content.save();

    // Log the selection for analytics
    console.log('Version selected from comparison:', {
      contentId: content._id,
      selectedVersion: versionNum,
      selectedModel: selectedVersion.aiModel,
      rejectedVersions: content.versions
        .filter(v => v.status === 'rejected' && v.rejectionReason?.includes('Not selected during comparison'))
        .map(v => ({ version: v.versionNumber, model: v.aiModel })),
    });

    return successResponse(
      {
        ...content.toObject(),
        selectionInfo: {
          selectedVersion: versionNum,
          selectedModel: selectedVersion.aiModel,
          previousStatus: 'comparing',
          newStatus: 'draft',
        },
      },
      `Version ${versionNum} (${selectedVersion.aiModel}) selected successfully`
    );
  } catch (error) {
    return handleApiError(error);
  }
}