import { NextRequest } from 'next/server';
import { connectToDatabase, Content } from '@studymate/db';
import {
  successResponse,
  handleApiError,
  errorResponse,
} from '@/lib/api-utils';
import { z } from 'zod';

/**
 * PATCH /api/contents/[id]/versions/[versionNumber]/content
 * Update the content of a specific version
 * 
 * This endpoint is specifically for the auto-save functionality
 * in the Tiptap editor. It updates only the content field of a version
 * without changing any other metadata.
 */

const UpdateVersionContentSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionNumber: string }> }
) {
  try {
    // Connect to database
    await connectToDatabase();

    const { id: contentId, versionNumber } = await params;
    const versionNum = parseInt(versionNumber, 10);

    // Validate version number
    if (isNaN(versionNum) || versionNum < 1) {
      return errorResponse('VALIDATION_ERROR', 'Invalid version number', 400);
    }

    // Parse and validate request body
    const body = await request.json();
    const { content } = UpdateVersionContentSchema.parse(body);

    // Find the content document
    const contentDoc = await Content.findById(contentId).exec();
    if (!contentDoc) {
      return errorResponse('NOT_FOUND', 'Content not found', 404);
    }

    // Find the specific version
    const versionIndex = contentDoc.versions.findIndex(
      (v) => v.versionNumber === versionNum
    );

    if (versionIndex === -1) {
      return errorResponse(
        'NOT_FOUND',
        `Version ${versionNum} not found`,
        404
      );
    }

    // Check if version is editable (only drafts and comparing versions can be edited)
    const version = contentDoc.versions[versionIndex];
    if (!['draft', 'comparing'].includes(version.status)) {
      return errorResponse(
        'FORBIDDEN',
        `Cannot edit ${version.status} version. Only draft and comparing versions can be edited.`,
        403
      );
    }

    // Update the content of the specific version
    contentDoc.versions[versionIndex].content = content;

    // Save the document
    await contentDoc.save();

    // Return the updated version
    const updatedVersion = contentDoc.versions[versionIndex];

    return successResponse(
      {
        version: updatedVersion,
        contentId,
        versionNumber: versionNum,
      },
      'Version content updated successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}