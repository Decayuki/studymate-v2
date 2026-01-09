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

import type { AIModel } from './ai';

export type ContentType = 'course' | 'td' | 'control';
export type EducationLevel = 'lycee' | 'superieur';
// Remove AIModel definition
export type ContentStatus = 'draft' | 'comparing' | 'published' | 'rejected';

// Higher education specific types
export type UniversityType = 'university' | 'grande-ecole' | 'iut' | 'bts' | 'prepa' | 'other';
export type AcademicSemester = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8' | 'S9' | 'S10';
export type SubjectCategory =
  | 'mathematics'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'computer-science'
  | 'engineering'
  | 'literature'
  | 'history'
  | 'geography'
  | 'philosophy'
  | 'economics'
  | 'business'
  | 'law'
  | 'medicine'
  | 'psychology'
  | 'sociology'
  | 'languages'
  | 'arts'
  | 'other';

// ============================================================================
// SUBJECT
// ============================================================================

/**
 * Higher Education Context
 * Additional information for Enseignement Supérieur subjects
 */
export interface IHigherEducationContext {
  institution: string; // University/School name
  institutionType: UniversityType;
  degree: string; // e.g., "Licence Informatique", "Master MIAGE"
  year: number; // 1, 2, 3 for Licence; 1, 2 for Master
  semester?: AcademicSemester;
  specialization?: string; // e.g., "Data Science", "Cybersécurité"
}

/**
 * Subject (Matière)
 * Represents an academic subject (e.g., "Mathématiques", "Histoire")
 */
export interface ISubject {
  _id: Types.ObjectId;
  name: string;
  level: EducationLevel;
  category: SubjectCategory;
  description?: string;

  // Higher education specific fields
  higherEducationContext?: IHigherEducationContext;

  // Academic organization
  credits?: number; // ECTS credits for higher education
  volume?: number; // Total course hours
  prerequisites?: string[]; // Prerequisites as strings

  // Content organization
  syllabus?: string; // Course syllabus/program
  learningObjectives?: string[]; // Learning objectives

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input type for creating a new Subject
 */
export interface ICreateSubject {
  name: string;
  level: EducationLevel;
  category: SubjectCategory;
  description?: string;
  higherEducationContext?: IHigherEducationContext;
  credits?: number;
  volume?: number;
  prerequisites?: string[];
  syllabus?: string;
  learningObjectives?: string[];
}

/**
 * Input type for updating a Subject
 */
export interface IUpdateSubject {
  name?: string;
  level?: EducationLevel;
  category?: SubjectCategory;
  description?: string;
  higherEducationContext?: IHigherEducationContext;
  credits?: number;
  volume?: number;
  prerequisites?: string[];
  syllabus?: string;
  learningObjectives?: string[];
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
// CONTENT SPECIFICATIONS (Type-specific data)
// ============================================================================

/**
 * Base Content Specifications
 */
export interface IBaseContentSpecifications {
  chapterTitle?: string; // For organizing content by chapters
  constraints?: string; // Additional constraints/requirements
}

/**
 * Course-specific specifications
 */
export interface ICourseSpecifications extends IBaseContentSpecifications {
  // No additional fields for now
}

/**
 * TD-specific specifications  
 */
export interface ITDSpecifications extends IBaseContentSpecifications {
  linkedCourseId?: Types.ObjectId | string; // Reference to course content
  contextUsed?: string; // Snapshot of course content used as context
}

/**
 * Control-specific specifications
 */
export interface IControlSpecifications extends IBaseContentSpecifications {
  linkedCourseIds?: (Types.ObjectId | string)[]; // Can reference multiple courses
  duration?: number; // Duration in minutes
}

/**
 * Union type for all specifications
 */
export type IContentSpecifications = ICourseSpecifications | ITDSpecifications | IControlSpecifications;

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
  specifications?: IContentSpecifications; // Type-specific data
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
  category?: SubjectCategory;
  name?: string | RegExp;
  institution?: string;
  institutionType?: UniversityType;
  degree?: string;
  year?: number;
  semester?: AcademicSemester;
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
