import { NextRequest } from 'next/server';
import { connectToDatabase, Subject } from '@studymate/db';
import { UpdateSubjectSchema } from '@studymate/shared';
import {
  successResponse,
  noContentResponse,
  notFoundResponse,
  handleApiError,
  isValidObjectId,
  errorResponse,
} from '@/lib/api-utils';

/**
 * GET /api/subjects/[id]
 * Get a single subject by ID
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
      return errorResponse('VALIDATION_ERROR', 'Invalid subject ID format', 400);
    }

    // Find subject
    const subject = await Subject.findById(id).lean().exec();

    if (!subject) {
      return notFoundResponse('Subject');
    }

    return successResponse(subject);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/subjects/[id]
 * Update a subject by ID
 *
 * Body:
 * {
 *   "name": "Mathématiques STMG 1A (Updated)",
 *   "level": "lycee",
 *   "description": "Updated description"
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
      return errorResponse('VALIDATION_ERROR', 'Invalid subject ID format', 400);
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = UpdateSubjectSchema.parse(body);

    // Update subject
    const subject = await Subject.findByIdAndUpdate(
      id,
      { $set: validatedData },
      { new: true, runValidators: true }
    )
      .lean()
      .exec();

    if (!subject) {
      return notFoundResponse('Subject');
    }

    return successResponse(subject, 'Subject updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/subjects/[id]
 * Delete a subject by ID
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
      return errorResponse('VALIDATION_ERROR', 'Invalid subject ID format', 400);
    }

    // Delete subject
    const subject = await Subject.findByIdAndDelete(id).lean().exec();

    if (!subject) {
      return notFoundResponse('Subject');
    }

    return noContentResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
