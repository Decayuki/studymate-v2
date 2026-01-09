import mongoose, { Schema, Model, Types } from 'mongoose';
import type {
  IContent,
  IContentVersion,
  IContentSpecifications,
  ICourseSpecifications,
  ITDSpecifications,
  IControlSpecifications
} from '@studymate/shared';
import {
  CONTENT_TYPES,
  AI_MODELS,
  CONTENT_STATUSES,
  MAX_VERSIONS_PER_CONTENT,
} from '@studymate/shared';

/**
 * Content Mongoose Schema
 *
 * Represents educational content with versioning support.
 * Each content can have multiple versions (drafts, published, comparing, rejected).
 */

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

/**
 * AI Generation Metadata Schema
 */
const AIGenerationMetadataSchema = new Schema(
  {
    tokensUsed: {
      type: Number,
      required: true,
      min: 0,
    },
    durationMs: {
      type: Number,
      required: true,
      min: 0,
    },
    model: {
      type: String,
      required: true,
      enum: AI_MODELS,
    },
    modelVersion: {
      type: String,
      required: true,
    },
    temperature: {
      type: Number,
      min: 0,
      max: 2,
    },
    maxTokens: {
      type: Number,
      min: 0,
    },
    error: String,
  },
  { _id: false }
);

/**
 * Content Version Schema
 */
const ContentVersionSchema = new Schema<IContentVersion>(
  {
    versionNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: CONTENT_STATUSES,
        message: 'Invalid status: {VALUE}',
      },
      default: 'draft',
    },
    aiModel: {
      type: String,
      required: true,
      enum: {
        values: AI_MODELS,
        message: 'Invalid AI model: {VALUE}',
      },
    },
    prompt: {
      type: String,
      required: true,
      minlength: [10, 'Prompt too short'],
    },
    content: {
      type: String,
      required: true,
      minlength: [1, 'Content cannot be empty'],
    },
    metadata: {
      type: AIGenerationMetadataSchema,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    publishedAt: Date,
    rejectedAt: Date,
    rejectionReason: {
      type: String,
      maxlength: 500,
    },
  },
  { _id: false }
);

// ============================================================================
// SPECIFICATIONS SCHEMAS
// ============================================================================

/**
 * Content Specifications Schema (type-specific data)
 */
const ContentSpecificationsSchema = new Schema(
  {
    // Base fields
    chapterTitle: {
      type: String,
      trim: true,
      maxlength: [200, 'Chapter title too long'],
    },
    constraints: {
      type: String,
      trim: true,
      maxlength: [1000, 'Constraints too long'],
    },

    // TD-specific fields
    linkedCourseId: {
      type: Schema.Types.ObjectId,
      ref: 'Content',
      index: true,
    },
    contextUsed: {
      type: String,
      maxlength: [100000, 'Context snapshot too large'],
    },

    // Control-specific fields
    linkedCourseIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Content',
    }],
    duration: {
      type: Number,
      min: [1, 'Duration must be positive'],
      max: [600, 'Duration too long (max 10 hours)'],
    },
  },
  { _id: false }
);

// ============================================================================
// MAIN SCHEMA
// ============================================================================

const ContentSchema = new Schema<IContent>(
  {
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Content type is required'],
      enum: {
        values: CONTENT_TYPES,
        message: 'Invalid content type: {VALUE}',
      },
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [200, 'Title too long'],
      index: true,
    },
    versions: {
      type: [ContentVersionSchema],
      default: [],
      validate: {
        validator: function (versions: IContentVersion[]) {
          return versions.length <= MAX_VERSIONS_PER_CONTENT;
        },
        message: `Maximum ${MAX_VERSIONS_PER_CONTENT} versions allowed per content`,
      },
    },
    currentVersion: {
      type: Number,
      min: 0,
    },
    notionPageId: {
      type: String,
      sparse: true,
      index: true,
    },
    specifications: {
      type: ContentSpecificationsSchema,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'contents',
  }
);

// ============================================================================
// INDEXES
// ============================================================================

// Compound indexes for common queries
ContentSchema.index({ subject: 1, type: 1 });
ContentSchema.index({ subject: 1, createdAt: -1 });
ContentSchema.index({ 'versions.status': 1 });
ContentSchema.index({ 'specifications.linkedCourseId': 1 });

// Text index for search
ContentSchema.index({ title: 'text', 'versions.content': 'text' });

// ============================================================================
// VIRTUALS
// ============================================================================

/**
 * Get the current published/comparing version
 */
ContentSchema.virtual('activeVersion').get(function () {
  if (
    this.currentVersion !== undefined &&
    this.versions[this.currentVersion]
  ) {
    return this.versions[this.currentVersion];
  }
  return null;
});

/**
 * Get all draft versions
 */
ContentSchema.virtual('draftVersions').get(function () {
  return this.versions.filter((v: IContentVersion) => v.status === 'draft');
});

/**
 * Get published version
 */
ContentSchema.virtual('publishedVersion').get(function () {
  return this.versions.find((v: IContentVersion) => v.status === 'published') || null;
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Add a new version to the content
 */
ContentSchema.methods.addVersion = function (
  versionData: Omit<IContentVersion, 'versionNumber' | 'createdAt'>
): IContentVersion {
  const versionNumber = this.versions.length + 1;

  if (versionNumber > MAX_VERSIONS_PER_CONTENT) {
    throw new Error(
      `Maximum ${MAX_VERSIONS_PER_CONTENT} versions reached. Please delete old versions first.`
    );
  }

  const newVersion: IContentVersion = {
    ...versionData,
    versionNumber,
    createdAt: new Date(),
  };

  this.versions.push(newVersion);
  return newVersion;
};

/**
 * Get version by number
 */
ContentSchema.methods.getVersion = function (
  versionNumber: number
): IContentVersion | null {
  return this.versions.find((v: IContentVersion) => v.versionNumber === versionNumber) || null;
};

/**
 * Publish a version
 */
ContentSchema.methods.publishVersion = function (
  versionNumber: number
): void {
  const versionIndex = this.versions.findIndex(
    (v: IContentVersion) => v.versionNumber === versionNumber
  );

  if (versionIndex === -1) {
    throw new Error(`Version ${versionNumber} not found`);
  }

  // Unpublish any previously published version
  this.versions.forEach((v: IContentVersion) => {
    if (v.status === 'published') {
      v.status = 'draft';
    }
  });

  // Publish the selected version
  this.versions[versionIndex].status = 'published';
  this.versions[versionIndex].publishedAt = new Date();
  this.currentVersion = versionIndex;
};

/**
 * Reject a version
 */
ContentSchema.methods.rejectVersion = function (
  versionNumber: number,
  reason?: string
): void {
  const versionIndex = this.versions.findIndex(
    (v: IContentVersion) => v.versionNumber === versionNumber
  );

  if (versionIndex === -1) {
    throw new Error(`Version ${versionNumber} not found`);
  }

  this.versions[versionIndex].status = 'rejected';
  this.versions[versionIndex].rejectedAt = new Date();
  if (reason) {
    this.versions[versionIndex].rejectionReason = reason;
  }
};

/**
 * Set version status to comparing
 */
ContentSchema.methods.setComparingStatus = function (
  versionNumber: number
): void {
  const versionIndex = this.versions.findIndex(
    (v: IContentVersion) => v.versionNumber === versionNumber
  );

  if (versionIndex === -1) {
    throw new Error(`Version ${versionNumber} not found`);
  }

  this.versions[versionIndex].status = 'comparing';
  this.currentVersion = versionIndex;
};

/**
 * Delete old versions (keep published + N most recent)
 */
ContentSchema.methods.pruneVersions = function (keepCount: number = 5): void {
  const publishedVersions = this.versions.filter(
    (v: IContentVersion) => v.status === 'published'
  );
  const otherVersions = this.versions
    .filter((v: IContentVersion) => v.status !== 'published')
    .sort((a: IContentVersion, b: IContentVersion) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, keepCount);

  this.versions = [...publishedVersions, ...otherVersions].sort(
    (a: IContentVersion, b: IContentVersion) => a.versionNumber - b.versionNumber
  );
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Find all content for a subject
 */
ContentSchema.statics.findBySubject = function (
  subjectId: Types.ObjectId | string
): Promise<IContent[]> {
  return this.find({ subject: subjectId })
    .sort({ createdAt: -1 })
    .populate('subject')
    .exec();
};

/**
 * Find content by type
 */
ContentSchema.statics.findByType = function (
  type: 'course' | 'td' | 'control'
): Promise<IContent[]> {
  return this.find({ type }).sort({ createdAt: -1 }).populate('subject').exec();
};

/**
 * Search content by title
 */
ContentSchema.statics.searchByTitle = function (
  searchTerm: string
): Promise<IContent[]> {
  return this.find({
    title: { $regex: searchTerm, $options: 'i' },
  })
    .sort({ createdAt: -1 })
    .populate('subject')
    .exec();
};

// ============================================================================
// MODEL & EXPORT
// ============================================================================

// Extend Model interface with static methods
interface IContentModel extends Model<IContent> {
  findBySubject(subjectId: Types.ObjectId | string): Promise<IContent[]>;
  findByType(type: 'course' | 'td' | 'control'): Promise<IContent[]>;
  searchByTitle(searchTerm: string): Promise<IContent[]>;
}

// Prevent model recompilation in development
const Content: IContentModel =
  (mongoose.models.Content as IContentModel) ||
  mongoose.model<IContent, IContentModel>('Content', ContentSchema);

export default Content;
