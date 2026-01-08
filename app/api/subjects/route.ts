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
    // Connect to database
    await connectToDatabase();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, sortBy, sortOrder } = parsePaginationParams(searchParams);

    // Parse filters
    const filters: Record<string, unknown> = {};

    const level = searchParams.get('level');
    const search = searchParams.get('search');

    // Validate filters with Zod
    const validatedFilters = SubjectFiltersSchema.parse({
      level: level || undefined,
      name: search || undefined,
    });

    // Build query filters
    if (validatedFilters.level) {
      filters.level = validatedFilters.level;
    }

    if (validatedFilters.name) {
      filters.name = { $regex: validatedFilters.name, $options: 'i' };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [subjects, total] = await Promise.all([
      Subject.find(filters)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean<ISubject[]>()
        .exec(),
      Subject.countDocuments(filters),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    return successResponse({
      data: subjects,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
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
    // Connect to database
    await connectToDatabase();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateSubjectSchema.parse(body);

    // Create subject
    const subject = await Subject.create(validatedData);

    return createdResponse(subject.toObject(), 'Subject created successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
