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
 * GET /api/subjects/[id]/courses
 * Get all course content for a specific subject (for TD generation)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const { id } = await params;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid subject ID format', 400);
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const publishedOnly = searchParams.get('published') === 'true';
    const search = searchParams.get('search');

    // Build query
    const query: any = {
      subject: id,
      type: 'course',
    };

    // Add search filter if provided
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Find courses
    const courses = await Content.find(query)
      .populate('subject', 'name level')
      .sort({ createdAt: -1 })
      .exec();

    if (courses.length === 0) {
      return successResponse(
        [],
        'No course content found for this subject'
      );
    }

    // Filter and format courses
    const formattedCourses = courses
      .map(course => {
        const publishedVersion = (course as any).publishedVersion;
        const latestVersion = course.versions[course.versions.length - 1];
        
        // For published only filter, skip if no published version
        if (publishedOnly && !publishedVersion) {
          return null;
        }

        const activeVersion = publishedVersion || latestVersion;
        
        return {
          _id: course._id,
          title: course.title,
          subject: course.subject,
          type: course.type,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
          versionsCount: course.versions.length,
          hasPublishedVersion: !!publishedVersion,
          activeVersion: activeVersion ? {
            versionNumber: activeVersion.versionNumber,
            status: activeVersion.status,
            aiModel: activeVersion.aiModel,
            createdAt: activeVersion.createdAt,
            contentPreview: activeVersion.content.substring(0, 200) + '...',
            tokensUsed: activeVersion.metadata.tokensUsed,
          } : null,
        };
      })
      .filter(Boolean); // Remove null entries from published-only filter

    console.log('Courses fetched:', {
      subjectId: id,
      totalFound: courses.length,
      afterFiltering: formattedCourses.length,
      publishedOnly,
      searchTerm: search,
    });

    return successResponse(
      formattedCourses,
      `Found ${formattedCourses.length} course(s) for subject`
    );
  } catch (error) {
    return handleApiError(error);
  }
}