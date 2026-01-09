'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TiptapEditor } from '@/components/editor/TiptapEditor';

/**
 * Content Editor Page
 *
 * Allows editing content with Tiptap rich text editor and auto-save functionality.
 */
export default function ContentEditPage() {
  const params = useParams();
  const router = useRouter();
  const contentId = params?.id as string;

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load content on mount
  useEffect(() => {
    if (!contentId) return;

    async function loadContent() {
      try {
        const response = await fetch(`/api/contents/${contentId}`);

        if (!response.ok) {
          throw new Error('Failed to load content');
        }

        const data = await response.json();
        setContent(data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load content');
        setLoading(false);
      }
    }

    loadContent();
  }, [contentId]);

  // Save function - updates current version content
  const handleSave = async (newContent: string) => {
    if (!content || !contentId) return;

    // Find current version or use latest version
    const currentVersionIndex =
      content.currentVersion !== undefined
        ? content.currentVersion
        : content.versions.length - 1;

    const currentVersion = content.versions[currentVersionIndex];

    if (!currentVersion) {
      throw new Error('No version found to update');
    }

    // Update the version content using the new endpoint
    const response = await fetch(
      `/api/contents/${contentId}/versions/${currentVersion.versionNumber}/content`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newContent,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to save content');
    }

    // Update local state with the response data
    const responseData = await response.json();
    const updatedContent = { ...content };
    updatedContent.versions[currentVersionIndex] = responseData.data.version;
    setContent(updatedContent);
  };

  // Compare with both models
  const handleCompare = async () => {
    if (!content || !contentId) return;

    const confirmed = window.confirm(
      'Générer de nouvelles versions avec Gemini ET Claude pour comparaison ?'
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/contents/${contentId}/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Use current prompt
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to generate comparison');
      }

      const responseData = await response.json();
      
      // Redirect to comparison view
      router.push(`/contents/${contentId}/compare`);
    } catch (error) {
      console.error('Comparison failed:', error);
      alert(`Erreur lors de la comparaison: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  // Regenerate with alternate model
  const handleRegenerate = async () => {
    if (!content || !contentId) return;

    const currentVersion = content.versions[content.currentVersion || 0];
    const alternateModel = currentVersion.aiModel === 'gemini' ? 'claude' : 'gemini';
    
    const confirmed = window.confirm(
      `Régénérer ce contenu avec ${alternateModel} ? La version actuelle (${currentVersion.aiModel}) sera marquée comme rejetée.`
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/contents/${contentId}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aiModel: alternateModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to regenerate content');
      }

      const responseData = await response.json();
      
      // Update local state with regenerated content
      setContent(responseData.data);
      
      // Show success message
      alert(`Contenu régénéré avec succès avec ${alternateModel} !`);
      
      // Optionally reload the page to ensure fresh state
      window.location.reload();
    } catch (error) {
      console.error('Regeneration failed:', error);
      alert(`Erreur lors de la régénération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  // Get current version content
  const getCurrentVersionContent = () => {
    if (!content || !content.versions || content.versions.length === 0) {
      return '';
    }

    const currentVersionIndex =
      content.currentVersion !== undefined
        ? content.currentVersion
        : content.versions.length - 1;

    return content.versions[currentVersionIndex]?.content || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
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
            className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
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

  const currentVersionIndex =
    content.currentVersion !== undefined
      ? content.currentVersion
      : content.versions.length - 1;

  const currentVersion = content.versions[currentVersionIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="text-sm text-gray-600 hover:text-gray-900 mb-2"
              >
                ← Retour
              </button>
              <h1 className="text-2xl font-bold">{content.title}</h1>
              <p className="text-sm text-gray-600 mt-1">
                {content.subject?.name} • {content.type.toUpperCase()} • Version{' '}
                {currentVersion?.versionNumber}
                {currentVersion?.status === 'published' && (
                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                    Publiée
                  </span>
                )}
                {currentVersion?.status === 'draft' && (
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded">
                    Brouillon
                  </span>
                )}
                
                {/* Link to versions management */}
                <button
                  onClick={() => router.push(`/contents/${contentId}/versions`)}
                  className="ml-2 text-blue-600 hover:text-blue-800 text-xs underline"
                >
                  Gérer les versions ({content.versions.length})
                </button>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Modèle: {currentVersion?.aiModel}
              </span>
              
              {/* Compare Button */}
              {currentVersion && (
                <button
                  onClick={handleCompare}
                  className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                  title="Comparer Gemini vs Claude"
                >
                  ⚖️ Comparer
                </button>
              )}
              
              {/* Regenerate Button */}
              {currentVersion && (
                <button
                  onClick={handleRegenerate}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  title={`Régénérer avec ${currentVersion.aiModel === 'gemini' ? 'Claude' : 'Gemini'}`}
                >
                  🔄 Régénérer
                </button>
              )}
              
              {/* Publish Button */}
              {currentVersion?.status === 'draft' && (
                <button
                  onClick={() => alert('Fonction de publication à implémenter')}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                >
                  📤 Publier
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <TiptapEditor
          content={getCurrentVersionContent()}
          onUpdate={handleSave}
          placeholder="Commencez à éditer le contenu..."
          autoSave={true}
          autoSaveDelay={3000}
          className="shadow-lg"
        />

        {/* Metadata */}
        <div className="mt-4 p-4 bg-white rounded-lg border text-sm text-gray-600">
          <p>
            <strong>Tokens utilisés:</strong> {currentVersion?.metadata.tokensUsed}
          </p>
          <p>
            <strong>Durée de génération:</strong> {currentVersion?.metadata.durationMs}ms
          </p>
          <p>
            <strong>Modèle:</strong> {currentVersion?.metadata.model} (
            {currentVersion?.metadata.modelVersion})
          </p>
          <p>
            <strong>Créé le:</strong>{' '}
            {new Date(currentVersion?.createdAt).toLocaleString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  );
}
