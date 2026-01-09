'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ISubject, AIModel } from '@studymate/shared';

interface CourseOption {
  _id: string;
  title: string;
  hasPublishedVersion: boolean;
  activeVersion?: {
    versionNumber: number;
    status: string;
    aiModel: string;
    contentPreview: string;
  };
}

interface TDCreationFormProps {
  subject: ISubject;
  onSubmit?: () => void;
}

/**
 * TD Creation Form with Course Selection
 * Allows creating TD content that references course content as context
 */
export function TDCreationForm({ subject, onSubmit }: TDCreationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    linkedCourseId: '',
    aiModel: 'gemini' as AIModel,
    chapterTitle: '',
    constraints: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load available courses for this subject
  useEffect(() => {
    async function loadCourses() {
      try {
        setLoadingCourses(true);
        const response = await fetch(`/api/subjects/${subject._id}/courses?published=false`);
        
        if (!response.ok) {
          throw new Error('Failed to load courses');
        }

        const data = await response.json();
        setCourseOptions(data.data || []);
      } catch (error) {
        console.error('Error loading courses:', error);
        setErrors({ courses: 'Erreur lors du chargement des cours' });
      } finally {
        setLoadingCourses(false);
      }
    }

    loadCourses();
  }, [subject._id]);

  const handleInputChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Le titre doit contenir au moins 5 caractères';
    }

    if (!formData.linkedCourseId) {
      newErrors.linkedCourseId = 'Veuillez sélectionner un cours de référence';
    }

    if (formData.constraints && formData.constraints.length > 1000) {
      newErrors.constraints = 'Les contraintes ne peuvent pas dépasser 1000 caractères';
    }

    if (formData.chapterTitle && formData.chapterTitle.length > 200) {
      newErrors.chapterTitle = 'Le titre du chapitre ne peut pas dépasser 200 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/contents/td/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subjectId: subject._id,
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la génération du TD');
      }

      const responseData = await response.json();
      const newContentId = responseData.data._id;

      console.log('TD created successfully:', {
        contentId: newContentId,
        title: formData.title,
        linkedCourseId: formData.linkedCourseId,
        aiModel: formData.aiModel,
      });

      onSubmit?.();
      router.push(`/contents/${newContentId}/edit`);
    } catch (error) {
      console.error('TD creation failed:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Erreur lors de la génération',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCourse = courseOptions.find(course => course._id === formData.linkedCourseId);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Créer un TD pour {subject.name}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Génération de Travaux Dirigés basés sur un cours existant
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Titre du TD *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.title
                ? 'border-red-300 focus:border-red-300'
                : 'border-gray-300 focus:border-blue-300'
            }`}
            placeholder="Ex: TD1 - Applications des équations différentielles"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Course Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Cours de référence *
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Le contenu de ce cours sera utilisé comme contexte pour générer le TD
          </p>
          
          {loadingCourses ? (
            <div className="text-sm text-gray-500">Chargement des cours...</div>
          ) : courseOptions.length === 0 ? (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
              Aucun cours disponible. Veuillez d'abord créer un cours pour cette matière.
            </div>
          ) : (
            <select
              value={formData.linkedCourseId}
              onChange={(e) => handleInputChange('linkedCourseId', e.target.value)}
              className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.linkedCourseId
                  ? 'border-red-300 focus:border-red-300'
                  : 'border-gray-300 focus:border-blue-300'
              }`}
            >
              <option value="">Sélectionnez un cours...</option>
              {courseOptions.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title} 
                  {course.hasPublishedVersion ? ' (Publié)' : ' (Brouillon)'}
                  {course.activeVersion && ` - ${course.activeVersion.aiModel}`}
                </option>
              ))}
            </select>
          )}
          
          {errors.linkedCourseId && (
            <p className="mt-1 text-sm text-red-600">{errors.linkedCourseId}</p>
          )}
          
          {selectedCourse && (
            <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
              <div className="font-medium text-gray-900">{selectedCourse.title}</div>
              {selectedCourse.activeVersion && (
                <div className="text-gray-600 mt-1">
                  <span className="font-medium">Aperçu:</span> {selectedCourse.activeVersion.contentPreview}
                </div>
              )}
            </div>
          )}
          
          {errors.courses && (
            <p className="mt-1 text-sm text-red-600">{errors.courses}</p>
          )}
        </div>

        {/* Chapter Title (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Chapitre (optionnel)
          </label>
          <input
            type="text"
            value={formData.chapterTitle}
            onChange={(e) => handleInputChange('chapterTitle', e.target.value)}
            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.chapterTitle
                ? 'border-red-300 focus:border-red-300'
                : 'border-gray-300 focus:border-blue-300'
            }`}
            placeholder="Ex: Chapitre 3 - Applications pratiques"
            maxLength={200}
          />
          {errors.chapterTitle && (
            <p className="mt-1 text-sm text-red-600">{errors.chapterTitle}</p>
          )}
        </div>

        {/* AI Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Modèle d'IA
          </label>
          <div className="mt-2 space-y-2">
            {[
              { value: 'gemini', label: 'Gemini 2.5 Pro', description: 'Excellent pour les mathématiques et sciences' },
              { value: 'claude', label: 'Claude 3.5 Sonnet', description: 'Très bon pour les matières littéraires' },
            ].map((option) => (
              <label key={option.value} className="flex items-start space-x-3">
                <input
                  type="radio"
                  value={option.value}
                  checked={formData.aiModel === option.value}
                  onChange={(e) => handleInputChange('aiModel', e.target.value as AIModel)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{option.label}</span>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Constraints (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Contraintes spécifiques (optionnel)
          </label>
          <textarea
            value={formData.constraints}
            onChange={(e) => handleInputChange('constraints', e.target.value)}
            rows={3}
            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.constraints
                ? 'border-red-300 focus:border-red-300'
                : 'border-gray-300 focus:border-blue-300'
            }`}
            placeholder="Ex: Inclure des exercices de niveaux progressifs, privilégier les exemples concrets..."
            maxLength={1000}
          />
          <div className="mt-1 text-xs text-gray-500">
            {formData.constraints.length}/1000 caractères
          </div>
          {errors.constraints && (
            <p className="mt-1 text-sm text-red-600">{errors.constraints}</p>
          )}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {errors.submit}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading || courseOptions.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            <span>{isLoading ? 'Génération...' : 'Générer le TD'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}