import mongoose, { Schema, Model } from 'mongoose';
import type { ISubject, IHigherEducationContext } from '@studymate/shared';
import { EDUCATION_LEVELS, UNIVERSITY_TYPES, ACADEMIC_SEMESTERS, SUBJECT_CATEGORIES } from '@studymate/shared';

/**
 * Higher Education Context Schema
 */
const HigherEducationContextSchema = new Schema<IHigherEducationContext>(
  {
    institution: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true,
      maxlength: [200, 'Institution name too long'],
    },
    institutionType: {
      type: String,
      required: [true, 'Institution type is required'],
      enum: {
        values: UNIVERSITY_TYPES,
        message: 'Invalid institution type: {VALUE}',
      },
    },
    degree: {
      type: String,
      required: [true, 'Degree is required'],
      trim: true,
      maxlength: [150, 'Degree name too long'],
    },
    year: {
      type: Number,
      required: [true, 'Academic year is required'],
      min: [1, 'Year must be at least 1'],
      max: [10, 'Year cannot exceed 10'],
    },
    semester: {
      type: String,
      enum: {
        values: ACADEMIC_SEMESTERS,
        message: 'Invalid semester: {VALUE}',
      },
    },
    specialization: {
      type: String,
      trim: true,
      maxlength: [100, 'Specialization name too long'],
    },
  },
  {
    _id: false, // Don't create separate _id for subdocument
  }
);

/**
 * Subject Mongoose Schema
 *
 * Represents an academic subject with enhanced support for higher education
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
    category: {
      type: String,
      required: [true, 'Subject category is required'],
      enum: {
        values: SUBJECT_CATEGORIES,
        message: 'Invalid subject category: {VALUE}',
      },
      index: true, // Index for filtering by category
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description too long'],
    },
    
    // Higher education specific fields
    higherEducationContext: {
      type: HigherEducationContextSchema,
      required: function(this: ISubject) {
        return this.level === 'superieur';
      },
    },
    
    // Academic organization
    credits: {
      type: Number,
      min: [0, 'Credits cannot be negative'],
      max: [30, 'Credits cannot exceed 30 per subject'],
    },
    volume: {
      type: Number,
      min: [0, 'Volume cannot be negative'],
      max: [500, 'Volume cannot exceed 500 hours'],
    },
    prerequisites: {
      type: [String],
      default: [],
      validate: {
        validator: function(prerequisites: string[]) {
          return prerequisites.every(prereq => prereq.trim().length > 0);
        },
        message: 'Prerequisites cannot be empty strings',
      },
    },
    
    // Content organization
    syllabus: {
      type: String,
      trim: true,
      maxlength: [2000, 'Syllabus too long'],
    },
    learningObjectives: {
      type: [String],
      default: [],
      validate: {
        validator: function(objectives: string[]) {
          return objectives.every(objective => objective.trim().length > 0);
        },
        message: 'Learning objectives cannot be empty strings',
      },
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

// Compound index for unique subject per level and institution
SubjectSchema.index({ name: 1, level: 1, 'higherEducationContext.institution': 1 }, { unique: true });

// Text index for search functionality
SubjectSchema.index({ name: 'text', description: 'text', syllabus: 'text' });

// Higher education specific indexes
SubjectSchema.index({ 'higherEducationContext.institution': 1 });
SubjectSchema.index({ 'higherEducationContext.institutionType': 1 });
SubjectSchema.index({ 'higherEducationContext.degree': 1 });
SubjectSchema.index({ 'higherEducationContext.year': 1 });
SubjectSchema.index({ category: 1, level: 1 });

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
 * Find subjects by category
 */
SubjectSchema.statics.findByCategory = function (
  category: string
): Promise<ISubject[]> {
  return this.find({ category }).sort({ name: 1 }).exec();
};

/**
 * Find subjects by institution
 */
SubjectSchema.statics.findByInstitution = function (
  institution: string
): Promise<ISubject[]> {
  return this.find({ 'higherEducationContext.institution': institution })
    .sort({ name: 1 })
    .exec();
};

/**
 * Find subjects by degree and year
 */
SubjectSchema.statics.findByDegreeAndYear = function (
  degree: string,
  year: number
): Promise<ISubject[]> {
  return this.find({
    'higherEducationContext.degree': degree,
    'higherEducationContext.year': year,
  })
    .sort({ name: 1 })
    .exec();
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
  findByCategory(category: string): Promise<ISubject[]>;
  findByInstitution(institution: string): Promise<ISubject[]>;
  findByDegreeAndYear(degree: string, year: number): Promise<ISubject[]>;
  searchByName(searchTerm: string): Promise<ISubject[]>;
}

// Prevent model recompilation in development (Next.js hot reload)
const Subject: ISubjectModel =
  (mongoose.models.Subject as ISubjectModel) ||
  mongoose.model<ISubject, ISubjectModel>('Subject', SubjectSchema);

export default Subject;
