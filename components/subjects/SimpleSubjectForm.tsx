'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SimpleSubjectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    level: 'lycee' as 'lycee' | 'superieur',
    category: 'mathematics' as const,
    description: '',
  });

  const categories = [
    { value: 'mathematics', label: 'Mathématiques' },
    { value: 'physics', label: 'Physique' },
    { value: 'chemistry', label: 'Chimie' },
    { value: 'biology', label: 'Biologie' },
    { value: 'computer-science', label: 'Informatique' },
    { value: 'literature', label: 'Littérature' },
    { value: 'history', label: 'Histoire' },
    { value: 'other', label: 'Autre' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Submitting data:', formData);

      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Erreur lors de la création');
      }

      alert('Matière créée avec succès!');
      router.push('/subjects');
    } catch (err) {
      console.error('Error creating subject:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-bold mb-6">Créer une nouvelle matière (Test)</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 font-medium">Erreur</div>
          <div className="text-red-600 text-sm mt-1">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom de la matière *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="ex: Mathématiques Terminale S"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Niveau *
          </label>
          <select
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value as 'lycee' | 'superieur' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="lycee">🏫 Lycée</option>
            <option value="superieur">🎓 Enseignement Supérieur</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catégorie *
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Description de la matière..."
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer la matière'}
          </button>
        </div>
      </form>
    </div>
  );
}