'use client';

import { useState, useEffect } from 'react';
import { ContentTemplateManager, type ContentTemplate, type TemplateVariable } from '@/lib/content-templates';
import type { ContentType, EducationLevel, SubjectCategory } from '@studymate/shared';

interface TemplateSelectorProps {
  type: ContentType;
  level: EducationLevel;
  category?: SubjectCategory;
  onTemplateSelect: (template: ContentTemplate, variables: Record<string, any>) => void;
  onSkipTemplate: () => void;
}

/**
 * Template Selector Component
 * Advanced template selection and configuration for content generation
 */
export function TemplateSelector({ type, level, category, onTemplateSelect, onSkipTemplate }: TemplateSelectorProps) {
  const [availableTemplates, setAvailableTemplates] = useState<ContentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load available templates
  useEffect(() => {
    let templates = ContentTemplateManager.getTemplatesByType(type);
    templates = templates.filter(t => t.level === level);
    
    if (category) {
      templates = templates.filter(t => t.categories.includes(category));
    }

    if (searchQuery) {
      templates = ContentTemplateManager.searchTemplates(searchQuery)
        .filter(t => t.type === type && t.level === level);
    }

    setAvailableTemplates(templates);
  }, [type, level, category, searchQuery]);

  const handleTemplateSelect = (template: ContentTemplate) => {
    setSelectedTemplate(template);
    setVariables({});
    setValidationErrors([]);
  };

  const handleVariableChange = (variableName: string, value: any) => {
    setVariables(prev => ({ ...prev, [variableName]: value }));
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;

    const errors = ContentTemplateManager.validateVariables(selectedTemplate, variables);
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    onTemplateSelect(selectedTemplate, variables);
  };

  const renderVariableInput = (variable: TemplateVariable) => {
    const value = variables[variable.name] || '';

    switch (variable.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleVariableChange(variable.name, e.target.value)}
            placeholder={variable.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required={variable.required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleVariableChange(variable.name, parseInt(e.target.value) || '')}
            placeholder={variable.placeholder}
            min={variable.validation?.min}
            max={variable.validation?.max}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required={variable.required}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleVariableChange(variable.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required={variable.required}
          >
            <option value="">Sélectionner...</option>
            {variable.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleVariableChange(variable.name, e.target.value)}
            placeholder={variable.placeholder}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required={variable.required}
          />
        );

      default:
        return null;
    }
  };

  const getTypeIcon = (contentType: ContentType) => {
    switch (contentType) {
      case 'course': return '📚';
      case 'td': return '✏️';
      case 'control': return '📝';
      default: return '📄';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (selectedTemplate) {
    return (
      <div className="space-y-6">
        {/* Template Header */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="text-3xl">{getTypeIcon(selectedTemplate.type)}</div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  {selectedTemplate.name}
                </h3>
                <p className="text-blue-700 mt-1">{selectedTemplate.description}</p>
                <div className="flex items-center space-x-4 mt-3 text-sm">
                  <span className={`px-2 py-1 rounded ${getDifficultyColor(selectedTemplate.difficulty)}`}>
                    {selectedTemplate.difficulty === 'beginner' && '⭐ Débutant'}
                    {selectedTemplate.difficulty === 'intermediate' && '⭐⭐ Intermédiaire'}
                    {selectedTemplate.difficulty === 'advanced' && '⭐⭐⭐ Avancé'}
                  </span>
                  <span className="text-blue-600">
                    📅 ~{selectedTemplate.estimatedDuration} min
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedTemplate(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Retour aux templates
            </button>
          </div>
        </div>

        {/* Template Variables */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Configuration du template</h4>
          
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h5 className="font-medium text-red-900 mb-2">Erreurs de validation :</h5>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-6">
            {selectedTemplate.variables.map((variable) => (
              <div key={variable.name}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {variable.description}
                  {variable.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderVariableInput(variable)}
                {variable.type === 'number' && variable.validation && (
                  <p className="text-xs text-gray-500 mt-1">
                    {variable.validation.min && `Min: ${variable.validation.min}`}
                    {variable.validation.min && variable.validation.max && ' • '}
                    {variable.validation.max && `Max: ${variable.validation.max}`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Template Preview */}
        {selectedTemplate.examples && selectedTemplate.examples.length > 0 && (
          <div className="bg-gray-50 border rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-4">Exemples d'utilisation</h4>
            <div className="space-y-4">
              {selectedTemplate.examples.map((example, index) => (
                <div key={index} className="bg-white border rounded p-4">
                  <h5 className="font-medium text-gray-900 mb-2">{example.title}</h5>
                  <p className="text-sm text-gray-600 mb-3">{example.description}</p>
                  <button
                    onClick={() => {
                      setVariables(example.variables);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Utiliser cet exemple →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={onSkipTemplate}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Créer sans template
          </button>
          
          <button
            onClick={handleUseTemplate}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <span>✨</span>
            Utiliser ce template
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Choisir un template pour votre {type}
        </h3>
        <p className="text-gray-600">
          Utilisez un template professionnel pour créer du contenu structuré et adapté
        </p>
      </div>

      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rechercher un template
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par nom, description ou tags..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Templates Grid */}
      {availableTemplates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleTemplateSelect(template)}
            >
              <div className="flex items-start space-x-3 mb-3">
                <div className="text-2xl">{getTypeIcon(template.type)}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 line-clamp-2">
                    {template.name}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {template.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className={`px-2 py-1 rounded ${getDifficultyColor(template.difficulty)}`}>
                  {template.difficulty === 'beginner' && '⭐'}
                  {template.difficulty === 'intermediate' && '⭐⭐'}
                  {template.difficulty === 'advanced' && '⭐⭐⭐'}
                </span>
                <span className="text-gray-500">
                  📅 ~{template.estimatedDuration} min
                </span>
              </div>

              <div className="mt-3">
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{template.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📋</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Aucun template disponible
          </h4>
          <p className="text-gray-600 mb-6">
            Aucun template ne correspond à vos critères actuels.
          </p>
          <button
            onClick={onSkipTemplate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Créer sans template
          </button>
        </div>
      )}

      {/* Skip Option */}
      {availableTemplates.length > 0 && (
        <div className="text-center pt-4 border-t">
          <button
            onClick={onSkipTemplate}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Créer sans utiliser de template →
          </button>
        </div>
      )}
    </div>
  );
}