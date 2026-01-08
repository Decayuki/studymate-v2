// Application constants

export const CONTENT_TYPES = ['course', 'td', 'control'] as const;
export const EDUCATION_LEVELS = ['lycee', 'superieur'] as const;
export const AI_MODELS = ['gemini', 'claude'] as const;
export const CONTENT_STATUSES = ['draft', 'comparing', 'published', 'rejected'] as const;
export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const;

export const MAX_VERSIONS_PER_CONTENT = 20;
export const AUTO_SAVE_DEBOUNCE_MS = 2000;
export const AI_GENERATION_TIMEOUT_MS = 50000;
export const NOTION_RATE_LIMIT_PER_SECOND = 3;
