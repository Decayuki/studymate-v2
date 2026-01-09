import { NextRequest } from 'next/server';
import { connectToDatabase, Content } from '@studymate/db';
import {
  successResponse,
  handleApiError,
  errorResponse,
} from '@/lib/api-utils';
import type { EducationLevel, ContentType, ContentStatus, AIModel } from '@studymate/shared';

interface ContentFilters {
  level?: EducationLevel;
  subjects?: string[]; // Subject IDs
  types?: ContentType[];
  statuses?: ContentStatus[];
  models?: AIModel[];
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'subject';
  sortOrder?: 'asc' | 'desc';
  limit: number;
  offset: number;
}

/**
 * GET /api/contents/all
 * Get all content with comprehensive filtering and search capabilities
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const filters: ContentFilters = {
      level: searchParams.get('level') as EducationLevel || undefined,
      subjects: searchParams.get('subjects')?.split(',').filter(Boolean),
      types: searchParams.get('types')?.split(',').filter(Boolean) as ContentType[],
      statuses: searchParams.get('statuses')?.split(',').filter(Boolean) as ContentStatus[],
      models: searchParams.get('models')?.split(',').filter(Boolean) as AIModel[],
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: (searchParams.get('sortBy') as ContentFilters['sortBy']) || 'updatedAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    // Build MongoDB aggregation pipeline
    const pipeline: any[] = [
      // Join with subjects collection
      {
        $lookup: {
          from: 'subjects',
          localField: 'subjectId',
          foreignField: '_id',
          as: 'subject'
        }
      },
      {
        $unwind: '$subject'
      }
    ];

    // Add filters to pipeline
    const matchStage: any = {};

    // Filter by level through subject
    if (filters.level) {
      matchStage['subject.level'] = filters.level;
    }

    // Filter by subject IDs
    if (filters.subjects && filters.subjects.length > 0) {
      matchStage.subjectId = { $in: filters.subjects.map(id => id) };
    }

    // Filter by types
    if (filters.types && filters.types.length > 0) {
      matchStage.type = { $in: filters.types };
    }

    // Filter by statuses
    if (filters.statuses && filters.statuses.length > 0) {
      matchStage.primaryStatus = { $in: filters.statuses };
    }

    // Filter by models
    if (filters.models && filters.models.length > 0) {
      matchStage.modelsUsed = { $in: filters.models };
    }

    // Filter by date range
    if (filters.dateFrom || filters.dateTo) {
      matchStage.createdAt = {};
      if (filters.dateFrom) {
        matchStage.createdAt.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        matchStage.createdAt.$lte = new Date(filters.dateTo);
      }
    }

    // Filter by search
    if (filters.search) {
      matchStage.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { 'subject.name': { $regex: filters.search, $options: 'i' } }
      ];
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Add sorting
    const sortStage: any = {};
    if (filters.sortBy === 'title') {
      sortStage.title = filters.sortOrder === 'asc' ? 1 : -1;
    } else if (filters.sortBy === 'subject') {
      sortStage['subject.name'] = filters.sortOrder === 'asc' ? 1 : -1;
    } else if (filters.sortBy) {
      sortStage[filters.sortBy] = filters.sortOrder === 'asc' ? 1 : -1;
    } else {
      sortStage.updatedAt = -1; // default sort
    }
    pipeline.push({ $sort: sortStage });

    // Execute aggregation for total count
    const totalPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = await Content.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Add pagination to main pipeline
    pipeline.push(
      { $skip: filters.offset },
      { $limit: filters.limit }
    );

    // Execute main aggregation
    const paginatedContents = await Content.aggregate(pipeline);

    // Calculate pagination info
    const totalPages = Math.ceil(total / filters.limit);
    const currentPage = Math.floor(filters.offset / filters.limit) + 1;

    console.log('Content history query:', {
      filters,
      resultsCount: paginatedContents.length,
      total,
      page: currentPage,
      totalPages,
    });

    return successResponse({
      contents: paginatedContents,
      pagination: {
        total,
        offset: filters.offset,
        limit: filters.limit,
        page: currentPage,
        totalPages,
        hasNext: filters.offset + filters.limit < total,
        hasPrevious: filters.offset > 0,
      },
      filters: filters, // Echo back applied filters
    }, `Found ${paginatedContents.length} content items`);

  } catch (error) {
    console.error('Error in /api/contents/all:', error);
    return handleApiError(error);
  }
}