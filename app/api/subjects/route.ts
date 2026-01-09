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
import { DemoStorage } from '@/lib/demo-storage';

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

    // Get demo data from storage
    const demoSubjects = DemoStorage.getSubjects();

    // Filter by level
    let filteredSubjects = demoSubjects;
    if (level && level !== 'all') {
      filteredSubjects = filteredSubjects.filter(s => s.level === level);
    }

    // Filter by search
    if (search) {
      filteredSubjects = filteredSubjects.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort
    if (sortBy === 'name') {
      filteredSubjects.sort((a, b) => {
        const comparison = a.name.localeCompare(b.name);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    // Pagination
    const total = filteredSubjects.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const paginatedSubjects = filteredSubjects.slice(skip, skip + limit);

    return successResponse({
      data: paginatedSubjects,
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
    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateSubjectSchema.parse(body);

    // For demo mode, create and store the subject
    const mockSubject: ISubject = {
      _id: `507f1f77bcf86cd799${Date.now().toString().slice(-6)}` as any,
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to demo storage
    const createdSubject = DemoStorage.addSubject(mockSubject);
    console.log('Demo subject created and stored:', createdSubject);

    return createdResponse(createdSubject, 'Subject created successfully (demo mode)');
  } catch (error) {
    return handleApiError(error);
  }
}
