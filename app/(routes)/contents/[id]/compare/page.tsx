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
}

export default function ComparePage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params?.id as string;

  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);

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

  // Select version and redirect to edit
  const selectVersion = async (versionNumber: number, modelName: string) => {
    if (!content) return;
    
    setSelecting(true);
    
    try {
      const response = await fetch(`/api/contents/${contentId}/versions/${versionNumber}/select`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to select version');
      }

      // Redirect to edit page
      router.push(`/contents/${contentId}/edit`);
    } catch (err) {
      alert(`Erreur lors de la sélection: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSelecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la comparaison...</p>
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

  // Find comparing versions
  const comparingVersions = content.versions.filter(v => v.status === 'comparing');
  const geminiVersion = comparingVersions.find(v => v.aiModel === 'gemini');
  const claudeVersion = comparingVersions.find(v => v.aiModel === 'claude');

  if (!geminiVersion || !claudeVersion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl font-semibold text-red-600">Aucune comparaison disponible</p>
          <p className="mt-2 text-gray-600">Les deux versions (Gemini et Claude) sont nécessaires pour la comparaison.</p>
          <button
            onClick={() => router.push(`/contents/${contentId}/edit`)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Aller à l'éditeur
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="text-sm text-gray-600 hover:text-gray-900 mb-2"
              >
                ← Retour
              </button>
              <h1 className="text-2xl font-bold">Comparaison IA</h1>
              <p className="text-sm text-gray-600 mt-1">
                {content.title} • {content.subject?.name} • {content.type.toUpperCase()}
              </p>
            </div>

            <div className="text-sm text-gray-600">
              Choisissez la meilleure version
            </div>
          </div>
        </div>
      </div>

      {/* Split View Comparison */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Gemini Version */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
            {/* Panel Header */}
            <div className="bg-blue-50 border-b p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Gemini 2.5 Pro</h3>
                  <p className="text-sm text-blue-700">
                    Version {geminiVersion.versionNumber} • {geminiVersion.metadata.tokensUsed} tokens • {Math.round(geminiVersion.metadata.durationMs / 1000)}s
                  </p>
                </div>
                <button
                  onClick={() => selectVersion(geminiVersion.versionNumber, 'Gemini')}
                  disabled={selecting}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {selecting ? 'Selection...' : 'Choisir cette version'}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {geminiVersion.content}
                </pre>
              </div>
            </div>
          </div>

          {/* Claude Version */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
            {/* Panel Header */}
            <div className="bg-orange-50 border-b p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-orange-900">Claude 3.5 Sonnet</h3>
                  <p className="text-sm text-orange-700">
                    Version {claudeVersion.versionNumber} • {claudeVersion.metadata.tokensUsed} tokens • {Math.round(claudeVersion.metadata.durationMs / 1000)}s
                  </p>
                </div>
                <button
                  onClick={() => selectVersion(claudeVersion.versionNumber, 'Claude')}
                  disabled={selecting}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 transition-colors"
                >
                  {selecting ? 'Selection...' : 'Choisir cette version'}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {claudeVersion.content}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Instructions de comparaison
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Lisez attentivement les deux versions générées</li>
                  <li>Comparez la qualité du contenu, la structure et la pertinence</li>
                  <li>Cliquez sur "Choisir cette version" pour sélectionner votre préférée</li>
                  <li>La version non sélectionnée sera archivée comme "rejetée"</li>
                  <li>Vous pourrez ensuite éditer la version choisie</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}