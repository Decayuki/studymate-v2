import { NextRequest } from 'next/server';
import { connectToDatabase, Subject } from '@studymate/db';
import {
  CreateSubjectSchema,
  SubjectFiltersSchema,
  type ISubject,
} from '@studymate/shared';
import {
  successResponse,
  createdResponse,
  handleApiError,
  parsePaginationParams,
} from '@/lib/api-utils';

/**
 * GET /api/subjects
 * List all subjects with optional filtering and pagination
 *
 * Query params:
 * - level: 'lycee' | 'superieur' (optional)
 * - search: string (optional - search by name)
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - sortBy: string (default: 'name')
 * - sortOrder: 'asc' | 'desc' (default: 'asc')
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, sortBy, sortOrder } = parsePaginationParams(searchParams);

    const level = searchParams.get('level');
    const search = searchParams.get('search');

    // Connect to database
    await connectToDatabase();

    // Build MongoDB query
    const filter: any = {};
    if (level && level !== 'all') {
      filter.level = level;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const totalCount = await Subject.countDocuments(filter);
    const subjects = await Subject.find(filter)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit);

    return successResponse({
      data: subjects,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('GET /api/subjects error:', error);
    return handleApiError(error);
  }
}

/**
 * POST /api/subjects
 * Create a new subject
 *
 * Body:
 * {
 *   "name": "Mathématiques STMG 1A",
 *   "level": "lycee",
 *   "description": "Course de mathématiques pour 1ère STMG"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateSubjectSchema.parse(body);

    // Connect to database
    await connectToDatabase();
    
    // Create subject in database
    const subject = await Subject.create(validatedData);
    
    return createdResponse(subject.toObject(), 'Subject created successfully');
  } catch (error) {
    console.error('POST /api/subjects error:', error);
    return handleApiError(error);
  }
}
