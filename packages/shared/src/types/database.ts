import { Types } from 'mongoose';

/**
 * Database Types for StudyMate
 *
 * These types define the shape of documents in MongoDB
 * and are used across the application for type safety.
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type ContentType = 'course' | 'td' | 'control';
export type EducationLevel = 'lycee' | 'superieur';
export type AIModel = 'gemini' | 'claude';
export type ContentStatus = 'draft' | 'comparing' | 'published' | 'rejected';

// ============================================================================
// SUBJECT
// ============================================================================

/**
 * Subject (Matière)
 * Represents an academic subject (e.g., "Mathématiques", "Histoire")
 */
export interface ISubject {
  _id: Types.ObjectId;
  name: string;
  level: EducationLevel;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input type for creating a new Subject
 */
export interface ICreateSubject {
  name: string;
  level: EducationLevel;
  description?: string;
}

/**
 * Input type for updating a Subject
 */
export interface IUpdateSubject {
  name?: string;
  level?: EducationLevel;
  description?: string;
}

// ============================================================================
// CONTENT VERSION
// ============================================================================

/**
 * AI Generation Metadata
 * Tracks information about the AI generation process
 */
export interface IAIGenerationMetadata {
  tokensUsed: number;
  durationMs: number;
  model: AIModel;
  modelVersion: string; // e.g., "gemini-1.5-pro", "claude-3.5-sonnet"
  temperature?: number;
  maxTokens?: number;
  error?: string;
}

/**
 * Content Version
 * Each content can have multiple versions (drafts, comparisons, published)
 */
export interface IContentVersion {
  versionNumber: number;
  status: ContentStatus;
  aiModel: AIModel;
  prompt: string;
  content: string; // Markdown or HTML content
  metadata: IAIGenerationMetadata;
  createdAt: Date;
  publishedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}

/**
 * Input type for creating a new version
 */
export interface ICreateContentVersion {
  aiModel: AIModel;
  prompt: string;
  content: string;
  metadata: IAIGenerationMetadata;
}

// ============================================================================
// CONTENT
// ============================================================================

/**
 * Content (Contenu Pédagogique)
 * Represents educational content with versioning support
 */
export interface IContent {
  _id: Types.ObjectId;
  subject: Types.ObjectId | ISubject; // Reference to Subject or populated
  type: ContentType;
  title: string;
  versions: IContentVersion[];
  currentVersion?: number; // Index of published/comparing version
  notionPageId?: string; // Notion page ID after publish
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input type for creating new Content
 */
export interface ICreateContent {
  subject: Types.ObjectId | string;
  type: ContentType;
  title: string;
  prompt: string;
  aiModel: AIModel;
}

/**
 * Input type for updating Content
 */
export interface IUpdateContent {
  subject?: Types.ObjectId | string;
  type?: ContentType;
  title?: string;
  currentVersion?: number;
  notionPageId?: string;
}

// ============================================================================
// CONTENT TEMPLATE (Future Epic - Phase 2)
// ============================================================================

/**
 * Content Template
 * Reusable prompt templates for generating content
 */
export interface IContentTemplate {
  _id: Types.ObjectId;
  name: string;
  type: ContentType;
  level: EducationLevel;
  promptTemplate: string; // Template with {{variables}}
  variables: string[]; // List of required variables
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input type for creating a Content Template
 */
export interface ICreateContentTemplate {
  name: string;
  type: ContentType;
  level: EducationLevel;
  promptTemplate: string;
  variables: string[];
  description?: string;
}

// ============================================================================
// QUERY FILTERS
// ============================================================================

/**
 * Subject query filters
 */
export interface ISubjectFilters {
  level?: EducationLevel;
  name?: string | RegExp;
}

/**
 * Content query filters
 */
export interface IContentFilters {
  subject?: Types.ObjectId | string;
  type?: ContentType;
  status?: ContentStatus;
  aiModel?: AIModel;
  title?: string | RegExp;
}

// ============================================================================
// PAGINATION
// ============================================================================

/**
 * Pagination options
 */
export interface IPaginationOptions {
  page?: number; // Default: 1
  limit?: number; // Default: 20
  sortBy?: string; // Default: 'createdAt'
  sortOrder?: 'asc' | 'desc'; // Default: 'desc'
}

/**
 * Paginated result
 */
export interface IPaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
