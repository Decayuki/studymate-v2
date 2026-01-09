'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ISubject, EducationLevel, SubjectCategory } from '@studymate/shared';

interface SubjectsPageState {
  subjects: ISubject[];
  loading: boolean;
  error: string | null;
  filters: {
    level: EducationLevel | 'all';
    category: SubjectCategory | 'all';
    search: string;
    institution: string;
  };
}

/**
 * Enhanced Subjects Management Page
 * Advanced subject listing with filtering for higher education contexts
 */
export default function SubjectsPage() {
  const router = useRouter();
  const [state, setState] = useState<SubjectsPageState>({
    subjects: [],
    loading: true,
    error: null,
    filters: {
      level: 'all',
      category: 'all',
      search: '',
      institution: '',
    },
  });

  const SUBJECT_CATEGORIES = [
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

  // Load subjects with current filters
  useEffect(() => {
    loadSubjects();
  }, [state.filters]);

  const loadSubjects = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const queryParams = new URLSearchParams();
      
      if (state.filters.level !== 'all') queryParams.set('level', state.filters.level);
      if (state.filters.category !== 'all') queryParams.set('category', state.filters.category);
      if (state.filters.search) queryParams.set('search', state.filters.search);
      if (state.filters.institution) queryParams.set('institution', state.filters.institution);

      const response = await fetch(`/api/subjects?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Échec du chargement des matières');
      }

      const data = await response.json();
      const subjects = Array.isArray(data.data) ? data.data : [];
      setState(prev => ({
        ...prev,
        subjects: subjects,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        loading: false,
      }));
    }
  };

  const updateFilter = <K extends keyof SubjectsPageState['filters']>(
    key: K, 
    value: SubjectsPageState['filters'][K]
  ) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
    }));
  };

  const clearFilters = () => {
    setState(prev => ({
      ...prev,
      filters: {
        level: 'all',
        category: 'all',
        search: '',
        institution: '',
      },
    }));
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = SUBJECT_CATEGORIES.find(c => c.value === category);
    return categoryData?.icon || '📋';
  };

  const getCategoryLabel = (category: string) => {
    const categoryData = SUBJECT_CATEGORIES.find(c => c.value === category);
    return categoryData?.label || category;
  };

  const getInstitutionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'university': 'Université',
      'grande-ecole': 'Grande École',
      'iut': 'IUT',
      'bts': 'BTS',
      'prepa': 'Classe Prépa',
      'other': 'Autre',
    };
    return types[type] || type;
  };

  // Get unique institutions for filter
  const institutions = Array.from(
    new Set(
      Array.isArray(state.subjects) 
        ? state.subjects
            .filter(s => s.higherEducationContext?.institution)
            .map(s => s.higherEducationContext!.institution)
        : []
    )
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des matières</h1>
              <p className="text-sm text-gray-600 mt-1">
                Organisez vos matières par niveau et établissement • {Array.isArray(state.subjects) ? state.subjects.length : 0} matière(s)
              </p>
            </div>
            
            <button
              onClick={() => router.push('/subjects/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <span>➕</span>
              Nouvelle matière
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Filtres</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Réinitialiser
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recherche
              </label>
              <input
                type="text"
                value={state.filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nom de matière..."
              />
            </div>

            {/* Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau
              </label>
              <select
                value={state.filters.level}
                onChange={(e) => updateFilter('level', e.target.value as EducationLevel | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous les niveaux</option>
                <option value="lycee">🏫 Lycée</option>
                <option value="superieur">🎓 Enseignement Supérieur</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie
              </label>
              <select
                value={state.filters.category}
                onChange={(e) => updateFilter('category', e.target.value as SubjectCategory | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Toutes les catégories</option>
                {SUBJECT_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Institution (for higher education) */}
            {institutions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Établissement
                </label>
                <select
                  value={state.filters.institution}
                  onChange={(e) => updateFilter('institution', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tous les établissements</option>
                  {institutions.map((institution) => (
                    <option key={institution} value={institution}>
                      {institution}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {state.loading && (
          <div className="bg-white rounded-lg border p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        )}

        {/* Error State */}
        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-800 font-medium">Erreur de chargement</div>
            <div className="text-red-600 text-sm mt-1">{state.error}</div>
            <button
              onClick={loadSubjects}
              className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Empty State */}
        {!state.loading && !state.error && (!Array.isArray(state.subjects) || state.subjects.length === 0) && (
          <div className="bg-white rounded-lg border p-12 text-center">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune matière trouvée</h3>
            <p className="text-gray-600 mb-6">
              Commencez par créer votre première matière pour organiser vos contenus.
            </p>
            <button
              onClick={() => router.push('/subjects/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Créer une matière
            </button>
          </div>
        )}

        {/* Subjects Grid */}
        {!state.loading && !state.error && Array.isArray(state.subjects) && state.subjects.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {state.subjects.map((subject) => (
              <div key={subject._id.toString()} className="bg-white rounded-lg border hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getCategoryIcon(subject.category)}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                          {subject.name}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded ${
                            subject.level === 'lycee' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {subject.level === 'lycee' ? '🏫 Lycée' : '🎓 Supérieur'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {getCategoryLabel(subject.category)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {subject.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {subject.description}
                    </p>
                  )}

                  {/* Higher Education Context */}
                  {subject.higherEducationContext && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <div className="text-xs font-medium text-blue-900 mb-1">
                        {subject.higherEducationContext.institution}
                      </div>
                      <div className="text-xs text-blue-700">
                        {subject.higherEducationContext.degree} - Année {subject.higherEducationContext.year}
                        {subject.higherEducationContext.semester && ` (${subject.higherEducationContext.semester})`}
                      </div>
                      {subject.higherEducationContext.specialization && (
                        <div className="text-xs text-blue-600 mt-1">
                          Spécialisation: {subject.higherEducationContext.specialization}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Academic Details */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex space-x-4">
                      {subject.credits && (
                        <span>{subject.credits} ECTS</span>
                      )}
                      {subject.volume && (
                        <span>{subject.volume}h</span>
                      )}
                    </div>
                    <span>{new Date(subject.updatedAt).toLocaleDateString('fr-FR')}</span>
                  </div>

                  {/* Prerequisites */}
                  {subject.prerequisites && subject.prerequisites.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-gray-700 mb-1">Prérequis:</div>
                      <div className="flex flex-wrap gap-1">
                        {subject.prerequisites.slice(0, 2).map((prereq, index) => (
                          <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {prereq}
                          </span>
                        ))}
                        {subject.prerequisites.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{subject.prerequisites.length - 2} autres
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/subjects/${subject._id}/contents`)}
                      className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      Voir contenus
                    </button>
                    <button
                      onClick={() => router.push(`/subjects/${subject._id}/contents/create`)}
                      className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Créer contenu
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}