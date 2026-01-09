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

    // Demo data for now (bypassing database)
    const demoSubjects: ISubject[] = [
      {
        _id: '507f1f77bcf86cd799439011' as any,
        name: 'Mathématiques Terminale S',
        description: 'Mathématiques avancées pour Terminale Scientifique',
        level: 'lycee',
        category: 'mathematics',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: '507f1f77bcf86cd799439012' as any,
        name: 'Physique-Chimie 1ère',
        description: 'Sciences physiques niveau première',
        level: 'lycee',
        category: 'physics',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: '507f1f77bcf86cd799439013' as any,
        name: 'Informatique L1',
        description: 'Introduction à l\'informatique - Licence 1',
        level: 'superieur',
        category: 'computer-science',
        credits: 6,
        volume: 60,
        higherEducationContext: {
          institution: 'Université de Paris',
          institutionType: 'university',
          degree: 'Licence Informatique',
          year: 1,
          semester: 'S1',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

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

    // For demo mode, return success with mock created subject
    const mockSubject = {
      _id: `507f1f77bcf86cd799${Date.now().toString().slice(-6)}`,
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Demo subject creation:', mockSubject);

    return createdResponse(mockSubject, 'Subject created successfully (demo mode)');
  } catch (error) {
    return handleApiError(error);
  }
}
