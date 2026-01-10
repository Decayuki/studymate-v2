'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ISubject, AIModel } from '@studymate/shared';

interface CourseCreationFormProps {
    subject: ISubject;
    onSubmit?: () => void;
}

export function CourseCreationForm({ subject, onSubmit }: CourseCreationFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        prompt: '',
        aiModel: 'gemini' as AIModel,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Le titre est requis';
        } else if (formData.title.length < 5) {
            newErrors.title = 'Le titre doit contenir au moins 5 caractères';
        }

        if (!formData.prompt.trim()) {
            newErrors.prompt = 'Le prompt est requis';
        } else if (formData.prompt.length < 10) {
            newErrors.prompt = 'Le prompt doit contenir au moins 10 caractères';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/contents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subject: subject._id,
                    type: 'course',
                    title: formData.title,
                    prompt: formData.prompt,
                    aiModel: formData.aiModel,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Erreur lors de la création du cours');
            }

            const responseData = await response.json();
            const newContentId = responseData.data._id;

            console.log('Course created:', newContentId);

            onSubmit?.();
            router.push(`/contents/${newContentId}/edit`);
        } catch (error) {
            console.error('Course creation error:', error);
            setErrors({
                submit: error instanceof Error ? error.message : 'Une erreur est survenue',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900">
                    Créer un nouveau cours pour {subject.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    L'IA générera le contenu initial basé sur votre prompt.
                </p>
            </div>

            {/* Title */}
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Titre du cours *
                </label>
                <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title
                            ? 'border-red-300 focus:border-red-300'
                            : 'border-gray-300 focus:border-blue-300'
                        }`}
                    placeholder="Ex: Introduction aux Probabilités"
                />
                {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
            </div>

            {/* Prompt */}
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Instruction pour l'IA (Prompt) *
                </label>
                <p className="text-xs text-gray-500 mb-2">
                    Décrivez ce que doit contenir ce cours (plan, concepts clés, niveau de détail...)
                </p>
                <textarea
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    rows={5}
                    className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.prompt
                            ? 'border-red-300 focus:border-red-300'
                            : 'border-gray-300 focus:border-blue-300'
                        }`}
                    placeholder="Ex: Génère un cours complet sur les probabilités conditionnelles. Inclus des définitions claires, des exemples concrets et des exercices d'application..."
                />
                {errors.prompt && (
                    <p className="mt-1 text-sm text-red-600">{errors.prompt}</p>
                )}
            </div>

            {/* AI Model Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Modèle d'IA
                </label>
                <div className="mt-2 space-y-2">
                    {[
                        { value: 'gemini', label: 'Gemini 2.5 Pro', description: 'Excellent pour les sujets techniques' },
                        { value: 'claude', label: 'Claude 3.5 Sonnet', description: 'Très bon pour la rédaction et la structure' },
                    ].map((option) => (
                        <label key={option.value} className="flex items-start space-x-3">
                            <input
                                type="radio"
                                value={option.value}
                                checked={formData.aiModel === option.value}
                                onChange={(e) => setFormData({ ...formData, aiModel: e.target.value as AIModel })}
                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <div className="flex-1">
                                <span className="text-sm font-medium text-gray-900">{option.label}</span>
                                <p className="text-xs text-gray-500">{option.description}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                    {errors.submit}
                </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Génération...
                        </>
                    ) : (
                        <>✨ Générer le cours</>
                    )}
                </button>
            </div>
        </form>
    );
}
