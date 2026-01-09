'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { ISubject, IContent, ContentType } from '@studymate/shared';

/**
 * Subject Contents List Page
 * Shows all content (courses, TDs, controls) for a subject
 */
export default function SubjectContentsPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params?.id as string;

  const [subject, setSubject] = useState<ISubject | null>(null);
  const [contents, setContents] = useState<IContent[]>([]);
  const [selectedType, setSelectedType] = useState<ContentType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load subject and contents
  useEffect(() => {
    if (!subjectId) return;

    async function loadData() {
      try {
        // Load subject
        const subjectResponse = await fetch(`/api/subjects/${subjectId}`);
        if (!subjectResponse.ok) throw new Error('Subject not found');
        const subjectData = await subjectResponse.json();
        setSubject(subjectData.data);

        // Load contents  
        const contentsResponse = await fetch(`/api/contents?subject=${subjectId}`);
        if (!contentsResponse.ok) throw new Error('Failed to load contents');
        const contentsData = await contentsResponse.json();
        setContents(contentsData.data || []);

        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    }

    loadData();
  }, [subjectId]);

  // Filter contents by type
  const filteredContents = selectedType === 'all' 
    ? contents 
    : contents.filter(content => content.type === selectedType);

  const getContentTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'course': return '📚';
      case 'td': return '✏️';
      case 'control': return '📝';
      default: return '📄';
    }
  };

  const getContentTypeLabel = (type: ContentType) => {
    switch (type) {
      case 'course': return 'Cours';
      case 'td': return 'TD';
      case 'control': return 'Contrôle';
      default: return type;
    }
  };

  const getStatusBadge = (content: IContent) => {
    const publishedVersion = content.versions.find(v => v.status === 'published');
    const hasVersions = content.versions.length > 0;
    
    if (publishedVersion) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          Publié
        </span>
      );
    } else if (hasVersions) {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
          Brouillon
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
          Aucune version
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold">Erreur</p>
          <p className="mt-2">{error || 'Subject not found'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="text-sm text-gray-600 hover:text-gray-900 mb-2"
              >
                ← Retour
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{subject.name}</h1>
              <p className="text-sm text-gray-600 mt-1">
                Niveau: {subject.level} • {filteredContents.length} contenu(s)
                {subject.description && ` • ${subject.description}`}
              </p>
            </div>
            <button
              onClick={() => router.push(`/subjects/${subjectId}/contents/create`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Créer du contenu
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { key: 'all', label: 'Tout', count: contents.length },
              { key: 'course', label: 'Cours', count: contents.filter(c => c.type === 'course').length },
              { key: 'td', label: 'TD', count: contents.filter(c => c.type === 'td').length },
              { key: 'control', label: 'Contrôles', count: contents.filter(c => c.type === 'control').length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedType(tab.key as ContentType | 'all')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedType === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Contents Grid */}
        {filteredContents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedType === 'all' ? 'Aucun contenu' : `Aucun ${getContentTypeLabel(selectedType as ContentType).toLowerCase()}`}
            </h3>
            <p className="text-gray-600 mb-6">
              Commencez par créer votre premier contenu pour cette matière
            </p>
            <button
              onClick={() => router.push(`/subjects/${subjectId}/contents/create`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Créer du contenu
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredContents.map((content) => (
              <div
                key={content._id.toString()}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getContentTypeIcon(content.type)}</span>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {getContentTypeLabel(content.type)}
                      </span>
                    </div>
                    {getStatusBadge(content)}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {content.title}
                  </h3>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    <p>{content.versions.length} version(s)</p>
                    <p>Créé le {new Date(content.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>

                  {/* TD-specific info */}
                  {content.type === 'td' && content.specifications && 'linkedCourseId' in content.specifications && (
                    <div className="mb-4 p-2 bg-blue-50 rounded text-sm">
                      <span className="text-blue-800 font-medium">📚 Basé sur un cours</span>
                    </div>
                  )}

                  {/* Control-specific info */}
                  {content.type === 'control' && content.specifications && 'linkedCourseIds' in content.specifications && (
                    <div className="mb-4 p-2 bg-purple-50 rounded text-sm">
                      <div className="text-purple-800 font-medium">
                        📝 Couvre {(content.specifications as any).linkedCourseIds?.length || 0} cours
                      </div>
                      {'duration' in content.specifications && (
                        <div className="text-purple-600 text-xs mt-1">
                          Durée: {Math.floor((content.specifications as any).duration / 60)}h{((content.specifications as any).duration % 60 > 0) ? ` ${(content.specifications as any).duration % 60}min` : ''}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {content.versions.length > 0 && (
                        <span>
                          Dernière modification: {new Date(content.updatedAt).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/contents/${content._id}/edit`)}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        Éditer
                      </button>
                      <button
                        onClick={() => router.push(`/contents/${content._id}/versions`)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Versions
                      </button>
                    </div>
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