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

    try {
      // Try database first
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
    } catch (dbError) {
      console.warn('Database error, falling back to demo data:', dbError);
      
      // Fallback to demo data if database fails
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

      // Apply filters to demo data
      let filteredSubjects = demoSubjects;
      if (level && level !== 'all') {
        filteredSubjects = filteredSubjects.filter(s => s.level === level);
      }
      if (search) {
        filteredSubjects = filteredSubjects.filter(s => 
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.description?.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Sort demo data
      if (sortBy === 'name') {
        filteredSubjects.sort((a, b) => {
          const comparison = a.name.localeCompare(b.name);
          return sortOrder === 'asc' ? comparison : -comparison;
        });
      }

      // Pagination for demo data
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
    }
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

    try {
      // Try database first
      await connectToDatabase();
      const subject = await Subject.create(validatedData);
      return createdResponse(subject.toObject(), 'Subject created successfully');
    } catch (dbError) {
      console.warn('Database error, creating demo subject:', dbError);
      
      // Fallback to demo mode
      const mockSubject: ISubject = {
        _id: `507f1f77bcf86cd799${Date.now().toString().slice(-6)}` as any,
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return createdResponse(mockSubject, 'Subject created successfully (demo mode)');
    }
  } catch (error) {
    return handleApiError(error);
  }
}
