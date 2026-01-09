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

interface ControlCreationFormProps {
  subject: ISubject;
  onSubmit?: () => void;
}

/**
 * Control Creation Form with Multi-Course Selection
 * Allows creating Control content that references multiple courses as context
 */
export function ControlCreationForm({ subject, onSubmit }: ControlCreationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    linkedCourseIds: [] as string[],
    duration: 120, // Default 2 hours
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
    value: string | number | string[]
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

  const handleCourseToggle = (courseId: string) => {
    const currentIds = formData.linkedCourseIds;
    const newIds = currentIds.includes(courseId)
      ? currentIds.filter(id => id !== courseId)
      : [...currentIds, courseId];
    
    handleInputChange('linkedCourseIds', newIds);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Le titre doit contenir au moins 5 caractères';
    }

    if (formData.linkedCourseIds.length === 0) {
      newErrors.linkedCourseIds = 'Veuillez sélectionner au moins un cours de référence';
    } else if (formData.linkedCourseIds.length > 5) {
      newErrors.linkedCourseIds = 'Maximum 5 cours peuvent être référencés';
    }

    if (formData.duration < 15) {
      newErrors.duration = 'La durée minimale est de 15 minutes';
    } else if (formData.duration > 600) {
      newErrors.duration = 'La durée maximale est de 10 heures (600 minutes)';
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
      const response = await fetch('/api/contents/control/generate', {
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
        throw new Error(errorData.message || 'Erreur lors de la génération du contrôle');
      }

      const responseData = await response.json();
      const newContentId = responseData.data._id;

      console.log('Control created successfully:', {
        contentId: newContentId,
        title: formData.title,
        linkedCourseIds: formData.linkedCourseIds,
        duration: formData.duration,
        aiModel: formData.aiModel,
      });

      onSubmit?.();
      router.push(`/contents/${newContentId}/edit`);
    } catch (error) {
      console.error('Control creation failed:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Erreur lors de la génération',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCourses = courseOptions.filter(course => 
    formData.linkedCourseIds.includes(course._id)
  );

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}min`;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Créer un contrôle pour {subject.name}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Génération d'évaluations basées sur plusieurs cours existants
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Titre du contrôle *
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
            placeholder="Ex: Contrôle Final - Semestre 1"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Durée du contrôle *
          </label>
          <div className="mt-1 flex items-center space-x-2">
            <input
              type="number"
              min="15"
              max="600"
              step="5"
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
              className={`block w-32 rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.duration
                  ? 'border-red-300 focus:border-red-300'
                  : 'border-gray-300 focus:border-blue-300'
              }`}
            />
            <span className="text-sm text-gray-600">
              minutes ({formatDuration(formData.duration)})
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Entre 15 minutes et 10 heures (600 minutes)
          </p>
          {errors.duration && (
            <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
          )}
        </div>

        {/* Course Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Cours de référence * ({formData.linkedCourseIds.length}/5)
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Sélectionnez les cours à couvrir dans ce contrôle (maximum 5)
          </p>
          
          {loadingCourses ? (
            <div className="text-sm text-gray-500">Chargement des cours...</div>
          ) : courseOptions.length === 0 ? (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
              Aucun cours disponible. Veuillez d'abord créer des cours pour cette matière.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3 bg-gray-50">
              {courseOptions.map((course) => (
                <label key={course._id} className="flex items-start space-x-3 p-2 rounded hover:bg-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.linkedCourseIds.includes(course._id)}
                    onChange={() => handleCourseToggle(course._id)}
                    disabled={!formData.linkedCourseIds.includes(course._id) && formData.linkedCourseIds.length >= 5}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{course.title}</span>
                    <div className="text-xs text-gray-500">
                      {course.hasPublishedVersion ? (
                        <span className="text-green-600">Publié</span>
                      ) : (
                        <span className="text-gray-600">Brouillon</span>
                      )}
                      {course.activeVersion && ` • ${course.activeVersion.aiModel}`}
                    </div>
                    {course.activeVersion && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                        {course.activeVersion.contentPreview}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
          
          {errors.linkedCourseIds && (
            <p className="mt-1 text-sm text-red-600">{errors.linkedCourseIds}</p>
          )}
          
          {selectedCourses.length > 0 && (
            <div className="mt-3 p-3 bg-blue-50 rounded-md">
              <div className="text-sm font-medium text-blue-900">
                Cours sélectionnés ({selectedCourses.length}) :
              </div>
              <div className="mt-1 space-x-2">
                {selectedCourses.map((course) => (
                  <span
                    key={course._id}
                    className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                  >
                    {course.title}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {errors.courses && (
            <p className="mt-1 text-sm text-red-600">{errors.courses}</p>
          )}
        </div>

        {/* Chapter Title (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Chapitre/Période (optionnel)
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
            placeholder="Ex: Semestre 1, Trimestre 2, Chapitres 1-3"
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
              { value: 'gemini', label: 'Gemini 2.5 Pro', description: 'Recommandé pour les évaluations structurées' },
              { value: 'claude', label: 'Claude 3.5 Sonnet', description: 'Excellent pour les questions rédactionnelles' },
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
            placeholder="Ex: 70% QCM + 30% rédaction, inclure une question pratique, privilégier les applications concrètes..."
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
            <span>{isLoading ? 'Génération...' : 'Générer le contrôle'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}