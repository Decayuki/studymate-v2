import { NextRequest } from 'next/server';
import { connectToDatabase, Content } from '@studymate/db';
import {
  successResponse,
  notFoundResponse,
  handleApiError,
  isValidObjectId,
  errorResponse,
} from '@/lib/api-utils';
import { z } from 'zod';

/**
 * PATCH /api/contents/[id]/versions/[versionNumber]/reject
 * Reject a specific version of the content
 *
 * Body (optional):
 * {
 *   "reason"?: string
 * }
 *
 * This will:
 * - Set the version status to 'rejected'
 * - Set rejectedAt timestamp
 * - Optionally store rejection reason
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

    // Parse optional rejection reason
    const body = await request.json().catch(() => ({}));
    const schema = z.object({
      reason: z.string().max(500).optional(),
    });
    const validatedData = schema.parse(body);

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

    // Use the model method to reject version
    try {
      (content as any).rejectVersion(versionNum, validatedData.reason);
      await content.save();
    } catch (error) {
      if (error instanceof Error) {
        return errorResponse('VALIDATION_ERROR', error.message, 400);
      }
      throw error;
    }

    return successResponse(
      content.toObject(),
      `Version ${versionNum} rejected successfully`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
