import mongoose, { Schema, Model } from 'mongoose';
import type { ISubject } from '@studymate/shared';
import { EDUCATION_LEVELS } from '@studymate/shared';

/**
 * Subject Mongoose Schema
 *
 * Represents an academic subject (e.g., "Mathématiques STMG 1A")
 * Used as a reference for organizing educational content.
 */

const SubjectSchema = new Schema<ISubject>(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      minlength: [1, 'Subject name cannot be empty'],
      maxlength: [100, 'Subject name too long'],
      index: true, // Index for search performance
    },
    level: {
      type: String,
      required: [true, 'Education level is required'],
      enum: {
        values: EDUCATION_LEVELS,
        message: 'Invalid education level: {VALUE}',
      },
      index: true, // Index for filtering by level
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description too long'],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    collection: 'subjects',
  }
);

// ============================================================================
// INDEXES
// ============================================================================

// Compound index for unique subject per level
SubjectSchema.index({ name: 1, level: 1 }, { unique: true });

// Text index for search functionality
SubjectSchema.index({ name: 'text', description: 'text' });

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Get formatted display name with level
 */
SubjectSchema.methods.getDisplayName = function (): string {
  const levelLabel = this.level === 'lycee' ? 'Lycée' : 'Supérieur';
  return `${this.name} (${levelLabel})`;
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Find subjects by level
 */
SubjectSchema.statics.findByLevel = function (
  level: 'lycee' | 'superieur'
): Promise<ISubject[]> {
  return this.find({ level }).sort({ name: 1 }).exec();
};

/**
 * Search subjects by name (case-insensitive)
 */
SubjectSchema.statics.searchByName = function (
  searchTerm: string
): Promise<ISubject[]> {
  return this.find({
    name: { $regex: searchTerm, $options: 'i' },
  })
    .sort({ name: 1 })
    .exec();
};

// ============================================================================
// MODEL & EXPORT
// ============================================================================

// Extend the Model interface with static methods
interface ISubjectModel extends Model<ISubject> {
  findByLevel(level: 'lycee' | 'superieur'): Promise<ISubject[]>;
  searchByName(searchTerm: string): Promise<ISubject[]>;
}

// Prevent model recompilation in development (Next.js hot reload)
const Subject: ISubjectModel =
  (mongoose.models.Subject as ISubjectModel) ||
  mongoose.model<ISubject, ISubjectModel>('Subject', SubjectSchema);

export default Subject;
