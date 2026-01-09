'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  ICreateSubject,
  IUpdateSubject,
  EducationLevel,
  SubjectCategory,
  UniversityType,
  AcademicSemester
} from '@studymate/shared';

interface EnhancedSubjectFormProps {
  initialData?: Partial<ICreateSubject>;
  mode: 'create' | 'edit';
  onSubmit?: (data: ICreateSubject | IUpdateSubject) => Promise<void>;
}

const SUBJECT_CATEGORIES: { value: SubjectCategory; label: string; icon: string }[] = [
  { value: 'mathematics', label: 'Mathématiques', icon: '🔢' },
  { value: 'physics', label: 'Physique', icon: '⚡' },
  { value: 'chemistry', label: 'Chimie', icon: '🧪' },
  { value: 'biology', label: 'Biologie', icon: '🧬' },
  { value: 'computer-science', label: 'Informatique', icon: '💻' },
  { value: 'engineering', label: 'Ingénierie', icon: '⚙️' },
  { value: 'literature', label: 'Littérature', icon: '📚' },
  { value: 'history', label: 'Histoire', icon: '🏛️' },
  { value: 'geography', label: 'Géographie', icon: '🌍' },
  { value: 'philosophy', label: 'Philosophie', icon: '🤔' },
  { value: 'economics', label: 'Économie', icon: '📈' },
  { value: 'business', label: 'Commerce', icon: '💼' },
  { value: 'law', label: 'Droit', icon: '⚖️' },
  { value: 'medicine', label: 'Médecine', icon: '🏥' },
  { value: 'psychology', label: 'Psychologie', icon: '🧠' },
  { value: 'sociology', label: 'Sociologie', icon: '👥' },
  { value: 'languages', label: 'Langues', icon: '🗣️' },
  { value: 'arts', label: 'Arts', icon: '🎨' },
  { value: 'other', label: 'Autre', icon: '📋' },
];

const UNIVERSITY_TYPES: { value: UniversityType; label: string }[] = [
  { value: 'university', label: 'Université' },
  { value: 'grande-ecole', label: 'Grande École' },
  { value: 'iut', label: 'IUT' },
  { value: 'bts', label: 'BTS' },
  { value: 'prepa', label: 'Classe Préparatoire' },
  { value: 'other', label: 'Autre' },
];

const ACADEMIC_SEMESTERS: { value: AcademicSemester; label: string }[] = [
  { value: 'S1', label: 'Semestre 1' },
  { value: 'S2', label: 'Semestre 2' },
  { value: 'S3', label: 'Semestre 3' },
  { value: 'S4', label: 'Semestre 4' },
  { value: 'S5', label: 'Semestre 5' },
  { value: 'S6', label: 'Semestre 6' },
  { value: 'S7', label: 'Semestre 7' },
  { value: 'S8', label: 'Semestre 8' },
  { value: 'S9', label: 'Semestre 9' },
  { value: 'S10', label: 'Semestre 10' },
];

/**
 * Enhanced Subject Form
 * Advanced form for creating/editing subjects with higher education support
 */
export function EnhancedSubjectForm({ initialData, mode, onSubmit }: EnhancedSubjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<ICreateSubject>({
    name: initialData?.name || '',
    level: initialData?.level || 'lycee',
    category: initialData?.category || 'other',
    description: initialData?.description || '',
    higherEducationContext: initialData?.higherEducationContext || undefined,
    credits: initialData?.credits || undefined,
    volume: initialData?.volume || undefined,
    prerequisites: initialData?.prerequisites || [],
    syllabus: initialData?.syllabus || '',
    learningObjectives: initialData?.learningObjectives || [],
  });

  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [newLearningObjective, setNewLearningObjective] = useState('');

  // Handle form field changes
  const updateField = <K extends keyof ICreateSubject>(field: K, value: ICreateSubject[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateHigherEducationContext = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      higherEducationContext: {
        ...prev.higherEducationContext,
        [field]: value,
      } as any,
    }));
  };

  // Array field helpers
  const addPrerequisite = () => {
    if (newPrerequisite.trim()) {
      updateField('prerequisites', [...(formData.prerequisites || []), newPrerequisite.trim()]);
      setNewPrerequisite('');
    }
  };

  const removePrerequisite = (index: number) => {
    updateField('prerequisites', (formData.prerequisites || []).filter((_, i) => i !== index));
  };

  const addLearningObjective = () => {
    if (newLearningObjective.trim()) {
      updateField('learningObjectives', [...(formData.learningObjectives || []), newLearningObjective.trim()]);
      setNewLearningObjective('');
    }
  };

  const removeLearningObjective = (index: number) => {
    updateField('learningObjectives', (formData.learningObjectives || []).filter((_, i) => i !== index));
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Clean data for lycee level
      const cleanedData = { ...formData };
      if (cleanedData.level === 'lycee') {
        cleanedData.higherEducationContext = undefined;
        cleanedData.credits = undefined;
      }

      if (onSubmit) {
        await onSubmit(cleanedData);
      } else {
        // Default submission to API
        const response = await fetch('/api/subjects', {
          method: mode === 'create' ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanedData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Échec de la sauvegarde');
        }

        router.push('/subjects');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800 font-medium">Erreur</div>
            <div className="text-red-600 text-sm mt-1">{error}</div>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Informations de base</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la matière *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ex: Algorithmique et Programmation"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau d'enseignement *
              </label>
              <select
                value={formData.level}
                onChange={(e) => updateField('level', e.target.value as EducationLevel)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="lycee">🏫 Lycée</option>
                <option value="superieur">🎓 Enseignement Supérieur</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie de matière *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {SUBJECT_CATEGORIES.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => updateField('category', category.value)}
                    className={`p-3 text-sm border rounded-lg text-left transition-colors ${formData.category === category.value
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <div className="text-lg mb-1">{category.icon}</div>
                    <div className="font-medium">{category.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Description de la matière, objectifs généraux..."
              />
            </div>
          </div>
        </div>

        {/* Higher Education Context */}
        {formData.level === 'superieur' && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Contexte Enseignement Supérieur</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Établissement *
                </label>
                <input
                  type="text"
                  value={formData.higherEducationContext?.institution || ''}
                  onChange={(e) => updateHigherEducationContext('institution', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ex: Université de Paris, EPITECH..."
                  required={formData.level === 'superieur'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'établissement *
                </label>
                <select
                  value={formData.higherEducationContext?.institutionType || ''}
                  onChange={(e) => updateHigherEducationContext('institutionType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={formData.level === 'superieur'}
                >
                  <option value="">Sélectionner un type</option>
                  {UNIVERSITY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diplôme/Formation *
                </label>
                <input
                  type="text"
                  value={formData.higherEducationContext?.degree || ''}
                  onChange={(e) => updateHigherEducationContext('degree', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ex: Licence Informatique, Master MIAGE..."
                  required={formData.level === 'superieur'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année *
                </label>
                <select
                  value={formData.higherEducationContext?.year || ''}
                  onChange={(e) => updateHigherEducationContext('year', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={formData.level === 'superieur'}
                >
                  <option value="">Sélectionner une année</option>
                  {Array.from({ length: 5 }, (_, i) => i + 1).map((year) => (
                    <option key={year} value={year}>
                      Année {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semestre
                </label>
                <select
                  value={formData.higherEducationContext?.semester || ''}
                  onChange={(e) => updateHigherEducationContext('semester', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner un semestre</option>
                  {ACADEMIC_SEMESTERS.map((semester) => (
                    <option key={semester.value} value={semester.value}>
                      {semester.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spécialisation
                </label>
                <input
                  type="text"
                  value={formData.higherEducationContext?.specialization || ''}
                  onChange={(e) => updateHigherEducationContext('specialization', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ex: Intelligence Artificielle, Cybersécurité..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Academic Details */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Détails académiques</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.level === 'superieur' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crédits ECTS
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={formData.credits || ''}
                  onChange={(e) => updateField('credits', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="6"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume horaire (heures)
              </label>
              <input
                type="number"
                min="0"
                max="500"
                value={formData.volume || ''}
                onChange={(e) => updateField('volume', parseInt(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="42"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prérequis
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPrerequisite}
                    onChange={(e) => setNewPrerequisite(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ajouter un prérequis..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPrerequisite())}
                  />
                  <button
                    type="button"
                    onClick={addPrerequisite}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Ajouter
                  </button>
                </div>
                {(formData.prerequisites || []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(formData.prerequisites || []).map((prereq, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-md text-sm"
                      >
                        {prereq}
                        <button
                          type="button"
                          onClick={() => removePrerequisite(index)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Contenu pédagogique</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Programme/Syllabus
              </label>
              <textarea
                value={formData.syllabus}
                onChange={(e) => updateField('syllabus', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Détaillez le programme de la matière, les chapitres, thématiques abordées..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objectifs d'apprentissage
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLearningObjective}
                    onChange={(e) => setNewLearningObjective(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ajouter un objectif d'apprentissage..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLearningObjective())}
                  />
                  <button
                    type="button"
                    onClick={addLearningObjective}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Ajouter
                  </button>
                </div>
                {(formData.learningObjectives || []).length > 0 && (
                  <div className="space-y-2">
                    {(formData.learningObjectives || []).map((objective, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md"
                      >
                        <span className="text-green-600">•</span>
                        <span className="flex-1 text-sm">{objective}</span>
                        <button
                          type="button"
                          onClick={() => removeLearningObjective(index)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {mode === 'create' ? 'Créer la matière' : 'Sauvegarder'}
          </button>
        </div>
      </form>
    </div>
  );
}