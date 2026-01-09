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
    // Bypass database for demo

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

    // Demo content data for now
    const demoContents: any[] = [
      {
        _id: '507f1f77bcf86cd799439021',
        title: 'Introduction aux Limites',
        type: 'course',
        subject: {
          _id: '507f1f77bcf86cd799439011',
          name: 'Mathématiques Terminale S',
          level: 'lycee'
        },
        primaryStatus: 'published',
        versionCounts: { total: 2, draft: 0, published: 1, rejected: 0, comparing: 1 },
        modelsUsed: ['gemini'],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-16')
      },
      {
        _id: '507f1f77bcf86cd799439022',
        title: 'TD - Calcul de Limites',
        type: 'td',
        subject: {
          _id: '507f1f77bcf86cd799439011',
          name: 'Mathématiques Terminale S',
          level: 'lycee'
        },
        primaryStatus: 'draft',
        versionCounts: { total: 1, draft: 1, published: 0, rejected: 0, comparing: 0 },
        modelsUsed: ['gemini'],
        createdAt: new Date('2024-01-17'),
        updatedAt: new Date('2024-01-17')
      },
      {
        _id: '507f1f77bcf86cd799439023',
        title: 'Structures de Données en Python',
        type: 'course',
        subject: {
          _id: '507f1f77bcf86cd799439013',
          name: 'Informatique L1',
          level: 'superieur'
        },
        primaryStatus: 'published',
        versionCounts: { total: 3, draft: 1, published: 1, rejected: 1, comparing: 0 },
        modelsUsed: ['gemini', 'claude'],
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-12')
      }
    ];

    // Apply filters
    let filteredContents = [...demoContents];
    
    // Filter by level through subject
    if (filters.level) {
      filteredContents = filteredContents.filter(c => c.subject.level === filters.level);
    }

    // Filter by types
    if (filters.types && filters.types.length > 0) {
      filteredContents = filteredContents.filter(c => filters.types!.includes(c.type));
    }

    // Filter by statuses
    if (filters.statuses && filters.statuses.length > 0) {
      filteredContents = filteredContents.filter(c => filters.statuses!.includes(c.primaryStatus));
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredContents = filteredContents.filter(c => 
        c.title.toLowerCase().includes(searchLower) ||
        c.subject.name.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (filters.sortBy === 'title') {
      filteredContents.sort((a, b) => {
        const comparison = a.title.localeCompare(b.title);
        return filters.sortOrder === 'asc' ? comparison : -comparison;
      });
    } else if (filters.sortBy === 'updatedAt') {
      filteredContents.sort((a, b) => {
        const aTime = new Date(a.updatedAt).getTime();
        const bTime = new Date(b.updatedAt).getTime();
        return filters.sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      });
    }

    const total = filteredContents.length;

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

    // Apply pagination
    const paginatedContents = filteredContents.slice(filters.offset, filters.offset + filters.limit);

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