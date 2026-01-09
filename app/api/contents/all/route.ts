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
  limit?: number;
  offset?: number;
}

/**
 * GET /api/contents/all
 * Get all content with comprehensive filtering and search capabilities
 */
export async function GET(request: NextRequest) {
  try {
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
      // Populate subject information
      {
        $lookup: {
          from: 'subjects',
          localField: 'subject',
          foreignField: '_id',
          as: 'subjectInfo'
        }
      },
      {
        $unwind: '$subjectInfo'
      }
    ];

    // Add match filters
    const matchConditions: any = {};

    // Filter by education level
    if (filters.level) {
      matchConditions['subjectInfo.level'] = filters.level;
    }

    // Filter by subjects
    if (filters.subjects && filters.subjects.length > 0) {
      matchConditions.subject = { 
        $in: filters.subjects.map(id => {
          try {
            return require('mongoose').Types.ObjectId(id);
          } catch {
            return id; // In case it's already an ObjectId
          }
        })
      };
    }

    // Filter by content types
    if (filters.types && filters.types.length > 0) {
      matchConditions.type = { $in: filters.types };
    }

    // Filter by date range
    if (filters.dateFrom || filters.dateTo) {
      matchConditions.createdAt = {};
      if (filters.dateFrom) {
        matchConditions.createdAt.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        // Add 1 day to include the full end date
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        matchConditions.createdAt.$lte = endDate;
      }
    }

    // Search functionality
    if (filters.search) {
      const searchRegex = { $regex: filters.search, $options: 'i' };
      matchConditions.$or = [
        { title: searchRegex },
        { 'subjectInfo.name': searchRegex },
        { 'versions.content': searchRegex },
      ];
    }

    // Add match stage if we have conditions
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Add additional processing stages
    pipeline.push(
      // Add computed fields
      {
        $addFields: {
          // Get latest version info
          latestVersion: { $arrayElemAt: ['$versions', -1] },
          // Get published version
          publishedVersion: {
            $arrayElemAt: [
              { $filter: { input: '$versions', cond: { $eq: ['$$this.status', 'published'] } } },
              0
            ]
          },
          // Count versions by status
          versionCounts: {
            total: { $size: '$versions' },
            draft: {
              $size: {
                $filter: { input: '$versions', cond: { $eq: ['$$this.status', 'draft'] } }
              }
            },
            published: {
              $size: {
                $filter: { input: '$versions', cond: { $eq: ['$$this.status', 'published'] } }
              }
            },
            rejected: {
              $size: {
                $filter: { input: '$versions', cond: { $eq: ['$$this.status', 'rejected'] } }
              }
            },
            comparing: {
              $size: {
                $filter: { input: '$versions', cond: { $eq: ['$$this.status', 'comparing'] } }
              }
            }
          },
          // Get all models used
          modelsUsed: {
            $setUnion: ['$versions.aiModel']
          }
        }
      }
    );

    // Filter by status (after computing status from versions)
    if (filters.statuses && filters.statuses.length > 0) {
      const statusMatch: any = {};
      
      filters.statuses.forEach(status => {
        if (status === 'published') {
          statusMatch['publishedVersion'] = { $ne: null };
        } else if (status === 'draft') {
          statusMatch['versionCounts.draft'] = { $gt: 0 };
        } else if (status === 'rejected') {
          statusMatch['versionCounts.rejected'] = { $gt: 0 };
        } else if (status === 'comparing') {
          statusMatch['versionCounts.comparing'] = { $gt: 0 };
        }
      });

      if (Object.keys(statusMatch).length > 0) {
        pipeline.push({ $match: { $or: Object.keys(statusMatch).map(key => ({ [key]: statusMatch[key] })) } });
      }
    }

    // Filter by AI models used
    if (filters.models && filters.models.length > 0) {
      pipeline.push({
        $match: {
          modelsUsed: { $in: filters.models }
        }
      });
    }

    // Add sorting
    const sortStage: any = {};
    switch (filters.sortBy) {
      case 'title':
        sortStage.title = filters.sortOrder === 'asc' ? 1 : -1;
        break;
      case 'subject':
        sortStage['subjectInfo.name'] = filters.sortOrder === 'asc' ? 1 : -1;
        break;
      case 'createdAt':
        sortStage.createdAt = filters.sortOrder === 'asc' ? 1 : -1;
        break;
      case 'updatedAt':
      default:
        sortStage.updatedAt = filters.sortOrder === 'asc' ? 1 : -1;
        break;
    }
    pipeline.push({ $sort: sortStage });

    // Count total for pagination
    const countPipeline = [...pipeline, { $count: 'total' }];

    // Add pagination
    if (filters.offset > 0) {
      pipeline.push({ $skip: filters.offset });
    }
    if (filters.limit > 0) {
      pipeline.push({ $limit: filters.limit });
    }

    // Project final shape
    pipeline.push({
      $project: {
        _id: 1,
        title: 1,
        type: 1,
        subject: '$subjectInfo',
        specifications: 1,
        createdAt: 1,
        updatedAt: 1,
        currentVersion: 1,
        notionPageId: 1,
        versionCounts: 1,
        modelsUsed: 1,
        latestVersion: {
          versionNumber: 1,
          status: 1,
          aiModel: 1,
          createdAt: 1,
        },
        publishedVersion: {
          versionNumber: 1,
          status: 1,
          aiModel: 1,
          publishedAt: 1,
        },
        // Get primary status
        primaryStatus: {
          $cond: {
            if: { $ne: ['$publishedVersion', null] },
            then: 'published',
            else: {
              $cond: {
                if: { $gt: ['$versionCounts.comparing', 0] },
                then: 'comparing',
                else: {
                  $cond: {
                    if: { $gt: ['$versionCounts.draft', 0] },
                    then: 'draft',
                    else: 'rejected'
                  }
                }
              }
            }
          }
        }
      }
    });

    // Execute aggregation and count
    const [contents, totalResult] = await Promise.all([
      Content.aggregate(pipeline),
      Content.aggregate(countPipeline)
    ]);

    const total = totalResult[0]?.total || 0;

    // Calculate pagination info
    const totalPages = Math.ceil(total / filters.limit);
    const currentPage = Math.floor(filters.offset / filters.limit) + 1;

    console.log('Content history query:', {
      filters,
      resultsCount: contents.length,
      total,
      page: currentPage,
      totalPages,
    });

    return successResponse({
      contents,
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
    }, `Found ${contents.length} content items`);

  } catch (error) {
    console.error('Error in /api/contents/all:', error);
    return handleApiError(error);
  }
}