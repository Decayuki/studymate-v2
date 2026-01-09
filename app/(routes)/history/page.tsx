'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ISubject, ContentType, ContentStatus, AIModel, EducationLevel } from '@studymate/shared';

interface ContentItem {
  _id: string;
  title: string;
  type: ContentType;
  subject: ISubject;
  specifications?: any;
  createdAt: string;
  updatedAt: string;
  currentVersion?: number;
  notionPageId?: string;
  versionCounts: {
    total: number;
    draft: number;
    published: number;
    rejected: number;
    comparing: number;
  };
  modelsUsed: AIModel[];
  latestVersion?: {
    versionNumber: number;
    status: ContentStatus;
    aiModel: AIModel;
    createdAt: string;
  };
  publishedVersion?: {
    versionNumber: number;
    status: ContentStatus;
    aiModel: AIModel;
    publishedAt: string;
  };
  primaryStatus: ContentStatus;
}

interface Filters {
  level: EducationLevel;
  subjects: string[];
  types: ContentType[];
  statuses: ContentStatus[];
  models: AIModel[];
  dateFrom: string;
  dateTo: string;
  search: string;
  sortBy: 'createdAt' | 'updatedAt' | 'title' | 'subject';
  sortOrder: 'asc' | 'desc';
}

interface ApiResponse {
  contents: ContentItem[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters: any;
}

export const dynamic = 'force-dynamic';
/**
 * Content History Page
 * Complete view of all generated content with advanced filtering
 */
function HistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Initialize filters from URL params
  const [filters, setFilters] = useState<Filters>({
    level: (searchParams.get('level') as EducationLevel) || 'lycee',
    subjects: searchParams.get('subjects')?.split(',').filter(Boolean) || [],
    types: (searchParams.get('types')?.split(',').filter(Boolean) as ContentType[]) || [],
    statuses: (searchParams.get('statuses')?.split(',').filter(Boolean) as ContentStatus[]) || [],
    models: (searchParams.get('models')?.split(',').filter(Boolean) as AIModel[]) || [],
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
    search: searchParams.get('search') || '',
    sortBy: (searchParams.get('sortBy') as Filters['sortBy']) || 'updatedAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
  });

  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1')
  );

  // Bulk selection state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Load subjects for filter dropdown
  useEffect(() => {
    async function loadSubjects() {
      try {
        const response = await fetch('/api/subjects');
        if (!response.ok) throw new Error('Failed to load subjects');
        const data = await response.json();
        setSubjects(Array.isArray(data.data) ? data.data : []);
      } catch (error) {
        console.error('Error loading subjects:', error);
      }
    }
    loadSubjects();
  }, []);

  // Load content with current filters
  const loadContent = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      // Add non-empty filters to query
      if (filters.level) queryParams.set('level', filters.level);
      if (filters.subjects.length > 0) queryParams.set('subjects', filters.subjects.join(','));
      if (filters.types.length > 0) queryParams.set('types', filters.types.join(','));
      if (filters.statuses.length > 0) queryParams.set('statuses', filters.statuses.join(','));
      if (filters.models.length > 0) queryParams.set('models', filters.models.join(','));
      if (filters.dateFrom) queryParams.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.set('dateTo', filters.dateTo);
      if (filters.search) queryParams.set('search', filters.search);
      queryParams.set('sortBy', filters.sortBy);
      queryParams.set('sortOrder', filters.sortOrder);

      // Pagination
      const limit = 20;
      queryParams.set('limit', limit.toString());
      queryParams.set('offset', ((page - 1) * limit).toString());

      const response = await fetch(`/api/contents/all?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to load content');
      }

      const response_data = await response.json();
      const data: ApiResponse = response_data.data || { contents: [], pagination: { total: 0, offset: 0, limit: 20, page: 1, totalPages: 0, hasNext: false, hasPrevious: false }, filters: {} };
      setData(data);
      setCurrentPage(page);

      // Update URL with current filters
      const newUrl = `/history?${queryParams}&page=${page}`;
      window.history.replaceState({}, '', newUrl);

    } catch (error) {
      console.error('Error loading content:', error);
      setError(error instanceof Error ? error.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  // Load content when filters change
  useEffect(() => {
    loadContent(1);
  }, [filters]);

  // Update individual filter
  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Toggle array filter (for multi-select)
  const toggleArrayFilter = <K extends keyof Filters>(
    key: K,
    value: string,
    currentArray: string[]
  ) => {
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray as Filters[K]);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      level: 'lycee',
      subjects: [],
      types: [],
      statuses: [],
      models: [],
      dateFrom: '',
      dateTo: '',
      search: '',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
  };

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.subjects.length > 0) count++;
    if (filters.types.length > 0) count++;
    if (filters.statuses.length > 0) count++;
    if (filters.models.length > 0) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.search) count++;
    return count;
  }, [filters]);

  // Bulk operations
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectAllVisible = () => {
    if (!data || !Array.isArray(data.contents)) return;
    const allIds = data.contents.map(content => content._id);
    setSelectedItems(allIds);
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const performBulkOperation = async (
    action: 'delete' | 'update-status' | 'publish' | 'unpublish',
    params?: any
  ) => {
    if (selectedItems.length === 0) return;

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir ${action === 'delete' ? 'supprimer' : 'modifier'} ${selectedItems.length} élément(s) ?`
    );

    if (!confirmed) return;

    setBulkLoading(true);

    try {
      const response = await fetch('/api/contents/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          contentIds: selectedItems,
          params,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to perform bulk operation');
      }

      const result = await response.json();

      // Show results
      const { summary, errors } = result.data;
      let message = `Opération terminée: ${summary.successful} réussi(es), ${summary.failed} échec(s)`;

      if (errors.length > 0) {
        message += `\nErreurs: ${errors.map((e: any) => e.error).join(', ')}`;
      }

      alert(message);

      // Refresh data and clear selection
      clearSelection();
      loadContent(currentPage);

    } catch (error) {
      console.error('Bulk operation failed:', error);
      alert(`Erreur: ${error instanceof Error ? error.message : 'Opération échouée'}`);
    } finally {
      setBulkLoading(false);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: ContentStatus }) => {
    const colors: Record<ContentStatus, string> = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-green-100 text-green-800',
      comparing: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
    };

    const labels: Record<ContentStatus, string> = {
      draft: 'Brouillon',
      published: 'Publié',
      comparing: 'Comparaison',
      rejected: 'Rejeté',
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // Content type icon
  const getContentTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'course': return '📚';
      case 'td': return '✏️';
      case 'control': return '📝';
      default: return '📄';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Historique du contenu</h1>
              <p className="text-sm text-gray-600 mt-1">
                Gérez tout votre contenu généré • {data?.pagination.total || 0} éléments
              </p>
            </div>

            {/* Level switcher */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Niveau:</label>
              <select
                value={filters.level}
                onChange={(e) => updateFilter('level', e.target.value as EducationLevel)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="lycee">Lycée</option>
                <option value="superieur">Enseignement Supérieur</option>
              </select>
            </div>
          </div>

          {/* Search and filter controls */}
          <div className="mt-4 flex items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Rechercher par titre, matière ou contenu..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filter toggle */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {activeFilterCount > 0 && `${activeFilterCount} filtres actifs`}
              </span>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${showFilters || activeFilterCount > 0
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
              >
                Filtres {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Filter Panel */}
          {showFilters && (
            <div className="w-80 flex-shrink-0">
              <div className="bg-white rounded-lg border p-6 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Filtres</h3>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Tout effacer
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Subject filter */}
                  {Array.isArray(subjects) && subjects.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Matières
                      </label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {Array.isArray(subjects) ? subjects
                          .filter(s => s.level === filters.level)
                          .map(subject => (
                            <label key={subject._id.toString()} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={filters.subjects.includes(subject._id.toString())}
                                onChange={() => toggleArrayFilter('subjects', subject._id.toString(), filters.subjects)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">{subject.name}</span>
                            </label>
                          )) : []}
                      </div>
                    </div>
                  )}

                  {/* Type filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de contenu
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'course', label: 'Cours', icon: '📚' },
                        { value: 'td', label: 'TD', icon: '✏️' },
                        { value: 'control', label: 'Contrôles', icon: '📝' }
                      ].map(type => (
                        <label key={type.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.types.includes(type.value as ContentType)}
                            onChange={() => toggleArrayFilter('types', type.value, filters.types)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {type.icon} {type.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Status filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Statut
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'draft', label: 'Brouillon' },
                        { value: 'published', label: 'Publié' },
                        { value: 'comparing', label: 'Comparaison' },
                        { value: 'rejected', label: 'Rejeté' }
                      ].map(status => (
                        <label key={status.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.statuses.includes(status.value as ContentStatus)}
                            onChange={() => toggleArrayFilter('statuses', status.value, filters.statuses)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{status.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Model filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modèle IA
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'gemini', label: 'Gemini' },
                        { value: 'claude', label: 'Claude' }
                      ].map(model => (
                        <label key={model.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.models.includes(model.value as AIModel)}
                            onChange={() => toggleArrayFilter('models', model.value, filters.models)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{model.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Date range filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Période
                    </label>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => updateFilter('dateFrom', e.target.value)}
                        placeholder="Date de début"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => updateFilter('dateTo', e.target.value)}
                        placeholder="Date de fin"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content List */}
          <div className="flex-1">
            {/* Bulk actions bar */}
            {selectedItems.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedItems.length} élément(s) sélectionné(s)
                    </span>
                    <button
                      onClick={clearSelection}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Désélectionner tout
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => performBulkOperation('update-status', { status: 'rejected', reason: 'Bulk rejection' })}
                      disabled={bulkLoading}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Rejeter
                    </button>
                    <button
                      onClick={() => performBulkOperation('publish')}
                      disabled={bulkLoading}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Publier
                    </button>
                    <button
                      onClick={() => performBulkOperation('unpublish')}
                      disabled={bulkLoading}
                      className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                    >
                      Dépublier
                    </button>
                    <button
                      onClick={() => performBulkOperation('delete')}
                      disabled={bulkLoading}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sort controls */}
            <div className="bg-white rounded-lg border p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {data && Array.isArray(data.contents) && data.contents.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={data.contents.length > 0 && selectedItems.length === data.contents.length}
                        onChange={() => selectedItems.length === data.contents.length ? clearSelection() : selectAllVisible()}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="text-sm text-gray-700">
                        Sélectionner tout ({data.contents.length})
                      </label>
                    </div>
                  )}
                  <label className="text-sm font-medium text-gray-700">Trier par:</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => updateFilter('sortBy', e.target.value as Filters['sortBy'])}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  >
                    <option value="updatedAt">Date de modification</option>
                    <option value="createdAt">Date de création</option>
                    <option value="title">Titre</option>
                    <option value="subject">Matière</option>
                  </select>
                  <button
                    onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {filters.sortOrder === 'asc' ? '↑ Croissant' : '↓ Décroissant'}
                  </button>
                </div>

                {data && (
                  <div className="text-sm text-gray-600">
                    Page {data.pagination.page} sur {data.pagination.totalPages} • {data.pagination.total} éléments
                  </div>
                )}
              </div>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="bg-white rounded-lg border p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement...</p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="text-red-800 font-medium">Erreur de chargement</div>
                <div className="text-red-600 text-sm mt-1">{error}</div>
                <button
                  onClick={() => loadContent(currentPage)}
                  className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                >
                  Réessayer
                </button>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && data && (!Array.isArray(data.contents) || data.contents.length === 0) && (
              <div className="bg-white rounded-lg border p-12 text-center">
                <div className="text-4xl mb-4">📄</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun contenu trouvé</h3>
                <p className="text-gray-600 mb-6">
                  {activeFilterCount > 0
                    ? 'Essayez d\'ajuster vos filtres pour voir plus de résultats.'
                    : 'Vous n\'avez pas encore créé de contenu pour ce niveau.'
                  }
                </p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Effacer tous les filtres
                  </button>
                )}
              </div>
            )}

            {/* Content grid */}
            {!loading && !error && data && Array.isArray(data.contents) && data.contents.length > 0 && (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {data.contents.map((content) => (
                    <div key={content._id} className={`bg-white rounded-lg border transition-shadow ${selectedItems.includes(content._id)
                      ? 'ring-2 ring-blue-500 shadow-md'
                      : 'hover:shadow-md'
                      }`}>
                      <div className="p-6">
                        {/* Selection and Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(content._id)}
                              onChange={() => toggleItemSelection(content._id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{getContentTypeIcon(content.type)}</span>
                              <StatusBadge status={content.primaryStatus} />
                            </div>
                          </div>
                          {content.notionPageId && (
                            <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                              ↗ Notion
                            </div>
                          )}
                        </div>

                        {/* Title and subject */}
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                          {content.title}
                        </h3>
                        <div className="text-sm text-gray-600 mb-3">
                          {content.subject.name}
                        </div>

                        {/* Metadata */}
                        <div className="text-xs text-gray-500 space-y-1 mb-4">
                          <div className="flex justify-between">
                            <span>Versions:</span>
                            <span>{content.versionCounts.total}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Modèles:</span>
                            <span>{content.modelsUsed.join(', ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Modifié:</span>
                            <span>{new Date(content.updatedAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => router.push(`/contents/${content._id}/edit`)}
                            className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          >
                            Éditer
                          </button>
                          <button
                            onClick={() => router.push(`/contents/${content._id}/versions`)}
                            className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            Versions
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {data.pagination.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center space-x-2">
                    <button
                      onClick={() => loadContent(currentPage - 1)}
                      disabled={!data.pagination.hasPrevious}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Précédent
                    </button>

                    {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => loadContent(page)}
                          className={`px-4 py-2 text-sm border rounded-md ${page === currentPage
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => loadContent(currentPage + 1)}
                      disabled={!data.pagination.hasNext}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}