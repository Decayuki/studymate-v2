/**
 * Advanced Content Templates System
 * Provides sophisticated templates for different content types and educational levels
 */

import type { ContentType, EducationLevel, SubjectCategory } from '@studymate/shared';

export interface TemplateVariable {
  name: string;
  description: string;
  required: boolean;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: string[]; // For select type
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  type: ContentType;
  level: EducationLevel;
  categories: SubjectCategory[];
  variables: TemplateVariable[];
  promptTemplate: string;
  examples?: {
    title: string;
    description: string;
    variables: Record<string, string>;
  }[];
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in minutes
  author?: string;
  version: string;
}

// ============================================================================
// LYCÉE TEMPLATES
// ============================================================================

export const LYCEE_COURSE_TEMPLATES: ContentTemplate[] = [
  {
    id: 'lycee-math-course-basic',
    name: 'Cours de Mathématiques - Structure Standard',
    description: 'Template pour un cours de mathématiques au lycée avec définitions, propriétés et exemples',
    type: 'course',
    level: 'lycee',
    categories: ['mathematics'],
    variables: [
      {
        name: 'chapter_title',
        description: 'Titre du chapitre',
        required: true,
        type: 'text',
        placeholder: 'ex: Les fonctions exponentielles'
      },
      {
        name: 'class_level',
        description: 'Niveau de classe',
        required: true,
        type: 'select',
        options: ['Seconde', 'Première', 'Terminale']
      },
      {
        name: 'key_concepts',
        description: 'Concepts clés à couvrir (séparés par des virgules)',
        required: true,
        type: 'textarea',
        placeholder: 'ex: définition, propriétés, dérivée, primitives'
      },
      {
        name: 'prerequisites',
        description: 'Prérequis nécessaires',
        required: false,
        type: 'textarea',
        placeholder: 'ex: fonctions, calcul de dérivées'
      },
      {
        name: 'practical_applications',
        description: 'Applications pratiques',
        required: false,
        type: 'textarea',
        placeholder: 'ex: croissance démographique, décroissance radioactive'
      }
    ],
    promptTemplate: `Crée un cours de mathématiques complet sur "{{chapter_title}}" pour une classe de {{class_level}}.

Le cours doit inclure :

1. **Introduction et motivation**
   - Contexte et importance du chapitre
   - Lien avec les acquis précédents{{#if prerequisites}} : {{prerequisites}}{{/if}}

2. **Définitions et propriétés principales**
   - Concepts clés : {{key_concepts}}
   - Définitions rigoureuses avec explications
   - Propriétés fondamentales avec démonstrations accessibles

3. **Exemples progressifs**
   - Au moins 3 exemples détaillés
   - Du plus simple au plus complexe
   - Solutions étape par étape

4. **Applications{{#if practical_applications}} et contexte**
   - Applications concrètes : {{practical_applications}}{{/if}}
   - Exercices d'application directe

5. **Points d'attention et erreurs fréquentes**
   - Pièges classiques à éviter
   - Conseils méthodologiques

6. **Résumé et points clés à retenir**

Utilise un langage adapté au niveau {{class_level}}, avec des explications claires et une progression logique.`,
    examples: [
      {
        title: 'Fonctions exponentielles en Terminale',
        description: 'Cours complet sur les fonctions exponentielles',
        variables: {
          chapter_title: 'Les fonctions exponentielles',
          class_level: 'Terminale',
          key_concepts: 'fonction exponentielle, propriétés algébriques, dérivée, primitives, équations exponentielles',
          prerequisites: 'fonctions, calcul de dérivées, logarithmes',
          practical_applications: 'croissance démographique, décroissance radioactive, intérêts composés'
        }
      }
    ],
    tags: ['mathématiques', 'lycée', 'cours', 'structuré'],
    difficulty: 'intermediate',
    estimatedDuration: 45,
    version: '1.0'
  },
  
  {
    id: 'lycee-science-course-experimental',
    name: 'Cours de Sciences - Approche Expérimentale',
    description: 'Template pour un cours de sciences avec démarche expérimentale',
    type: 'course',
    level: 'lycee',
    categories: ['physics', 'chemistry', 'biology'],
    variables: [
      {
        name: 'topic',
        description: 'Sujet du cours',
        required: true,
        type: 'text',
        placeholder: 'ex: La photosynthèse'
      },
      {
        name: 'subject',
        description: 'Matière',
        required: true,
        type: 'select',
        options: ['Physique', 'Chimie', 'SVT', 'Sciences de l\'ingénieur']
      },
      {
        name: 'phenomenon_to_study',
        description: 'Phénomène à étudier',
        required: true,
        type: 'textarea',
        placeholder: 'ex: conversion de la lumière en énergie chimique'
      },
      {
        name: 'experiments',
        description: 'Expériences possibles à mentionner',
        required: false,
        type: 'textarea',
        placeholder: 'ex: test à l\'eau iodée, observation au microscope'
      }
    ],
    promptTemplate: `Crée un cours de {{subject}} sur "{{topic}}" avec une approche expérimentale pour des lycéens.

Structure du cours :

1. **Problématique et questionnement initial**
   - Question scientifique à résoudre
   - Observations du quotidien liées au sujet

2. **Hypothèses et prédictions**
   - Formulation d'hypothèses
   - Prédictions testables

3. **Étude expérimentale**
   - Phénomène étudié : {{phenomenon_to_study}}
   {{#if experiments}}
   - Expériences suggérées : {{experiments}}
   {{/if}}
   - Protocole expérimental
   - Observations attendues

4. **Analyse et interprétation**
   - Exploitation des résultats
   - Validation ou réfutation des hypothèses

5. **Modélisation et lois**
   - Lois et principes mis en évidence
   - Modèles explicatifs

6. **Applications et enjeux**
   - Applications technologiques
   - Enjeux sociétaux et environnementaux

7. **Bilan et synthèse**
   - Points clés à retenir
   - Schémas de synthèse

Adopte un ton engageant et privilégie la démarche d'investigation scientifique.`,
    tags: ['sciences', 'expérimental', 'démarche d\'investigation'],
    difficulty: 'intermediate',
    estimatedDuration: 60,
    version: '1.0'
  }
];

export const LYCEE_TD_TEMPLATES: ContentTemplate[] = [
  {
    id: 'lycee-math-td-problem-solving',
    name: 'TD Mathématiques - Résolution de problèmes',
    description: 'Exercices progressifs avec méthodes de résolution',
    type: 'td',
    level: 'lycee',
    categories: ['mathematics'],
    variables: [
      {
        name: 'course_topic',
        description: 'Thème du cours de référence',
        required: true,
        type: 'text',
        placeholder: 'ex: Dérivées et applications'
      },
      {
        name: 'difficulty_progression',
        description: 'Progression de difficulté souhaitée',
        required: true,
        type: 'select',
        options: ['Facile → Moyen', 'Moyen → Difficile', 'Facile → Difficile']
      },
      {
        name: 'number_of_exercises',
        description: 'Nombre d\'exercices souhaités',
        required: true,
        type: 'number',
        validation: { min: 3, max: 10 }
      },
      {
        name: 'specific_skills',
        description: 'Compétences spécifiques à travailler',
        required: false,
        type: 'textarea',
        placeholder: 'ex: calcul de dérivées, étude de variations'
      }
    ],
    promptTemplate: `Crée un TD de mathématiques sur "{{course_topic}}" avec {{number_of_exercises}} exercices.

Progression : {{difficulty_progression}}
{{#if specific_skills}}Compétences ciblées : {{specific_skills}}{{/if}}

Structure du TD :

1. **Rappels et méthodes** (5 min)
   - Points essentiels du cours
   - Méthodes principales à retenir

2. **Exercices progressifs**
   Crée {{number_of_exercises}} exercices avec :
   - Énoncés clairs et progressifs
   - Solutions détaillées
   - Points méthode pour chaque exercice
   - Variantes ou extensions possibles

3. **Exercice de synthèse**
   - Problème mobilisant plusieurs concepts
   - Guide de résolution par étapes

4. **Auto-évaluation**
   - Grille de compétences
   - Points de vigilance

Pour chaque exercice, indique :
- Niveau de difficulté (★ à ★★★)
- Temps estimé
- Compétences travaillées
- Solutions avec explications détaillées

Privilégie des contextes variés et motivants pour les élèves.`,
    tags: ['mathématiques', 'exercices', 'progressif'],
    difficulty: 'intermediate',
    estimatedDuration: 75,
    version: '1.0'
  }
];

// ============================================================================
// ENSEIGNEMENT SUPÉRIEUR TEMPLATES
// ============================================================================

export const SUPERIEUR_COURSE_TEMPLATES: ContentTemplate[] = [
  {
    id: 'superieur-cs-course-advanced',
    name: 'Cours Informatique - Niveau Universitaire',
    description: 'Template pour un cours d\'informatique avancé avec théorie et pratique',
    type: 'course',
    level: 'superieur',
    categories: ['computer-science'],
    variables: [
      {
        name: 'course_title',
        description: 'Titre du cours',
        required: true,
        type: 'text',
        placeholder: 'ex: Algorithmes de tri avancés'
      },
      {
        name: 'university_level',
        description: 'Niveau universitaire',
        required: true,
        type: 'select',
        options: ['L1', 'L2', 'L3', 'M1', 'M2']
      },
      {
        name: 'theoretical_concepts',
        description: 'Concepts théoriques principaux',
        required: true,
        type: 'textarea',
        placeholder: 'ex: complexité algorithmique, structures de données, preuves de correction'
      },
      {
        name: 'practical_applications',
        description: 'Applications pratiques',
        required: true,
        type: 'textarea',
        placeholder: 'ex: implémentation en Python, analyse de performance'
      },
      {
        name: 'prerequisites',
        description: 'Prérequis techniques',
        required: true,
        type: 'textarea',
        placeholder: 'ex: programmation orientée objet, mathématiques discrètes'
      }
    ],
    promptTemplate: `Développe un cours universitaire complet sur "{{course_title}}" pour le niveau {{university_level}}.

**Prérequis** : {{prerequisites}}

Le cours doit inclure :

## 1. Introduction et contexte (15 min)
- Positionnement dans le curriculum
- Enjeux actuels et applications industrielles
- Liens avec les autres domaines de l'informatique

## 2. Fondements théoriques (30 min)
- Concepts théoriques : {{theoretical_concepts}}
- Définitions formelles avec notations mathématiques
- Théorèmes et propriétés avec démonstrations
- Analyse de complexité (temporelle et spatiale)

## 3. Algorithmes et structures de données (25 min)
- Présentation des algorithmes principaux
- Pseudo-code détaillé
- Invariants et preuves de correction
- Analyse comparative des approches

## 4. Implémentation et aspects pratiques (15 min)
- Applications pratiques : {{practical_applications}}
- Considérations d'implémentation
- Optimisations possibles
- Cas d'usage en entreprise

## 5. Travaux pratiques suggérés (5 min)
- Exercices de programmation
- Projets d'application
- Benchmarks de performance

## 6. Approfondissements et perspectives (5 min)
- Recherches actuelles
- Extensions avancées
- Bibliographie spécialisée

Utilise un niveau de rigueur adapté au {{university_level}} avec des références académiques.`,
    tags: ['informatique', 'universitaire', 'théorie', 'pratique'],
    difficulty: 'advanced',
    estimatedDuration: 90,
    version: '1.0'
  },

  {
    id: 'superieur-engineering-course-project',
    name: 'Cours Ingénierie - Approche Projet',
    description: 'Template pour un cours d\'ingénierie orienté projet et innovation',
    type: 'course',
    level: 'superieur',
    categories: ['engineering'],
    variables: [
      {
        name: 'engineering_domain',
        description: 'Domaine d\'ingénierie',
        required: true,
        type: 'select',
        options: ['Génie civil', 'Génie mécanique', 'Génie électrique', 'Génie industriel', 'Génie informatique']
      },
      {
        name: 'project_theme',
        description: 'Thématique du projet fil rouge',
        required: true,
        type: 'text',
        placeholder: 'ex: Conception d\'un drone autonome'
      },
      {
        name: 'technical_challenges',
        description: 'Défis techniques principaux',
        required: true,
        type: 'textarea',
        placeholder: 'ex: navigation autonome, optimisation énergétique, résistance aux intempéries'
      },
      {
        name: 'methodologies',
        description: 'Méthodologies d\'ingénierie à aborder',
        required: true,
        type: 'textarea',
        placeholder: 'ex: cycle en V, méthodes agiles, analyse de risques'
      }
    ],
    promptTemplate: `Conçois un cours de {{engineering_domain}} centré sur le projet : "{{project_theme}}" avec une approche d'innovation.

## Structure du cours (2h)

### 1. Contextualisation et enjeux (20 min)
- Problématique industrielle actuelle
- État de l'art et solutions existantes
- Opportunités d'innovation

### 2. Analyse du cahier des charges (25 min)
- Spécifications techniques du projet
- Contraintes et exigences
- Critères de performance et d'acceptation

### 3. Méthodologies d'ingénierie (30 min)
- Méthodologies applicables : {{methodologies}}
- Gestion de projet technique
- Analyse des risques et validation

### 4. Défis techniques et solutions (35 min)
- Principaux défis : {{technical_challenges}}
- Analyse multi-critères des solutions
- Technologies émergentes applicables
- Prototypage et validation

### 5. Innovation et créativité (15 min)
- Méthodes de créativité (TRIZ, brainstorming, etc.)
- Propriété intellectuelle et brevets
- Transfert technologique

### 6. Étude de cas et retours d'expérience (10 min)
- Projets similaires réussis
- Échecs et leçons apprises
- Témoignages d'ingénieurs

### 7. Travail en équipe et livrables (5 min)
- Organisation en équipes projet
- Planning et jalons
- Livrables attendus

Encourage l'esprit critique, la créativité et l'approche systémique. Intègre des exemples concrets et des retours d'expérience industriels.`,
    tags: ['ingénierie', 'projet', 'innovation', 'méthodologie'],
    difficulty: 'advanced',
    estimatedDuration: 120,
    version: '1.0'
  }
];

// ============================================================================
// CONTROL TEMPLATES
// ============================================================================

export const CONTROL_TEMPLATES: ContentTemplate[] = [
  {
    id: 'control-comprehensive-assessment',
    name: 'Contrôle Complet Multi-Compétences',
    description: 'Évaluation complète couvrant plusieurs chapitres avec barème détaillé',
    type: 'control',
    level: 'lycee',
    categories: ['mathematics', 'physics', 'chemistry', 'biology'],
    variables: [
      {
        name: 'chapters_covered',
        description: 'Chapitres couverts (séparés par des virgules)',
        required: true,
        type: 'textarea',
        placeholder: 'ex: Fonctions, Dérivées, Études de fonctions'
      },
      {
        name: 'duration',
        description: 'Durée du contrôle (en minutes)',
        required: true,
        type: 'number',
        validation: { min: 30, max: 240 }
      },
      {
        name: 'difficulty_level',
        description: 'Niveau de difficulté global',
        required: true,
        type: 'select',
        options: ['Facile', 'Moyen', 'Difficile', 'Très difficile']
      },
      {
        name: 'evaluation_type',
        description: 'Type d\'évaluation',
        required: true,
        type: 'select',
        options: ['Contrôle continu', 'Devoir surveillé', 'Examen blanc', 'Évaluation finale']
      }
    ],
    promptTemplate: `Crée un {{evaluation_type}} de {{duration}} minutes couvrant : {{chapters_covered}}.

Niveau de difficulté : {{difficulty_level}}

## Structure de l'évaluation

### Consignes générales
- Durée : {{duration}} minutes
- Documents autorisés : [préciser]
- Calculatrice : [préciser]
- Barème total : 20 points

### Exercices

**Exercice 1 - Connaissances de base (4-5 points)**
- Questions de cours fondamentales
- Applications directes
- Durée estimée : {{#eq duration 60}}15{{else}}{{math duration "*" 0.25}}{{/eq}} minutes

**Exercice 2 - Application intermédiaire (6-7 points)**
- Problèmes d'application
- Mobilisation de plusieurs concepts
- Durée estimée : {{#eq duration 60}}20{{else}}{{math duration "*" 0.33}}{{/eq}} minutes

**Exercice 3 - Problème de synthèse (6-8 points)**
- Problème complexe
- Raisonnement et argumentation
- Durée estimée : {{#eq duration 60}}25{{else}}{{math duration "*" 0.42}}{{/eq}} minutes

**Bonus éventuel (1-2 points)**
- Question d'ouverture ou d'approfondissement

### Barème détaillé
Pour chaque exercice, indique :
- Compétences évaluées
- Critères de réussite
- Barème de notation
- Erreurs fréquentes à pénaliser

### Corrigé type
- Solutions complètes et détaillées
- Méthodes alternatives acceptées
- Grille d'évaluation pour l'enseignant

Assure-toi que le niveau correspond à "{{difficulty_level}}" et que la progression est adaptée au temps imparti.`,
    tags: ['évaluation', 'contrôle', 'barème', 'synthèse'],
    difficulty: 'intermediate',
    estimatedDuration: 30,
    version: '1.0'
  }
];

// ============================================================================
// TEMPLATE MANAGER
// ============================================================================

export class ContentTemplateManager {
  private static templates: ContentTemplate[] = [
    ...LYCEE_COURSE_TEMPLATES,
    ...LYCEE_TD_TEMPLATES,
    ...SUPERIEUR_COURSE_TEMPLATES,
    ...CONTROL_TEMPLATES,
  ];

  static getAllTemplates(): ContentTemplate[] {
    return this.templates;
  }

  static getTemplatesByType(type: ContentType): ContentTemplate[] {
    return this.templates.filter(t => t.type === type);
  }

  static getTemplatesByLevel(level: EducationLevel): ContentTemplate[] {
    return this.templates.filter(t => t.level === level);
  }

  static getTemplatesByCategory(category: SubjectCategory): ContentTemplate[] {
    return this.templates.filter(t => t.categories.includes(category));
  }

  static getTemplate(id: string): ContentTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  static searchTemplates(query: string): ContentTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.templates.filter(template =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  static renderTemplate(template: ContentTemplate, variables: Record<string, any>): string {
    let rendered = template.promptTemplate;
    
    // Simple template engine (replace {{variable}} with values)
    for (const [key, value] of Object.entries(variables)) {
      if (value !== undefined && value !== null) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        rendered = rendered.replace(regex, String(value));
      }
    }
    
    // Handle conditional blocks {{#if variable}}...{{/if}}
    rendered = rendered.replace(/\{\{#if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/gs, (match, varName, content) => {
      return variables[varName] ? content : '';
    });
    
    return rendered;
  }

  static validateVariables(template: ContentTemplate, variables: Record<string, any>): string[] {
    const errors: string[] = [];
    
    for (const variable of template.variables) {
      const value = variables[variable.name];
      
      if (variable.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        errors.push(`${variable.description} est obligatoire`);
        continue;
      }
      
      if (value && variable.validation) {
        if (variable.type === 'number') {
          const numValue = Number(value);
          if (variable.validation.min && numValue < variable.validation.min) {
            errors.push(`${variable.description} doit être supérieur à ${variable.validation.min}`);
          }
          if (variable.validation.max && numValue > variable.validation.max) {
            errors.push(`${variable.description} doit être inférieur à ${variable.validation.max}`);
          }
        }
        
        if (variable.type === 'text' && variable.validation.pattern) {
          const pattern = new RegExp(variable.validation.pattern);
          if (!pattern.test(String(value))) {
            errors.push(`${variable.description} ne respecte pas le format attendu`);
          }
        }
      }
    }
    
    return errors;
  }
}