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
 * DELETE /api/contents/[id]/versions/[versionNumber]
 * Delete a version permanently
 *
 * This will:
 * - Remove the version from the versions array
 * - Update version numbers if needed
 * - Ensure currentVersion pointer remains valid
 * 
 * Restrictions:
 * - Cannot delete the only version
 * - Cannot delete published versions (unpublish first)
 * - Cannot delete the current active version (promote another first)
 */
export async function DELETE(
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

    // Check if only one version exists
    if (content.versions.length <= 1) {
      return errorResponse(
        'BAD_REQUEST',
        'Cannot delete the only version. Content must have at least one version.',
        400
      );
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

    const versionToDelete = content.versions[versionIndex];

    // Check if version is published
    if (versionToDelete.status === 'published') {
      return errorResponse(
        'BAD_REQUEST',
        `Cannot delete published version ${versionNum}. Unpublish it first.`,
        400
      );
    }

    // Check if this is the current active version
    const currentVersionIndex = content.currentVersion;
    if (currentVersionIndex === versionIndex) {
      return errorResponse(
        'BAD_REQUEST',
        `Cannot delete current active version ${versionNum}. Promote another version first.`,
        400
      );
    }

    // Store info for response
    const deletedVersionInfo = {
      versionNumber: versionToDelete.versionNumber,
      aiModel: versionToDelete.aiModel,
      status: versionToDelete.status,
      createdAt: versionToDelete.createdAt,
    };

    // Remove the version
    content.versions.splice(versionIndex, 1);

    // Update currentVersion pointer if needed (if it's pointing to a version after the deleted one)
    if (currentVersionIndex !== undefined && currentVersionIndex > versionIndex) {
      content.currentVersion = currentVersionIndex - 1;
    }

    await content.save();

    // Log the deletion for audit
    console.log('Version deleted:', {
      contentId: content._id,
      deletedVersion: deletedVersionInfo,
      remainingVersions: content.versions.length,
    });

    return successResponse(
      {
        ...content.toObject(),
        deletionInfo: {
          deletedVersion: deletedVersionInfo,
          remainingVersions: content.versions.length,
        },
      },
      `Version ${versionNum} deleted successfully`
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/contents/[id]/versions/[versionNumber]
 * Get a specific version details
 */
export async function GET(
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
    const version = content.versions.find((v) => v.versionNumber === versionNum);

    if (!version) {
      return errorResponse(
        'NOT_FOUND',
        `Version ${versionNum} not found`,
        404
      );
    }

    return successResponse(
      {
        content: content.toObject(),
        version: version,
        isCurrentVersion: content.currentVersion !== undefined && 
                         content.versions[content.currentVersion]?.versionNumber === versionNum,
      },
      `Version ${versionNum} retrieved successfully`
    );
  } catch (error) {
    return handleApiError(error);
  }
}