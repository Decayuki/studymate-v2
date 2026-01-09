'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface ContentVersion {
  versionNumber: number;
  status: string;
  aiModel: string;
  prompt: string;
  content: string;
  metadata: {
    tokensUsed: number;
    durationMs: number;
    model: string;
    modelVersion: string;
    temperature?: number;
    maxTokens?: number;
  };
  createdAt: string;
  publishedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

interface Content {
  _id: string;
  title: string;
  type: string;
  subject?: {
    _id: string;
    name: string;
    level: string;
  };
  versions: ContentVersion[];
  currentVersion?: number;
  notionPageId?: string;
}

export default function VersionsPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params?.id as string;

  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<ContentVersion | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load content
  useEffect(() => {
    if (!contentId) return;

    const loadContent = async () => {
      try {
        const response = await fetch(`/api/contents/${contentId}`);
        if (!response.ok) {
          throw new Error('Failed to load content');
        }
        const data = await response.json();
        setContent(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [contentId]);

  // Promote rejected version to draft
  const promoteVersion = async (versionNumber: number) => {
    if (!content || actionLoading) return;

    const confirmed = window.confirm(
      `Promouvoir la version ${versionNumber} comme version active ? La version actuelle sera rejetée.`
    );

    if (!confirmed) return;

    setActionLoading(true);

    try {
      const response = await fetch(`/api/contents/${contentId}/versions/${versionNumber}/promote`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to promote version');
      }

      // Reload content to reflect changes
      const updatedResponse = await fetch(`/api/contents/${contentId}`);
      const updatedData = await updatedResponse.json();
      setContent(updatedData.data);

      alert(`Version ${versionNumber} promue avec succès !`);
    } catch (err) {
      alert(`Erreur: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete version permanently
  const deleteVersion = async (versionNumber: number) => {
    if (!content || actionLoading) return;

    const confirmed = window.confirm(
      `Supprimer définitivement la version ${versionNumber} ? Cette action ne peut pas être annulée.`
    );

    if (!confirmed) return;

    setActionLoading(true);

    try {
      const response = await fetch(`/api/contents/${contentId}/versions/${versionNumber}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete version');
      }

      // Reload content to reflect changes
      const updatedResponse = await fetch(`/api/contents/${contentId}`);
      const updatedData = await updatedResponse.json();
      setContent(updatedData.data);

      setSelectedVersion(null); // Clear selection if deleted version was selected
      alert(`Version ${versionNumber} supprimée avec succès !`);
    } catch (err) {
      alert(`Erreur: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-green-100 text-green-800',
      comparing: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
    };

    const labels: Record<string, string> = {
      draft: 'Brouillon',
      published: 'Publié',
      comparing: 'En comparaison',
      rejected: 'Rejeté',
    };

    return (
      <span className={`px-2 py-0.5 text-xs rounded-full ${colors[status] || colors.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  // Get model badge
  const getModelBadge = (model: string) => {
    const colors: Record<string, string> = {
      gemini: 'bg-blue-100 text-blue-800',
      claude: 'bg-orange-100 text-orange-800',
    };

    const labels: Record<string, string> = {
      gemini: 'Gemini',
      claude: 'Claude',
    };

    return (
      <span className={`px-2 py-0.5 text-xs rounded-full ${colors[model] || 'bg-gray-100 text-gray-800'}`}>
        {labels[model] || model}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des versions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold">Erreur</p>
          <p className="mt-2">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Contenu introuvable</p>
      </div>
    );
  }

  // Sort versions by version number (newest first)
  const sortedVersions = [...content.versions].sort((a, b) => b.versionNumber - a.versionNumber);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push(`/contents/${contentId}/edit`)}
                className="text-sm text-gray-600 hover:text-gray-900 mb-2"
              >
                ← Retour à l'éditeur
              </button>
              <h1 className="text-2xl font-bold">Gestion des Versions</h1>
              <p className="text-sm text-gray-600 mt-1">
                {content.title} • {content.subject?.name} • {content.type.toUpperCase()}
              </p>
            </div>

            <div className="text-sm text-gray-600">
              {content.versions.length} version{content.versions.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Versions List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Toutes les versions</h2>
              </div>
              
              <div className="divide-y max-h-96 overflow-y-auto">
                {sortedVersions.map((version) => (
                  <div
                    key={version.versionNumber}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedVersion?.versionNumber === version.versionNumber ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    } ${
                      content.currentVersion !== undefined && 
                      content.versions[content.currentVersion]?.versionNumber === version.versionNumber 
                        ? 'border-l-4 border-green-500' : ''
                    }`}
                    onClick={() => setSelectedVersion(version)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium">Version {version.versionNumber}</div>
                      {content.currentVersion !== undefined && 
                       content.versions[content.currentVersion]?.versionNumber === version.versionNumber && (
                        <span className="text-xs text-green-600 font-medium">ACTUELLE</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(version.status)}
                      {getModelBadge(version.aiModel)}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {formatDate(version.createdAt)}
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-1">
                      {version.metadata.tokensUsed} tokens • {Math.round(version.metadata.durationMs / 1000)}s
                    </div>

                    {version.rejectionReason && (
                      <div className="text-xs text-red-600 mt-1">
                        {version.rejectionReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Version Details */}
          <div className="lg:col-span-2">
            {selectedVersion ? (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Version {selectedVersion.versionNumber} - {selectedVersion.aiModel}
                    </h3>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedVersion.status)}
                      
                      {/* Actions for rejected versions */}
                      {selectedVersion.status === 'rejected' && (
                        <>
                          <button
                            onClick={() => promoteVersion(selectedVersion.versionNumber)}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            ↗️ Promouvoir
                          </button>
                          <button
                            onClick={() => deleteVersion(selectedVersion.versionNumber)}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            🗑️ Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Créé le</div>
                      <div className="font-medium">{formatDate(selectedVersion.createdAt)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Tokens</div>
                      <div className="font-medium">{selectedVersion.metadata.tokensUsed}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Durée</div>
                      <div className="font-medium">{Math.round(selectedVersion.metadata.durationMs / 1000)}s</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Température</div>
                      <div className="font-medium">{selectedVersion.metadata.temperature || 'N/A'}</div>
                    </div>
                  </div>

                  {selectedVersion.rejectionReason && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                      <div className="text-sm font-medium text-red-800">Raison du rejet:</div>
                      <div className="text-sm text-red-700">{selectedVersion.rejectionReason}</div>
                    </div>
                  )}
                </div>

                {/* Content Preview */}
                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Contenu généré:</h4>
                  <div className="max-h-96 overflow-y-auto bg-gray-50 p-4 rounded border">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {selectedVersion.content}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
                <p className="text-lg">Sélectionnez une version pour voir les détails</p>
                <p className="text-sm mt-2">Cliquez sur une version dans la liste de gauche</p>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions for Rejected Versions */}
        {content.versions.some(v => v.status === 'rejected') && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Actions en masse pour les versions rejetées
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  {content.versions.filter(v => v.status === 'rejected').length} version(s) rejetée(s) trouvée(s)
                </p>
              </div>
              <button
                onClick={() => {
                  const rejectedVersions = content.versions.filter(v => v.status === 'rejected');
                  if (window.confirm(`Supprimer toutes les ${rejectedVersions.length} versions rejetées ?`)) {
                    alert('Fonction de suppression en masse à implémenter');
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                🗑️ Supprimer toutes les versions rejetées
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}