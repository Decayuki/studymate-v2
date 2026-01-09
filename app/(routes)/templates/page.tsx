'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ContentTemplateManager, type ContentTemplate } from '@/lib/content-templates';
import type { ContentType, EducationLevel, SubjectCategory } from '@studymate/shared';

/**
 * Templates Gallery Page
 * Browse and preview available content templates
 */
export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ContentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);

  const [filters, setFilters] = useState({
    type: 'all' as ContentType | 'all',
    level: 'all' as EducationLevel | 'all',
    category: 'all' as SubjectCategory | 'all',
    difficulty: 'all' as 'all' | 'beginner' | 'intermediate' | 'advanced',
    search: '',
  });

  useEffect(() => {
    const allTemplates = ContentTemplateManager.getAllTemplates();
    setTemplates(allTemplates);
    setFilteredTemplates(allTemplates);
  }, []);

  useEffect(() => {
    let filtered = [...templates];

    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    if (filters.level !== 'all') {
      filtered = filtered.filter(t => t.level === filters.level);
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(t => t.categories.includes(filters.category as SubjectCategory));
    }

    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(t => t.difficulty === filters.difficulty);
    }

    if (filters.search) {
      filtered = ContentTemplateManager.searchTemplates(filters.search);
    }

    setFilteredTemplates(filtered);
  }, [filters, templates]);

  const getTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'course': return '📚';
      case 'td': return '✏️';
      case 'control': return '📝';
      default: return '📄';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyStars = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '⭐';
      case 'intermediate': return '⭐⭐';
      case 'advanced': return '⭐⭐⭐';
      default: return '';
    }
  };

  const updateFilter = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (selectedTemplate) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
              >
                <span>←</span>
                <span>Retour aux templates</span>
              </button>

              <button
                onClick={() => {
                  // Redirect to subject creation with this template pre-selected
                  router.push(`/subjects/create?template=${selectedTemplate.id}`);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Utiliser ce template
              </button>
            </div>
          </div>
        </div>

        {/* Template Detail */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border p-8">
            {/* Template Header */}
            <div className="flex items-start space-x-4 mb-6">
              <div className="text-4xl">{getTypeIcon(selectedTemplate.type)}</div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedTemplate.name}
                </h1>
                <p className="text-gray-600 mb-4">{selectedTemplate.description}</p>

                <div className="flex items-center space-x-4 text-sm">
                  <span className={`px-3 py-1 rounded ${getDifficultyColor(selectedTemplate.difficulty)}`}>
                    {getDifficultyStars(selectedTemplate.difficulty)} {selectedTemplate.difficulty}
                  </span>
                  <span className="text-gray-600">
                    📅 ~{selectedTemplate.estimatedDuration} min
                  </span>
                  <span className="text-gray-600">
                    🎓 {selectedTemplate.level === 'lycee' ? 'Lycée' : 'Enseignement Supérieur'}
                  </span>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Catégories compatibles :</h3>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.categories.map(cat => (
                  <span key={cat} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Variables */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Variables de personnalisation :</h3>
              <div className="space-y-4">
                {selectedTemplate.variables.map(variable => (
                  <div key={variable.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        {variable.description}
                        {variable.required && <span className="text-red-500 ml-1">*</span>}
                      </h4>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {variable.type}
                      </span>
                    </div>
                    {variable.placeholder && (
                      <p className="text-sm text-gray-600 mb-2">
                        Exemple : {variable.placeholder}
                      </p>
                    )}
                    {variable.options && (
                      <div className="text-sm text-gray-600">
                        Options : {variable.options.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Examples */}
            {selectedTemplate.examples && selectedTemplate.examples.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Exemples d'utilisation :</h3>
                <div className="space-y-4">
                  {selectedTemplate.examples.map((example, index) => (
                    <div key={index} className="bg-gray-50 border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">{example.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{example.description}</p>
                      <details className="text-sm">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                          Voir les variables utilisées
                        </summary>
                        <div className="mt-2 space-y-1">
                          {Object.entries(example.variables).map(([key, value]) => (
                            <div key={key} className="flex">
                              <span className="font-medium w-32">{key}:</span>
                              <span className="text-gray-600">{value}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Tags :</h3>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Template Preview */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Aperçu du template :</h3>
              <div className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-auto max-h-96">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {selectedTemplate.promptTemplate}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Galerie de Templates
            </h1>
            <p className="text-gray-600 mb-4">
              Découvrez nos templates professionnels pour créer du contenu pédagogique de qualité
            </p>
            <div className="text-sm text-gray-500">
              {filteredTemplates.length} template(s) disponible(s)
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg border p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Filtres</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de contenu
              </label>
              <select
                value={filters.type}
                onChange={(e) => updateFilter('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Tous les types</option>
                <option value="course">📚 Cours</option>
                <option value="td">✏️ TD</option>
                <option value="control">📝 Contrôles</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau
              </label>
              <select
                value={filters.level}
                onChange={(e) => updateFilter('level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Tous les niveaux</option>
                <option value="lycee">🏫 Lycée</option>
                <option value="superieur">🎓 Supérieur</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulté
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => updateFilter('difficulty', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Toutes difficultés</option>
                <option value="beginner">⭐ Débutant</option>
                <option value="intermediate">⭐⭐ Intermédiaire</option>
                <option value="advanced">⭐⭐⭐ Avancé</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recherche
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                placeholder="Rechercher par nom, description ou tags..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg border hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="text-2xl">{getTypeIcon(template.type)}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs mb-4">
                    <span className={`px-2 py-1 rounded ${getDifficultyColor(template.difficulty)}`}>
                      {getDifficultyStars(template.difficulty)}
                    </span>
                    <span className="text-gray-500">
                      📅 ~{template.estimatedDuration} min
                    </span>
                    <span className="text-gray-500">
                      🎓 {template.level === 'lycee' ? 'Lycée' : 'Supérieur'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                      {template.tags.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{template.tags.length - 2}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-blue-600">
                      {template.variables.length} variables
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun template trouvé
            </h3>
            <p className="text-gray-600 mb-6">
              Essayez d'ajuster vos filtres pour voir plus de résultats.
            </p>
            <button
              onClick={() => setFilters({
                type: 'all',
                level: 'all',
                category: 'all',
                difficulty: 'all',
                search: '',
              })}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>
    </div>
  );
}