'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TDCreationForm } from '@/components/forms/TDCreationForm';
import { ControlCreationForm } from '@/components/forms/ControlCreationForm';
import { QuickTDForm } from '@/components/forms/QuickTDForm';
import { CourseCreationForm } from '@/components/forms/CourseCreationForm';
import type { ISubject, ContentType } from '@studymate/shared';

/**
 * Content Creation Page
 * Allows creating different types of content (Course, TD, Control)
 */
export default function CreateContentPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params?.id as string;

  const [subject, setSubject] = useState<ISubject | null>(null);
  const [selectedType, setSelectedType] = useState<ContentType>('course');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load subject details
  useEffect(() => {
    if (!subjectId) return;

    async function loadSubject() {
      try {
        const response = await fetch(`/api/subjects/${subjectId}`);

        if (!response.ok) {
          throw new Error('Subject not found');
        }

        const data = await response.json();
        setSubject(data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading subject:', err);
        setError(err instanceof Error ? err.message : 'Failed to load subject');
        setLoading(false);
      }
    }

    loadSubject();
  }, [subjectId]);

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
                Créer du contenu - {subject.name}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Niveau: {subject.level} • Type: {selectedType.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Content Type Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Type de contenu
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                type: 'course' as ContentType,
                title: 'Cours',
                description: 'Contenu théorique et explications',
                icon: '📚',
              },
              {
                type: 'td' as ContentType,
                title: 'TD (Travaux Dirigés)',
                description: 'Exercices basés sur un cours existant',
                icon: '✏️',
              },
              {
                type: 'control' as ContentType,
                title: 'Contrôle',
                description: 'Évaluation et examens',
                icon: '📝',
                disabled: false,
              },
            ].map((option) => (
              <button
                key={option.type}
                onClick={() => !option.disabled && setSelectedType(option.type)}
                disabled={option.disabled}
                className={`p-6 rounded-lg border-2 text-left transition-all ${selectedType === option.type
                  ? 'border-blue-500 bg-blue-50'
                  : option.disabled
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="text-3xl mb-3">{option.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {option.title}
                </h3>
                <p className="text-sm text-gray-600">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Content Creation Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {selectedType === 'course' && (
            <CourseCreationForm
              subject={subject}
              onSubmit={() => {
                console.log('Course creation completed');
              }}
            />
          )}

          {selectedType === 'td' && (
            <div className="space-y-6">
              {/* Quick TD Creation - priorité */}
              <div className="p-6 border-2 border-solid border-blue-400 rounded-lg bg-blue-50">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  ⚡ Création de TD - Recommandé
                </h3>
                <p className="text-blue-700 mb-4">
                  Créez un TD rapidement avec un modèle de base que vous pourrez ensuite éditer et personnaliser.
                </p>
                <QuickTDForm subject={subject} />
              </div>

              {/* Advanced TD Creation - moins proéminent */}
              <details className="border border-gray-200 rounded-lg">
                <summary className="p-4 cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 inline">
                    📚 TD basé sur un cours existant (Avancé)
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Nécessite d'avoir créé un cours au préalable
                  </p>
                </summary>
                <div className="p-4 border-t">
                  <TDCreationForm
                    subject={subject}
                    onSubmit={() => {
                      console.log('TD creation completed');
                    }}
                  />
                </div>
              </details>
            </div>
          )}

          {selectedType === 'control' && (
            <ControlCreationForm
              subject={subject}
              onSubmit={() => {
                console.log('Control creation completed');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}