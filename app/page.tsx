'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ISubject, EducationLevel } from '@studymate/shared';

interface ContentStats {
  total: number;
  published: number;
  draft: number;
  byType: {
    course: number;
    td: number;
    control: number;
  };
}

interface DashboardStats {
  subjects: number;
  contents: ContentStats;
  recentActivity: {
    _id: string;
    title: string;
    type: string;
    subject: string;
    updatedAt: string;
    status: string;
  }[];
}

/**
 * StudyMate Dashboard - Page d'accueil
 * Vue d'ensemble de tous les contenus et accès rapides
 */
export default function HomePage() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<EducationLevel>('lycee');
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Charger les données du dashboard
  useEffect(() => {
    loadDashboardData();
  }, [selectedLevel]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Charger les matières
      const subjectsResponse = await fetch('/api/subjects');
      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json();
        const filteredSubjects = (subjectsData.data || []).filter(
          (s: ISubject) => s.level === selectedLevel
        );
        setSubjects(filteredSubjects);
      }

      // Charger les stats de contenu
      const statsResponse = await fetch(`/api/contents/all?level=${selectedLevel}&limit=5`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        const contents = statsData.data.contents || [];
        
        // Calculer les statistiques
        const contentStats: ContentStats = {
          total: statsData.data.pagination.total || 0,
          published: contents.filter((c: any) => c.primaryStatus === 'published').length,
          draft: contents.filter((c: any) => c.primaryStatus === 'draft').length,
          byType: {
            course: contents.filter((c: any) => c.type === 'course').length,
            td: contents.filter((c: any) => c.type === 'td').length,
            control: contents.filter((c: any) => c.type === 'control').length,
          }
        };

        setStats({
          subjects: filteredSubjects.length,
          contents: contentStats,
          recentActivity: contents.slice(0, 5).map((c: any) => ({
            _id: c._id,
            title: c.title,
            type: c.type,
            subject: c.subject.name,
            updatedAt: c.updatedAt,
            status: c.primaryStatus,
          }))
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Créer un Cours',
      description: 'Générer un nouveau cours avec l\'IA',
      icon: '📚',
      color: 'blue',
      action: () => router.push('/subjects')
    },
    {
      title: 'Créer un TD',
      description: 'TD basé sur un cours existant',
      icon: '✏️',
      color: 'green',
      action: () => router.push('/subjects')
    },
    {
      title: 'Créer un Contrôle',
      description: 'Évaluation multi-cours',
      icon: '📝',
      color: 'purple',
      action: () => router.push('/subjects')
    },
    {
      title: 'Voir l\'Historique',
      description: 'Tous vos contenus générés',
      icon: '📋',
      color: 'gray',
      action: () => router.push('/history')
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-50';
      case 'draft': return 'text-gray-600 bg-gray-50';
      case 'comparing': return 'text-blue-600 bg-blue-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return 'Publié';
      case 'draft': return 'Brouillon';
      case 'comparing': return 'Comparaison';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course': return '📚';
      case 'td': return '✏️';
      case 'control': return '📝';
      default: return '📄';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Bienvenue sur StudyMate
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Créez du contenu pédagogique de qualité avec l'aide de l'IA. 
              Cours, TDs et contrôles générés par Gemini et Claude.
            </p>

            {/* Level Selector */}
            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSelectedLevel('lycee')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedLevel === 'lycee'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🏫 Lycée
              </button>
              <button
                onClick={() => setSelectedLevel('superieur')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedLevel === 'superieur'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🎓 Enseignement Supérieur
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        {!loading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <span className="text-2xl">📚</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Matières</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.subjects}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <span className="text-2xl">📄</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Contenus</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.contents.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Publiés</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.contents.published}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <span className="text-2xl">✏️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Brouillons</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.contents.draft}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Actions Rapides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left group"
                >
                  <div className="flex items-center mb-3">
                    <div className={`p-3 rounded-lg bg-${action.color}-100 group-hover:bg-${action.color}-200 transition-colors`}>
                      <span className="text-2xl">{action.icon}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-gray-600">{action.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Activité Récente</h2>
              <button
                onClick={() => router.push('/history')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Voir tout →
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Chargement...</p>
                </div>
              ) : stats && stats.recentActivity.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {stats.recentActivity.map((item) => (
                    <div
                      key={item._id}
                      className="p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/contents/${item._id}/edit`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <span className="text-xl">{getTypeIcon(item.type)}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900 line-clamp-1">
                              {item.title}
                            </p>
                            <p className="text-xs text-gray-600">{item.subject}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                            {getStatusLabel(item.status)}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(item.updatedAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune activité récente
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Commencez par créer votre premier contenu
                  </p>
                  <button
                    onClick={() => router.push('/subjects')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Créer du contenu
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subjects Overview */}
        {subjects.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Mes Matières ({selectedLevel === 'lycee' ? 'Lycée' : 'Enseignement Supérieur'})
              </h2>
              <button
                onClick={() => router.push('/subjects')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Gérer les matières →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.slice(0, 6).map((subject) => (
                <div
                  key={subject._id.toString()}
                  className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/subjects/${subject._id}/contents`)}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{subject.name}</h3>
                  {subject.description && (
                    <p className="text-gray-600 text-sm mb-4">{subject.description}</p>
                  )}
                  <div className="flex items-center text-sm text-blue-600">
                    <span>Voir les contenus</span>
                    <span className="ml-1">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}