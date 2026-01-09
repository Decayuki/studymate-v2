import { z } from 'zod';
import {
  CONTENT_TYPES,
  EDUCATION_LEVELS,
  AI_MODELS,
  CONTENT_STATUSES,
  UNIVERSITY_TYPES,
  ACADEMIC_SEMESTERS,
  SUBJECT_CATEGORIES,
} from '../constants';

/**
 * Zod Schemas for Database Models
 *
 * These schemas are used for:
 * - Runtime validation of user inputs
 * - Type inference for API routes
 * - Data sanitization before database operations
 */

// ============================================================================
// SUBJECT SCHEMAS
// ============================================================================

export const HigherEducationContextSchema = z.object({
  institution: z
    .string()
    .min(1, 'Institution name is required')
    .max(200, 'Institution name too long'),
  institutionType: z.enum(UNIVERSITY_TYPES, {
    errorMap: () => ({ message: 'Invalid institution type' }),
  }),
  degree: z
    .string()
    .min(1, 'Degree is required')
    .max(150, 'Degree name too long'),
  year: z
    .number()
    .int()
    .min(1, 'Year must be at least 1')
    .max(10, 'Year cannot exceed 10'),
  semester: z.enum(ACADEMIC_SEMESTERS).optional(),
  specialization: z.string().max(100, 'Specialization name too long').optional(),
});

export const CreateSubjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Subject name is required')
    .max(100, 'Subject name too long'),
  level: z.enum(EDUCATION_LEVELS, {
    errorMap: () => ({ message: 'Invalid education level' }),
  }),
  category: z.enum(SUBJECT_CATEGORIES, {
    errorMap: () => ({ message: 'Invalid subject category' }),
  }),
  description: z.string().max(500, 'Description too long').optional(),
  higherEducationContext: HigherEducationContextSchema.optional(),
  credits: z.number().int().min(0).max(30).optional(),
  volume: z.number().int().min(0).max(500).optional(),
  prerequisites: z.array(z.string().min(1)).default([]),
  syllabus: z.string().max(2000, 'Syllabus too long').optional(),
  learningObjectives: z.array(z.string().min(1)).default([]),
}).superRefine((data, ctx) => {
  // Require higher education context for 'superieur' level
  if (data.level === 'superieur' && !data.higherEducationContext) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Higher education context is required for superieur level',
      path: ['higherEducationContext'],
    });
  }
});

export const UpdateSubjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  level: z.enum(EDUCATION_LEVELS).optional(),
  category: z.enum(SUBJECT_CATEGORIES).optional(),
  description: z.string().max(500).optional(),
  higherEducationContext: HigherEducationContextSchema.optional(),
  credits: z.number().int().min(0).max(30).optional(),
  volume: z.number().int().min(0).max(500).optional(),
  prerequisites: z.array(z.string().min(1)).optional(),
  syllabus: z.string().max(2000).optional(),
  learningObjectives: z.array(z.string().min(1)).optional(),
});

export const SubjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, {
  message: 'Invalid Subject ID format',
});

// ============================================================================
// CONTENT VERSION SCHEMAS
// ============================================================================

export const AIGenerationMetadataSchema = z.object({
  tokensUsed: z.number().int().min(0),
  durationMs: z.number().int().min(0),
  model: z.enum(AI_MODELS),
  modelVersion: z.string(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(0).optional(),
  error: z.string().optional(),
});

export const ContentVersionSchema = z.object({
  versionNumber: z.number().int().min(1),
  status: z.enum(CONTENT_STATUSES),
  aiModel: z.enum(AI_MODELS),
  prompt: z.string().min(10, 'Prompt too short'),
  content: z.string().min(1, 'Content cannot be empty'),
  metadata: AIGenerationMetadataSchema,
  createdAt: z.date(),
  publishedAt: z.date().optional(),
  rejectedAt: z.date().optional(),
  rejectionReason: z.string().max(500).optional(),
});

export const CreateContentVersionSchema = z.object({
  aiModel: z.enum(AI_MODELS),
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  content: z.string().min(1, 'Content cannot be empty'),
  metadata: AIGenerationMetadataSchema,
});

// ============================================================================
// CONTENT SCHEMAS
// ============================================================================

export const CreateContentSchema = z.object({
  subject: z.string().regex(/^[0-9a-fA-F]{24}$/, {
    message: 'Invalid Subject ID format',
  }),
  type: z.enum(CONTENT_TYPES, {
    errorMap: () => ({ message: 'Invalid content type' }),
  }),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title too long'),
  prompt: z
    .string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(5000, 'Prompt too long'),
  aiModel: z.enum(AI_MODELS, {
    errorMap: () => ({ message: 'Invalid AI model' }),
  }),
});

export const UpdateContentSchema = z.object({
  subject: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  type: z.enum(CONTENT_TYPES).optional(),
  title: z.string().min(1).max(200).optional(),
  currentVersion: z.number().int().min(0).optional(),
  notionPageId: z.string().optional(),
});

export const ContentIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, {
  message: 'Invalid Content ID format',
});

// ============================================================================
// CONTENT TEMPLATE SCHEMAS (Future - Phase 2)
// ============================================================================

export const CreateContentTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(CONTENT_TYPES),
  level: z.enum(EDUCATION_LEVELS),
  promptTemplate: z.string().min(10).max(5000),
  variables: z.array(z.string()).min(0),
  description: z.string().max(500).optional(),
});

// ============================================================================
// QUERY & FILTER SCHEMAS
// ============================================================================

export const SubjectFiltersSchema = z.object({
  level: z.enum(EDUCATION_LEVELS).optional(),
  category: z.enum(SUBJECT_CATEGORIES).optional(),
  name: z.string().optional(),
  institution: z.string().optional(),
  institutionType: z.enum(UNIVERSITY_TYPES).optional(),
  degree: z.string().optional(),
  year: z.number().int().min(1).max(10).optional(),
  semester: z.enum(ACADEMIC_SEMESTERS).optional(),
});

export const ContentFiltersSchema = z.object({
  subject: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  type: z.enum(CONTENT_TYPES).optional(),
  status: z.enum(CONTENT_STATUSES).optional(),
  aiModel: z.enum(AI_MODELS).optional(),
  title: z.string().optional(),
});

export const PaginationOptionsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// AI GENERATION SCHEMAS
// ============================================================================

export const GenerateContentSchema = z.object({
  subject: z.string().regex(/^[0-9a-fA-F]{24}$/),
  type: z.enum(CONTENT_TYPES),
  title: z.string().min(1).max(200),
  prompt: z.string().min(10).max(5000),
  aiModel: z.enum(AI_MODELS),
  contextCourseId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(), // For TD/Control
});

export const CompareVersionsSchema = z.object({
  contentId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  versionNumbers: z.array(z.number().int().min(1)).min(2).max(2), // Compare exactly 2 versions
});

export const PublishVersionSchema = z.object({
  contentId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  versionNumber: z.number().int().min(1),
});

export const RejectVersionSchema = z.object({
  contentId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  versionNumber: z.number().int().min(1),
  reason: z.string().max(500).optional(),
});

// ============================================================================
// NOTION SCHEMAS
// ============================================================================

export const PublishToNotionSchema = z.object({
  contentId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  versionNumber: z.number().int().min(1).optional(), // Use currentVersion if not provided
});

// ============================================================================
// TYPE INFERENCE FROM SCHEMAS
// ============================================================================

// Export inferred types for use in API routes
export type CreateSubjectInput = z.infer<typeof CreateSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof UpdateSubjectSchema>;
export type CreateContentInput = z.infer<typeof CreateContentSchema>;
export type UpdateContentInput = z.infer<typeof UpdateContentSchema>;
export type GenerateContentInput = z.infer<typeof GenerateContentSchema>;
export type CompareVersionsInput = z.infer<typeof CompareVersionsSchema>;
export type PublishVersionInput = z.infer<typeof PublishVersionSchema>;
export type RejectVersionInput = z.infer<typeof RejectVersionSchema>;
export type PublishToNotionInput = z.infer<typeof PublishToNotionSchema>;
export type PaginationOptionsInput = z.infer<typeof PaginationOptionsSchema>;
export type SubjectFiltersInput = z.infer<typeof SubjectFiltersSchema>;
export type ContentFiltersInput = z.infer<typeof ContentFiltersSchema>;
