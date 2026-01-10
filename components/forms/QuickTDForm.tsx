'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ISubject } from '@studymate/shared';

interface QuickTDFormProps {
  subject: ISubject;
}

export function QuickTDForm({ subject }: QuickTDFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Le titre est requis');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/quick-td', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: subject._id,
          title: formData.title,
          topic: formData.topic || 'Contenu général',
        }),
      });

      if (!response.ok) {
        throw new Error('Échec de la création');
      }

      const result = await response.json();
      
      if (result.success) {
        // Redirect to edit page
        router.push(`/contents/${result.data.contentId}/edit`);
      } else {
        throw new Error(result.error || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Error creating quick TD:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Titre du TD *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="ex: TD1 - Exercices sur les organisations"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sujet/Thème (optionnel)
        </label>
        <input
          type="text"
          value={formData.topic}
          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="ex: Les organisations et leur environnement"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Création en cours...
          </>
        ) : (
          <>
            ⚡ Créer le TD rapidement
          </>
        )}
      </button>

      <p className="text-xs text-gray-500">
        Un modèle de TD sera créé instantanément. Vous pourrez ensuite l'éditer et le personnaliser.
      </p>
    </form>
  );
}