'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuickTDForm } from '@/components/forms/QuickTDForm';
import type { ISubject, EducationLevel } from '@studymate/shared';

/**
 * Global TD Creation Page
 * Allows selecting a subject and creating a TD quickly
 */
export default function CreateTDPage() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<EducationLevel>('lycee');
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<ISubject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load subjects for selected level
  useEffect(() => {
    loadSubjects();
  }, [selectedLevel]);

  const loadSubjects = async () => {
    setLoading(true);
    setError(null);
    setSelectedSubject(null);

    try {
      const response = await fetch(`/api/subjects?level=${selectedLevel}`);
      
      if (!response.ok) {
        throw new Error('Failed to load subjects');
      }

      const data = await response.json();
      const subjectsList = Array.isArray(data?.data?.data) ? data.data.data : [];
      setSubjects(subjectsList);
    } catch (err) {
      console.error('Error loading subjects:', err);
      setError('Erreur lors du chargement des matières');
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectSelect = (subject: ISubject) => {
    setSelectedSubject(subject);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="text-sm text-gray-600 hover:text-gray-900 mb-2"
              >
                ← Retour
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Créer un TD
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Sélectionnez une matière et créez un TD rapidement
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Level Selector */}
        <div className="bg-white rounded-lg border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            1. Choisissez le niveau
          </h2>
          <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedLevel('lycee')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedLevel === 'lycee'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              🏫 Lycée
            </button>
            <button
              onClick={() => setSelectedLevel('superieur')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedLevel === 'superieur'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              🎓 Enseignement Supérieur
            </button>
          </div>
        </div>

        {/* Subject Selection */}
        <div className="bg-white rounded-lg border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            2. Sélectionnez une matière
          </h2>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des matières...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
              <button
                onClick={loadSubjects}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Réessayer
              </button>
            </div>
          )}

          {!loading && !error && subjects.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune matière trouvée
              </h3>
              <p className="text-gray-600 mb-4">
                Créez d'abord une matière pour le niveau {selectedLevel === 'lycee' ? 'lycée' : 'supérieur'}.
              </p>
              <button
                onClick={() => router.push('/subjects/create')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Créer une matière
              </button>
            </div>
          )}

          {!loading && !error && subjects.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject) => (
                <button
                  key={subject._id.toString()}
                  onClick={() => handleSubjectSelect(subject)}
                  className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${selectedSubject?._id === subject._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="font-medium text-gray-900">{subject.name}</div>
                  {subject.description && (
                    <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {subject.description}
                    </div>
                  )}
                  <div className="text-xs text-blue-600 mt-2">
                    {subject.category} • {subject.level === 'lycee' ? 'Lycée' : 'Supérieur'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TD Creation Form */}
        {selectedSubject && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              3. Créez votre TD pour {selectedSubject.name}
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <QuickTDForm subject={selectedSubject} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}