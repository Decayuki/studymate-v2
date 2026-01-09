'use client';

import { useState } from 'react';
import { TiptapEditor } from '@/components/editor/TiptapEditor';

/**
 * Enhanced Editor Demo Page
 * Showcase all features of the Tiptap enhanced editor
 */
export default function EditorDemoPage() {
  const [content, setContent] = useState(`
    <h1>Bienvenue dans l'éditeur StudyMate 📚</h1>
    
    <p>Cet éditeur avancé supporte de nombreuses fonctionnalités pour créer du contenu pédagogique riche:</p>
    
    <h2>Formatage de texte</h2>
    <p>Vous pouvez utiliser du <strong>gras</strong>, de l'<em>italique</em>, du <u>souligné</u>, du <s>barré</s> et du <mark>texte surligné</mark>.</p>
    
    <h2>Listes</h2>
    <ul>
      <li>Liste à puces</li>
      <li>Élément avec <strong>formatage</strong></li>
      <li>Imbrication possible</li>
    </ul>
    
    <ol>
      <li>Liste numérotée</li>
      <li>Ordre automatique</li>
      <li>Facile à utiliser</li>
    </ol>
    
    <h2>Alignement du texte</h2>
    <p style="text-align: center">Texte centré</p>
    <p style="text-align: right">Texte aligné à droite</p>
    
    <h2>Liens et médias</h2>
    <p>Insérez des <a href="https://example.com">liens hypertexte</a> facilement.</p>
    
    <h2>Tableaux</h2>
    <table>
      <tr>
        <td>Cellule 1</td>
        <td>Cellule 2</td>
        <td>Cellule 3</td>
      </tr>
      <tr>
        <td>Donnée A</td>
        <td>Donnée B</td>
        <td>Donnée C</td>
      </tr>
    </table>
    
    <p>L'éditeur inclut également:</p>
    <ul>
      <li>✨ Sauvegarde automatique</li>
      <li>📊 Compteur de caractères</li>
      <li>↶↷ Annulation/Refaire</li>
      <li>🎨 Interface intuitive</li>
    </ul>
  `);

  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Démo de l'éditeur StudyMate
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Testez toutes les fonctionnalités avancées de notre éditeur
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowRaw(!showRaw)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  showRaw 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {showRaw ? 'Masquer HTML' : 'Voir HTML'}
              </button>
              
              <button
                onClick={() => {
                  setContent('');
                  setTimeout(() => {
                    setContent('<p>Contenu effacé ! Commencez à taper...</p>');
                  }, 100);
                }}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Éditeur</h2>
            <TiptapEditor
              content={content}
              onUpdate={setContent}
              placeholder="Commencez à écrire pour tester l'éditeur..."
              autoSave={false} // Disabled for demo
              className="h-[600px]"
            />
          </div>

          {/* Preview / Raw HTML */}
          <div>
            <h2 className="text-lg font-semibold mb-4">
              {showRaw ? 'HTML généré' : 'Aperçu'}
            </h2>
            
            {showRaw ? (
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-[600px] overflow-auto">
                <pre className="whitespace-pre-wrap">{content}</pre>
              </div>
            ) : (
              <div className="bg-white border rounded-lg p-6 h-[600px] overflow-auto">
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Features showcase */}
        <div className="mt-12 bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-4">Fonctionnalités disponibles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">✨</div>
              <h3 className="font-medium mb-1">Formatage riche</h3>
              <p className="text-sm text-gray-600">Gras, italique, souligné, barré, surligné</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">📝</div>
              <h3 className="font-medium mb-1">Titres & Listes</h3>
              <p className="text-sm text-gray-600">H1-H3, listes à puces, numérotées</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">🔗</div>
              <h3 className="font-medium mb-1">Liens & Médias</h3>
              <p className="text-sm text-gray-600">Hyperliens, images intégrées</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-medium mb-1">Tableaux</h3>
              <p className="text-sm text-gray-600">Création et édition de tableaux</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-medium mb-1">Sauvegarde auto</h3>
              <p className="text-sm text-gray-600">Sauvegarde en temps réel</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">↶</div>
              <h3 className="font-medium mb-1">Annulation</h3>
              <p className="text-sm text-gray-600">Ctrl+Z / Ctrl+Y</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">📱</div>
              <h3 className="font-medium mb-1">Responsive</h3>
              <p className="text-sm text-gray-600">Adapté mobile/tablette</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-medium mb-1">Alignement</h3>
              <p className="text-sm text-gray-600">Gauche, centre, droite</p>
            </div>
          </div>
        </div>

        {/* Usage tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3">💡 Conseils d'utilisation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <strong>Raccourcis clavier :</strong>
              <ul className="mt-1 space-y-1">
                <li>• <code>Ctrl+B</code> - Gras</li>
                <li>• <code>Ctrl+I</code> - Italique</li>
                <li>• <code>Ctrl+U</code> - Souligné</li>
                <li>• <code>Ctrl+Z</code> - Annuler</li>
              </ul>
            </div>
            <div>
              <strong>Formatage rapide :</strong>
              <ul className="mt-1 space-y-1">
                <li>• <code># Titre 1</code></li>
                <li>• <code>## Titre 2</code></li>
                <li>• <code>- Liste à puces</code></li>
                <li>• <code>1. Liste numérotée</code></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}