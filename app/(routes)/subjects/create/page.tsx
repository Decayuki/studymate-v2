'use client';

import { SimpleSubjectForm } from '@/components/subjects/SimpleSubjectForm';

/**
 * Create Subject Page
 * Enhanced form for creating new subjects with higher education support
 */
export default function CreateSubjectPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Créer une nouvelle matière
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Définissez une nouvelle matière avec tous ses détails académiques
              </p>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                🎓 Enseignement Supérieur
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                🏫 Lycée
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <SimpleSubjectForm />
      </div>

      {/* Help Section */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3">💡 Guide de création</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Pour le Lycée :</h4>
              <ul className="space-y-1">
                <li>• Nom simple et clair (ex: "Mathématiques 1ère S")</li>
                <li>• Catégorie appropriée selon la spécialité</li>
                <li>• Description du programme officiel</li>
                <li>• Objectifs d'apprentissage du curriculum</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Pour l'Enseignement Supérieur :</h4>
              <ul className="space-y-1">
                <li>• Contexte institutionnel complet</li>
                <li>• Crédits ECTS selon le référentiel</li>
                <li>• Prérequis académiques détaillés</li>
                <li>• Objectifs alignés avec le diplôme</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-100 rounded">
            <p className="text-blue-900 text-sm">
              <strong>Astuce :</strong> Les matières d'enseignement supérieur seront automatiquement 
              utilisées pour générer du contenu adapté au niveau universitaire avec un vocabulaire 
              et des concepts plus avancés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}