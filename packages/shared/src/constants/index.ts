// Application constants

export const CONTENT_TYPES = ['course', 'td', 'control'] as const;
export const EDUCATION_LEVELS = ['lycee', 'superieur'] as const;
export const AI_MODELS = ['gemini', 'claude'] as const;
export const CONTENT_STATUSES = ['draft', 'comparing', 'published', 'rejected'] as const;
export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const;

// Higher education constants
export const UNIVERSITY_TYPES = ['university', 'grande-ecole', 'iut', 'bts', 'prepa', 'other'] as const;
export const ACADEMIC_SEMESTERS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'] as const;
export const SUBJECT_CATEGORIES = [
  'mathematics', 'physics', 'chemistry', 'biology', 'computer-science',
  'engineering', 'literature', 'history', 'geography', 'philosophy',
  'economics', 'business', 'law', 'medicine', 'psychology', 'sociology',
  'languages', 'arts', 'other'
] as const;

export const MAX_VERSIONS_PER_CONTENT = 20;
export const AUTO_SAVE_DEBOUNCE_MS = 2000;
export const AI_GENERATION_TIMEOUT_MS = 50000;
export const NOTION_RATE_LIMIT_PER_SECOND = 3;
