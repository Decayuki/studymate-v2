import { NextRequest } from 'next/server';
import { connectToDatabase, Content } from '@studymate/db';
import { UpdateContentSchema } from '@studymate/shared';
import {
  successResponse,
  noContentResponse,
  notFoundResponse,
  handleApiError,
  isValidObjectId,
  errorResponse,
} from '@/lib/api-utils';

/**
 * GET /api/contents/[id]
 * Get a single content by ID with all versions
 */
export async function GET(
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

    // Find content with populated subject
    const content = await Content.findById(id).populate('subject').lean().exec();

    if (!content) {
      return notFoundResponse('Content');
    }

    return successResponse(content);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/contents/[id]
 * Update content metadata (title, subject, currentVersion)
 *
 * Body:
 * {
 *   "title"?: string,
 *   "subject"?: ObjectId,
 *   "currentVersion"?: number
 * }
 */
export async function PUT(
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = UpdateContentSchema.parse(body);

    // If updating currentVersion, verify version exists
    if (validatedData.currentVersion !== undefined) {
      const content = await Content.findById(id).lean().exec();

      if (!content) {
        return notFoundResponse('Content');
      }

      if (validatedData.currentVersion >= content.versions.length) {
        return errorResponse(
          'VALIDATION_ERROR',
          `Version ${validatedData.currentVersion} does not exist`,
          400
        );
      }
    }

    // Update content
    const content = await Content.findByIdAndUpdate(
      id,
      { $set: validatedData },
      { new: true, runValidators: true }
    )
      .populate('subject')
      .lean()
      .exec();

    if (!content) {
      return notFoundResponse('Content');
    }

    return successResponse(content, 'Content updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/contents/[id]
 * Delete a content by ID
 */
export async function DELETE(
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

    // Delete content
    const content = await Content.findByIdAndDelete(id).lean().exec();

    if (!content) {
      return notFoundResponse('Content');
    }

    return noContentResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
