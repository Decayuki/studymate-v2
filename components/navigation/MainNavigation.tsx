'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Main Navigation Component
 * Global navigation with quick access to all main sections
 */
export function MainNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    {
      name: 'Accueil',
      href: '/',
      icon: '🏠',
      description: 'Tableau de bord principal'
    },
    {
      name: 'Matières',
      href: '/subjects',
      icon: '📚',
      description: 'Gérer les matières'
    },
    {
      name: 'Historique',
      href: '/history',
      icon: '📋',
      description: 'Tous vos contenus'
    },
    {
      name: 'Templates',
      href: '/templates',
      icon: '📄',
      description: 'Templates de contenu'
    },
    {
      name: 'Créer',
      href: '/subjects/create',
      icon: '✨',
      description: 'Nouveau contenu',
      isAction: true
    }
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div 
              onClick={() => router.push('/')}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <div className="text-2xl font-bold text-blue-600">📚</div>
              <div className="text-xl font-bold text-gray-900">StudyMate</div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : item.isAction
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  title={item.description}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </button>
              ))}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-gray-900 p-2"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : item.isAction
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <div className="text-left">
                    <div>{item.name}</div>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Breadcrumb */}
      {pathname !== '/' && (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <button 
                onClick={() => router.push('/')}
                className="hover:text-blue-600"
              >
                Accueil
              </button>
              {pathname.split('/').filter(Boolean).map((segment, index, array) => {
                const href = '/' + array.slice(0, index + 1).join('/');
                const isLast = index === array.length - 1;
                
                // Prettier segment names
                const segmentNames: Record<string, string> = {
                  'subjects': 'Matières',
                  'contents': 'Contenus',
                  'history': 'Historique',
                  'edit': 'Édition',
                  'create': 'Création',
                  'versions': 'Versions',
                  'compare': 'Comparaison'
                };
                
                const displayName = segmentNames[segment] || segment;
                
                return (
                  <div key={href} className="flex items-center space-x-2">
                    <span>›</span>
                    {isLast ? (
                      <span className="text-gray-900 font-medium">{displayName}</span>
                    ) : (
                      <button 
                        onClick={() => router.push(href)}
                        className="hover:text-blue-600"
                      >
                        {displayName}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}