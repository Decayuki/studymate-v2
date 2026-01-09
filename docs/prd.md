# StudyMate Product Requirements Document (PRD)

**Version:** 1.0
**Date:** 2026-01-07
**Author:** John (Product Manager)
**Status:** Ready for Architecture Phase

---

## Table of Contents

1. [Goals and Background Context](#goals-and-background-context)
2. [Future Enhancements](#future-enhancements-post-launch)
3. [Out of Scope](#out-of-scope-version-1)
4. [Requirements](#requirements)
5. [User Interface Design Goals](#user-interface-design-goals)
6. [Technical Assumptions](#technical-assumptions)
7. [Epic List](#epic-list)
8. [Epic Details](#epic-details)
9. [Checklist Results Report](#checklist-results-report)
10. [Next Steps](#next-steps)

---

## Goals and Background Context

### Goals

- Centraliser la création de contenu pédagogique multi-niveaux (Seconde → Master) dans une seule application
- Éliminer la fragmentation des agents IA spécialisés par matière et type de contenu
- Permettre la génération guidée de cours, TD, contrôles, partiels et exercices avec des formalismes préenregistrés
- Offrir une flexibilité dans la création via des inputs utilisateur (spécifications, contraintes, angles pédagogiques)
- Assurer une intégration fluide avec Notion pour la présentation aux élèves
- Construire une architecture scalable pour l'ajout futur de nouvelles fonctionnalités

### Background Context

Actuellement, la création de contenus pédagogiques avec l'aide de l'IA nécessite de jongler entre de nombreux agents personnalisés différents : un pour les TD en droit, un autre pour les cours en droit, un pour la matière SGN, etc. Cette fragmentation crée une complexité organisationnelle importante et nuit à l'efficacité du processus de création. Chaque agent doit être géré séparément, avec ses propres guidelines et contextes.

StudyMate vise à résoudre ce problème en proposant un hub centralisé qui conserve la souplesse nécessaire à la création pédagogique tout en unifiant l'expérience. L'application permettra de créer dynamiquement des matières, de spécifier des contextes (chapitres, contraintes particulières), et de générer du contenu respectant des trames pédagogiques prédéfinies. Le contenu généré sera automatiquement sauvegardé dans Notion pour être présenté aux élèves.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2026-01-07 | 1.0 | Initial PRD creation | John (PM) |

---

## Future Enhancements (Post-Launch)

Les fonctionnalités suivantes ont été identifiées comme précieuses mais ne font pas partie du scope initial. Elles seront considérées pour les versions futures de StudyMate après validation du système core.

### Additional Content Types

**Exercices**
- Génération d'exercices d'application courts et ciblés
- Intégration avec les chapitres de cours existants
- Niveaux de difficulté configurables (Facile, Moyen, Difficile)
- Format adaptatif (QCM, questions ouvertes, cas pratiques)

**Partiels**
- Examens de fin de période couvrant plusieurs chapitres
- Gestion de la durée d'examen et points par question
- Barèmes de notation automatiques
- Templates pour examens blancs

### Advanced Generation Features

**Batch Generation**
- Génération de plusieurs chapitres/contenus en une seule opération
- File d'attente de génération avec suivi de progression
- Planification de génération (créer automatiquement tous les chapitres d'un semestre)

**Custom AI Prompt Templates**
- Interface de gestion des templates de prompts
- Personnalisation des trames par matière ou niveau
- Bibliothèque de templates partagés
- Versioning des templates

### Export and Integration

**Enhanced Export Options**
- Export en PDF formaté pour impression
- Export en Word/DOCX éditable
- Export en LaTeX pour publications académiques
- Export de packs complets (cours + TD + contrôle par chapitre)

**LMS Integration**
- Intégration avec Moodle
- Intégration avec Canvas
- Intégration avec Google Classroom
- API pour systèmes tiers

### Collaboration Features

**Multi-User Support**
- Partage de matières avec collègues
- Permissions granulaires (lecture/édition)
- Commentaires et annotations collaboratives
- Historique des modifications par utilisateur

**Content Library**
- Bibliothèque de contenus partagés entre enseignants
- Système de notation et reviews
- Tags et catégorisation avancée
- Fork et adaptation de contenus existants

### Mobile Experience

**Native Mobile Apps**
- Application iOS native (SwiftUI)
- Application Android native (Kotlin)
- Synchronisation offline
- Génération rapide en déplacement
- Consultation optimisée pour mobile

### Intelligence Features

**Smart Suggestions**
- Suggestions de chapitres suivants basées sur progression
- Détection de cohérence entre cours et TD
- Recommandations de contraintes pédagogiques
- Analyse de qualité du contenu généré

**Learning Analytics**
- Statistiques d'usage par élèves (si intégration LMS)
- Analyse de difficulté du contenu
- Recommandations d'amélioration
- Prédictions de temps nécessaire pour complétion

### Performance & Scale

**Advanced Caching**
- Cache distribué (Redis) pour grandes charges
- Pré-génération de contenus récurrents
- CDN pour assets lourds

**Custom AI Models**
- Fine-tuning de modèles spécifiques à des matières
- Modèles locaux pour réduction de coûts
- Intégration de nouveaux modèles (GPT, Llama, etc.)

---

## Out of Scope (Version 1)

Les éléments suivants sont explicitement **exclus** du scope initial de StudyMate. Cette liste clarifie les frontières du projet et évite le scope creep pendant le développement.

### Authentication & Multi-Tenancy

**User Authentication System**
- Login/logout, password management
- OAuth integration (Google, Microsoft)
- Session management
- **Rationale:** Application personnelle, pas besoin d'auth pour V1

**Multi-Tenant Architecture**
- Isolation de données par organisation
- Gestion de permissions multi-niveaux
- Administration système
- **Rationale:** Complexité inutile pour usage personnel

### Real-Time Features

**Real-Time Collaboration**
- Édition simultanée multi-utilisateurs (type Google Docs)
- Curseurs collaboratifs en temps réel
- WebSocket connections
- **Rationale:** Pas de collaboration V1, feature future si multi-user

**Live Notifications**
- Push notifications
- Email notifications
- WebSocket-based updates
- **Rationale:** Application personnelle, pas besoin de notifications

### Offline Capabilities

**Offline Mode**
- Service Workers pour cache offline
- Synchronisation bidirectionnelle
- Gestion de conflits offline/online
- **Rationale:** Application web nécessite connexion pour IA et Notion

**Progressive Web App (PWA)**
- Installation sur device
- App-like experience
- Offline-first architecture
- **Rationale:** Web responsive suffit pour V1

### Advanced Content Management

**Version Control System**
- Git-like versioning for content
- Branch and merge workflows
- Diff tools avec 3-way merge
- **Rationale:** Draft/Published states suffisent pour V1

**Content Approval Workflows**
- Multi-stage approval process
- Review assignments
- Approval permissions
- **Rationale:** Usage personnel, pas besoin de workflow d'approbation

### Plagiarism & Quality Checks

**Plagiarism Detection**
- Integration avec Turnitin ou similaire
- Détection de contenu dupliqué
- Vérification de sources
- **Rationale:** IA génère du contenu original, check manuel suffit

**Automated Quality Scoring**
- Analyse de lisibilité (Flesch-Kincaid)
- Détection de biais
- Scoring de complexité
- **Rationale:** Comparaison manuelle Gemini/Claude suffit pour V1

### Student-Facing Features

**Student Portal**
- Interface pour élèves
- Soumission de devoirs
- Feedback automatique
- **Rationale:** Notion sert d'interface pour élèves

**Grading System**
- Correction automatique
- Rubrics et barèmes
- Calcul de moyennes
- **Rationale:** Hors scope - focus sur création de contenu

### Advanced Integrations

**Video Generation**
- Génération de contenu vidéo basé sur cours
- Text-to-speech pour podcasts éducatifs
- **Rationale:** Complexité élevée, valeur incertaine

**Gamification**
- Points, badges, leaderboards
- Quiz interactifs pour élèves
- **Rationale:** Focus sur création de contenu enseignant

### Infrastructure

**Custom Hosting**
- Self-hosted deployment
- Kubernetes orchestration
- Multi-region deployment
- **Rationale:** Vercel serverless suffit amplement

**Custom Analytics Platform**
- Dashboard analytics complexe
- Data warehouse
- BI tools integration
- **Rationale:** Analytics simples dans Epic 3.8 suffisent

### Legal & Compliance

**GDPR Compliance Tools**
- Data export tools
- Right to be forgotten automation
- Consent management
- **Rationale:** Données personnelles uniquement, pas de GDPR nécessaire

**Accessibility Certification**
- WCAG AAA compliance
- Screen reader optimization
- Accessibility audit tools
- **Rationale:** Usage personnel, WCAG AA best practices suffisent

---

## Requirements

### Functional Requirements

**FR1:** L'application doit permettre de naviguer entre deux contextes principaux distincts : "Lycée" et "Enseignement Supérieur"

**FR2:** L'utilisateur doit pouvoir créer dynamiquement de nouvelles matières et en ajouter ultérieurement

**FR3:** Pour chaque matière, l'utilisateur doit pouvoir créer différents types de contenu : Cours, TD, Contrôles

**FR4:** Lors de la création d'un cours, l'utilisateur doit pouvoir spécifier le numéro/identifiant du chapitre concerné

**FR5:** Lors de la création d'un TD, l'utilisateur doit pouvoir sélectionner un cours/chapitre existant via un menu déroulant pour fournir le contexte à l'IA

**FR6:** L'application doit charger le contenu complet d'un cours depuis la base de données pour le fournir comme contexte lors de la génération d'un TD associé

**FR7:** L'utilisateur doit pouvoir ajouter des informations/contraintes complémentaires pour personnaliser la génération (ex: "sous forme d'enquête policière")

**FR8:** Chaque type de contenu (Cours, TD, Contrôle) doit être généré selon un formalisme/trame préenregistré(e) spécifique

**FR9:** Si l'utilisateur ne fournit pas de contraintes complémentaires, la trame de base doit s'appliquer automatiquement

**FR10:** Si l'utilisateur fournit des contraintes, celles-ci doivent être intégrées subtilement à la trame de base (pas de remplacement complet)

**FR11:** Le contenu généré doit être automatiquement sauvegardé dans une base de données spécifique à la matière

**FR12:** Après génération et sauvegarde locale, le contenu doit être envoyé dans Notion via API

**FR13:** Les matières doivent être isolées et indépendantes les unes des autres

**FR14:** L'utilisateur doit pouvoir revenir sur une matière et un chapitre pour générer plusieurs TD différents sur le même contenu

**FR15:** L'IA doit supporter des fenêtres de tokens larges en entrée et sortie pour traiter des cours complets en contexte

**FR16:** L'utilisateur doit pouvoir sélectionner le modèle IA (Gemini/Claude) avant chaque génération

**FR17:** Après génération, l'utilisateur doit pouvoir régénérer avec un autre modèle IA si le résultat ne convient pas

**FR18:** L'utilisateur doit pouvoir générer avec les deux modèles IA simultanément et les comparer en split view (côte à côte)

**FR19:** En mode comparaison, l'utilisateur doit pouvoir choisir quelle version conserver ou publier

### Non-Functional Requirements

**NFR1:** L'application doit être conçue pour un usage personnel (pas de gestion d'utilisateurs, login, ou authentification)

**NFR2:** L'architecture doit être scalable pour permettre l'ajout facile de nouvelles fonctionnalités

**NFR3:** L'application doit gérer des contextes pédagogiques variés (de la Seconde au Master)

**NFR4:** L'intégration avec l'API Notion doit être robuste et fiable

**NFR5:** La base de données locale doit permettre des requêtes rapides pour récupérer les cours lors de la création de TD

**NFR6:** L'interface doit permettre une navigation claire entre les différents niveaux (Lycée/Supérieur → Matières → Types de contenu)

---

## User Interface Design Goals

### Overall UX Vision

StudyMate vise une expérience de création de contenu fluide et intuitive, où la complexité de la gestion multi-matières et multi-types de contenu est masquée par une navigation claire et progressive. L'utilisateur doit pouvoir passer rapidement d'une matière à l'autre, d'un type de contenu à un autre, tout en ayant un contrôle précis sur les spécifications de génération (chapitre, contraintes pédagogiques). L'interface doit ressembler à un "studio de création pédagogique" plutôt qu'à un simple formulaire de génération IA.

Le pattern de navigation par onglets (inspiré de WriterTool) permet une organisation spatiale claire des contextes (Lycée vs Supérieur) et des matières. L'expérience doit être rapide et efficace car l'application est destinée à un usage personnel intensif.

### Key Interaction Paradigms

- **Navigation par onglets hiérarchiques** : Niveau 1 = Lycée/Supérieur (modal initial ou navigation permanente), Niveau 2 = Matières dynamiques, Niveau 3 = Types de contenu (Cours/TD/Contrôles)
- **Création dynamique de matières** : Bouton "+" pour ajouter une nouvelle matière avec modal de configuration (nom, objet)
- **Workflow guidé de génération** : Formulaire progressif qui s'adapte au type de contenu sélectionné (Cours = spécifier chapitre, TD = sélectionner chapitre + contraintes optionnelles, Contrôle = spécifications propres)
- **Menu déroulant contextuel** : Pour sélectionner un cours/chapitre existant lors de la création de TD
- **Zone de contraintes optionnelles** : Textarea pour ajouter des précisions pédagogiques (ex: "enquête policière")
- **Feedback visuel de génération** : Indicateur de progression pendant l'appel IA et sauvegarde Notion
- **Accès à l'historique** : Consultation des contenus générés précédemment par matière et type

### Core Screens and Views

1. **Écran de sélection du niveau** (Lycée / Enseignement Supérieur) - Modal initial ou navigation top-level
2. **Dashboard des matières** - Vue d'ensemble des matières créées avec accès rapide
3. **Vue Matière** - Interface principale avec sous-navigation pour Cours / TD / Contrôles
4. **Formulaire de création de Cours** - Input chapitre + génération
5. **Formulaire de création de TD** - Dropdown chapitres + textarea contraintes + génération
6. **Formulaire de création de Contrôle** - Inputs spécifiques avec guidelines de rédaction propres
7. **Modal de configuration de nouvelle matière** - Nom, objet, paramètres initiaux
8. **État de génération / Confirmation** - Feedback de succès avec lien Notion
9. **Vue Historique par matière** - Liste des contenus générés (filtrable par type : Cours/TD/Contrôles)
10. **Split View Comparison** - Interface de comparaison side-by-side avec deux panels (Gemini vs Claude), toolbar pour sélectionner quelle version garder/éditer/publier

### Accessibility

**None** - Application personnelle, pas de contraintes d'accessibilité formelles requises. Les bonnes pratiques de base seront naturellement suivies avec Tailwind et shadcn/ui.

### Branding

**WriterTool Design System** - L'application adoptera le même style visuel que WriterTool : Next.js 16 + React 19 avec Tailwind CSS et shadcn/ui pour un design moderne, épuré et cohérent. Interface headless permettant un rendu 100% custom avec une esthétique professionnelle et des composants réutilisables.

### Target Device and Platforms

**Web Responsive** - Application web accessible depuis desktop (usage principal pour création de contenu) et tablette (consultation/génération rapide). Mobile non prioritaire.

---

## Technical Assumptions

### Repository Structure

**Monorepo** - Structure Next.js avec API Routes intégrées
```
studymate/
├── app/                # Next.js App Router
│   ├── (routes)/      # Pages (dashboard, matières, historique)
│   └── api/           # API Routes
├── components/        # shadcn/ui components
├── lib/
│   ├── db/            # MongoDB models & connection
│   ├── ai/            # Gemini & Claude services
│   ├── notion/        # Notion API client
│   └── store/         # Zustand stores
├── types/             # TypeScript types
└── package.json
```

### Service Architecture

**Serverless Architecture (Vercel + MongoDB Atlas)**

**Frontend & Backend** : Next.js 16 + API Routes
- App Router pour UI moderne
- API Routes pour génération IA, CRUD, Notion push
- Server Components pour performance

**Base de données** : MongoDB Atlas + Mongoose
- Collections : `subjects`, `contents` (tous types avec discriminator)
- Statuts : `draft` (éditable), `published` (dans Notion)
- Connection pooling optimisé serverless

**Workflow de Contenu**
```
1. User sélectionne modèle IA (Gemini/Claude)
2. Génération IA → Sauvegarde MongoDB (status: draft)
3. Affichage dans éditeur avec actions : Éditer/Régénérer/Supprimer/Publier
4. User valide → Clic "Publier vers Notion"
5. Push Notion API → Update status: published + notionPageId
```

### Stack Technique Complet

**Frontend**
- Next.js 16 (App Router) + React 19
- TailwindCSS + shadcn/ui (WriterTool pattern)
- Zustand (state management - réutiliser patterns WriterTool)
- React Hook Form + Zod
- Tanstack Query (caching, optimistic updates)
- Tiptap (pour édition rich text des drafts)

**Backend**
- Next.js API Routes (Vercel Serverless)
- MongoDB Atlas + Mongoose
- Dual AI: Gemini SDK + Claude SDK (sélection manuelle par user)
- Notion SDK

**Development**
- TypeScript (strict)
- GitHub (version control)
- pnpm (package manager)
- ESLint + Prettier

**Deployment**
- Vercel (GitHub integration)
- `main` → Production auto-deploy
- Feature branches → Preview deployments

### Testing Requirements

**Pragmatic Testing** - Tests unitaires sur logique critique, validation manuelle pour intégrations IA/Notion. Preview deployments Vercel pour validation pré-production.

### Additional Technical Assumptions

**Dual AI avec Sélection Manuelle**
- Dropdown "Modèle IA" : Gemini 1.5 Pro / Claude 3.5 Sonnet
- Use case : Comparer qualité génération entre modèles sur même contenu
- Abstraction `AIService` : `generate(prompt, model)` unifié

**Draft System Complet**
- CRUD drafts : Créer, Lire, Éditer (rich text), Supprimer
- Régénération avec changement de modèle IA possible
- UI "Brouillons" avec prévisualisation avant publication
- Bouton "Publier vers Notion" → workflow async avec feedback

**Historique Complet**
- Vue unifiée : Tous les contenus (drafts + published)
- Filtres : Par statut, par type (Cours/TD/Contrôle), par matière
- Indicateur visuel clair : Draft (jaune) vs Published (vert) avec lien Notion

**Réutilisation WriterTool**
- Architecture Zustand stores (ex: `useSubjectStore`, `useContentStore`)
- Composants shadcn/ui déjà stylés
- Pattern de sauvegarde optimiste (local-first feel)
- Structure de navigation par onglets

**MongoDB Atlas**
- Gratuit (512MB) largement suffisant
- Connection pooling singleton pour serverless
- Indexes sur `subjectId`, `chapterId`, `status` pour queries rapides

**Notion API**
- Rate limiting : 3 req/sec (géré côté app)
- Retry logic sur échecs temporaires
- Tracking via `notionPageId` en DB

**GitHub Workflow**
- Branches feature pour nouvelles fonctionnalités
- PRs avec preview Vercel
- `main` protégée (require review)
- Commits conventionnels

---

## Epic List

### Epic 1: Foundation & Core Content Creation with AI Comparison
Établir l'infrastructure projet (Next.js, MongoDB Atlas, Vercel), créer le système de gestion des matières pour le niveau Lycée, et implémenter le workflow complet de génération de Cours avec dual AI (Gemini/Claude) et système de comparaison side-by-side, permettre l'édition et la publication vers Notion.

### Epic 2: Advanced Content Generation with Context
Ajouter la génération de TD avec sélection de cours comme contexte (menu déroulant chapitres), implémenter le système de Contrôles avec leurs spécificités de rédaction, appliquer le système de comparaison IA à tous les types de contenu.

### Epic 3: Content History & Advanced Management
Construire l'interface d'historique complet avec filtres avancés (statut, type, matière), permettre la comparaison de versions historiques, améliorer l'édition rich text des drafts, et ajouter des fonctionnalités de gestion en masse.

### Epic 4: Enseignement Supérieur & Production Polish
Dupliquer la logique complète pour le niveau "Enseignement Supérieur", affiner l'UX globale, optimiser les performances (caching, cold starts, rate limiting), et polir l'expérience de comparaison.

---

## Epic Details

### Epic 1: Foundation & Core Content Creation with AI Comparison

**Epic Goal:**

Établir l'infrastructure technique complète de StudyMate (Next.js 16, MongoDB Atlas, Vercel deployment) et implémenter le workflow end-to-end de création de contenu pour le type "Cours" au niveau Lycée. Ce workflow inclut la gestion des matières, la génération de cours via IA (avec choix Gemini ou Claude), le système de draft éditable, la comparaison side-by-side optionnelle des deux modèles IA, la sélection/archivage de versions, et la publication vers Notion. À la fin de cet epic, un utilisateur peut créer une matière en Droit, générer un cours du Chapitre 1 en comparant Gemini et Claude, choisir la meilleure version, l'éditer si nécessaire, et le publier dans Notion.

#### Story 1.1: Project Foundation and Deployment Pipeline

**As a** developer,
**I want** to initialize the Next.js 16 monorepo with TypeScript, Tailwind, shadcn/ui, and deploy a canary page to Vercel,
**so that** the core infrastructure is established and the deployment pipeline is validated before building features.

**Acceptance Criteria:**

1. Next.js 16 project initialized with App Router and TypeScript (strict mode)
2. TailwindCSS configured with shadcn/ui installed and theme setup
3. Project structure created: `app/`, `components/`, `lib/`, `types/` directories
4. GitHub repository created with `main` branch protection
5. Vercel project connected to GitHub with auto-deploy on `main`
6. Canary page deployed at root route displaying "StudyMate - Initialization Complete" with basic Tailwind styling
7. Environment variables configured in Vercel (placeholders for MongoDB, Gemini, Claude, Notion)
8. pnpm configured as package manager with workspace setup
9. ESLint and Prettier configured and running successfully
10. First deployment successful and accessible via Vercel URL

#### Story 1.2: MongoDB Atlas Integration and Subject Model

**As a** developer,
**I want** to connect the application to MongoDB Atlas and create the Subject data model with Mongoose,
**so that** we can persist subject data and establish database patterns for future collections.

**Acceptance Criteria:**

1. MongoDB Atlas cluster created (free tier M0)
2. Database connection string added to Vercel environment variables (`MONGODB_URI`)
3. Mongoose installed and configured with singleton connection pattern for serverless (lib/db/mongodb.ts)
4. Subject model created with schema: `{ name: String, level: 'lycée' | 'supérieur', description: String, createdAt: Date, updatedAt: Date }`
5. Connection pooling optimized for Vercel serverless (cached connection)
6. API route `/api/subjects` created with GET endpoint returning empty array initially
7. Cold start connection time tested and optimized (< 2s)
8. Error handling for database connection failures implemented
9. TypeScript types generated for Subject model
10. Successful database connection confirmed in Vercel deployment logs

#### Story 1.3: Subject Management UI for Lycée Level

**As a** user,
**I want** to create, view, and manage subjects for the Lycée level,
**so that** I can organize my pedagogical content by subject area.

**Acceptance Criteria:**

1. Landing page with "Lycée" and "Enseignement Supérieur" selection (modal or navigation)
2. After selecting "Lycée", dashboard displays with "Matières" section
3. "Create Subject" button opens modal/form with fields: Name, Description
4. Form validation: Name required (min 2 chars), Description optional
5. On submit, POST `/api/subjects` creates subject in MongoDB with `level: 'lycée'`
6. Subject list displays all Lycée subjects with cards/table showing Name and Description
7. Each subject card has "View" button navigating to `/lycee/[subjectId]`
8. Empty state displayed when no subjects exist with clear CTA to create first subject
9. Loading states during API calls (skeleton loaders or spinners)
10. Success feedback after subject creation (toast notification)
11. Subject creation flow tested end-to-end in Vercel preview deployment

#### Story 1.4: AI Service Abstraction Layer

**As a** developer,
**I want** to create a unified AI service interface supporting both Gemini and Claude,
**so that** content generation can seamlessly use either model with consistent API.

**Acceptance Criteria:**

1. Gemini SDK installed (`@google/generative-ai`) and configured
2. Claude SDK installed (`@anthropic-ai/sdk`) and configured
3. API keys added to Vercel environment variables (`GEMINI_API_KEY`, `ANTHROPIC_API_KEY`)
4. Abstract interface `AIService` defined in TypeScript: `generate(prompt: string, options: GenerateOptions): Promise<string>`
5. `GeminiService` implementation class with `generate()` method using Gemini 1.5 Pro
6. `ClaudeService` implementation class with `generate()` method using Claude 3.5 Sonnet
7. Factory function `getAIService(model: 'gemini' | 'claude'): AIService` created
8. Error handling for API failures, rate limits, and invalid responses
9. Retry logic implemented (3 attempts with exponential backoff)
10. Unit tests for service abstraction (mock AI responses)
11. Test API route `/api/test-ai` validates both services work in deployment

#### Story 1.5: Course Generation Workflow with Model Selection

**As a** user,
**I want** to generate a course by selecting a chapter and choosing between Gemini or Claude,
**so that** I can create pedagogical course content tailored to my specifications.

**Acceptance Criteria:**

1. Subject detail page (`/lycee/[subjectId]`) displays tabs: "Cours", "TD", "Contrôles"
2. "Cours" tab shows "Generate New Course" button
3. Course generation form includes:
   - Chapter number/title input (required)
   - Model selector: Radio buttons or dropdown (Gemini / Claude)
   - Optional constraints textarea
4. Content template for "Cours" created and stored (DB collection `contentTemplates` or config file)
5. On submit, POST `/api/generate/course` with payload: `{ subjectId, chapterTitle, model, constraints }`
6. API route constructs prompt using template + user inputs
7. AI service called with constructed prompt
8. Generated content saved to MongoDB `contents` collection with schema:
   ```
   {
     subjectId: ObjectId,
     type: 'course',
     chapterTitle: String,
     specifications: { constraints: String },
     versions: [{ model: 'gemini'|'claude', content: String, generatedAt: Date }],
     selectedVersion: String,
     status: 'draft',
     createdAt: Date
   }
   ```
9. After generation, user redirected to draft view (`/draft/[contentId]`)
10. Loading state during generation (progress indicator, estimated time)
11. Error handling for AI failures with user-friendly messages
12. Generated course displays in draft view with formatted content

#### Story 1.6: Draft Content Display and Basic Editing

**As a** user,
**I want** to view and edit the generated course draft,
**so that** I can refine the content before publishing to Notion.

**Acceptance Criteria:**

1. Draft view page (`/draft/[contentId]`) created
2. Page displays:
   - Subject name and chapter title (read-only header)
   - Model used badge (e.g., "Generated with Claude")
   - Content display area (formatted markdown or rich text)
   - Action toolbar: Edit, Regenerate, Publish, Delete buttons
3. Edit mode enables inline editing (Tiptap rich text editor)
4. Auto-save functionality with debouncing (save draft changes every 3 seconds of inactivity)
5. PUT `/api/contents/[id]` endpoint updates content in MongoDB
6. Visual indicator for save status (Saving... / Saved / Error)
7. "Cancel Edit" button reverts to last saved version
8. Content formatting preserved (paragraphs, lists, headings)
9. Draft badge clearly visible indicating unpublished status
10. Responsive layout for desktop and tablet viewing

#### Story 1.7: Notion Integration and Publish Workflow

**As a** user,
**I want** to publish my edited course draft to Notion,
**so that** the content becomes available for my students.

**Acceptance Criteria:**

1. Notion SDK installed (`@notionhq/client`) and configured
2. Notion API key and database ID added to Vercel environment variables
3. "Publish to Notion" button in draft view triggers publish workflow
4. POST `/api/publish/[contentId]` endpoint created
5. API route:
   - Fetches content from MongoDB
   - Formats content for Notion (markdown to Notion blocks conversion)
   - Creates Notion page in configured database
   - Stores `notionPageId` in MongoDB content document
   - Updates `status: 'published'` in MongoDB
6. Success response returns Notion page URL
7. After publish, draft view displays:
   - "Published" badge (green)
   - Link to Notion page ("View in Notion" button)
   - Publish button disabled/hidden
8. Notion page includes metadata: Subject name, Chapter title, Generation date, Model used
9. Rate limiting implemented (respect Notion 3 req/sec limit)
10. Error handling for Notion API failures with retry logic
11. Published content cannot be re-published (prevent duplicates)

#### Story 1.8: Regenerate with Alternate Model

**As a** user,
**I want** to regenerate a draft course using the other AI model,
**so that** I can replace unsatisfactory content with an alternative version.

**Acceptance Criteria:**

1. "Regenerate" button in draft view opens regeneration modal
2. Modal displays:
   - Current model used (e.g., "Currently: Gemini")
   - Option to select alternate model (e.g., "Regenerate with Claude")
   - Original specifications (chapter, constraints) pre-filled and editable
   - Confirm and Cancel buttons
3. On confirm, POST `/api/regenerate/[contentId]` with `{ model: 'claude' }`
4. API route:
   - Fetches existing content specifications from MongoDB
   - Calls alternate AI service with same prompt
   - Adds new version to `versions` array in content document
   - Updates `selectedVersion` to new model
   - Keeps status as 'draft'
5. After regeneration, draft view refreshes showing new content
6. Model badge updates to reflect new model
7. Previous version stored in `versions` array with `status: 'rejected'`
8. User can only regenerate drafts (not published content)
9. Loading state during regeneration
10. Error handling with option to retry

#### Story 1.9: Dual Model Comparison (Split View)

**As a** user,
**I want** to generate a course with both Gemini and Claude simultaneously and compare them side-by-side,
**so that** I can choose the best version before committing to editing.

**Acceptance Criteria:**

1. Course generation form includes checkbox: "Compare both models"
2. When checked, model selector is disabled/hidden
3. On submit with comparison enabled, POST `/api/generate/course` with `{ compareModels: true }`
4. API route:
   - Calls both Gemini and Claude services in parallel (Promise.all)
   - Saves content with two versions in `versions` array
   - Sets `status: 'comparing'` initially
5. After generation, redirect to comparison view (`/compare/[contentId]`)
6. Comparison view displays:
   - Split view layout: Gemini (left panel) | Claude (right panel)
   - Each panel shows formatted content
   - Panel headers: "Gemini 1.5 Pro" and "Claude 3.5 Sonnet" with badges
   - "Select This Version" button in each panel
7. Content scrolling synchronized between panels
8. Responsive layout: Stack vertically on mobile/small screens
9. Loading states handle scenarios where one model finishes before the other
10. Error handling if one model fails (display error + option to proceed with successful model only)

#### Story 1.10: Version Selection and Archival System

**As a** user,
**I want** to select my preferred version from the comparison view and archive the rejected version,
**so that** I can proceed with editing and publishing the chosen content.

**Acceptance Criteria:**

1. Clicking "Select This Version" on either panel in comparison view triggers selection
2. POST `/api/contents/[id]/select-version` with `{ selectedModel: 'gemini'|'claude' }`
3. API route updates MongoDB:
   - Sets `selectedVersion` to chosen model
   - Updates `status` from 'comparing' to 'draft'
   - Marks non-selected version in `versions` array with flag `rejected: true`
4. After selection, user redirected to draft view showing chosen version
5. Draft view displays "Version selected: Gemini" badge
6. Non-selected version archived but retrievable
7. User can access archived version via "View rejected version" link in draft
8. Archived version displays in read-only mode with:
   - "Rejected" badge
   - Option to "Promote to Draft" (swaps selected version)
   - Option to "Delete permanently"
9. Deleting rejected version removes it from `versions` array
10. Promoting rejected version swaps `selectedVersion` and updates rejection flags
11. Comparison view accessible from draft via "Compare again" if both versions still exist

---

### Epic 2: Advanced Content Generation with Context

**Epic Goal:**

Étendre le système de génération de contenu en ajoutant la création de TD (Travaux Dirigés) avec sélection contextuelle de cours existants, et implémenter le système de Contrôles avec leurs spécificités de rédaction. Les TD nécessitent de charger le contenu complet d'un cours comme contexte pour l'IA, avec support de fenêtres de tokens larges (Gemini 1M, Claude 200k). Le système de comparaison dual AI et de gestion de versions (draft, édition, comparaison, archivage, publication) s'applique à tous les types de contenu. À la fin de cet epic, un utilisateur peut créer un TD sur le Chapitre 2 de Droit en utilisant le cours du Chapitre 2 comme contexte, ajouter des contraintes créatives (ex: "enquête policière"), comparer les résultats Gemini/Claude, et publier vers Notion.

#### Story 2.1: TD Content Template and Data Model

**As a** developer,
**I want** to create the TD-specific content template and extend the data model to support course selection and contextual constraints,
**so that** TD generation can leverage course content as context and apply custom pedagogical angles.

**Acceptance Criteria:**

1. TD content template created with distinct pedagogical structure (stored in `contentTemplates` collection or config)
2. Template includes placeholders for: course context, chapter info, custom constraints
3. Content model extended to support TD-specific fields:
   ```typescript
   {
     type: 'td',
     specifications: {
       chapterTitle: String,
       linkedCourseId: ObjectId,  // Reference to course content
       constraints: String,        // Optional custom angle
     },
     contextUsed: String          // Snapshot of course content used
   }
   ```
4. API utility function `loadCourseContext(courseId): Promise<string>` created to fetch full course content
5. Function validates course exists and is published or draft (not rejected)
6. TypeScript types updated for TD-specific content structure
7. Database indexes added on `linkedCourseId` for fast lookups
8. Template formatting optimized for large context windows (Gemini 1M, Claude 200k)
9. Validation logic: TD can only be created if at least one course exists for the subject
10. Unit test for context loading function with mock data

#### Story 2.2: Course Selection Dropdown for TD Generation

**As a** user,
**I want** to select an existing course from a dropdown when creating a TD,
**so that** the AI can generate the TD based on the specific course content I want to focus on.

**Acceptance Criteria:**

1. "TD" tab in subject detail page displays "Generate New TD" button
2. TD generation form includes:
   - **Course/Chapter selector**: Dropdown populated with available courses for this subject
   - Model selector (Gemini / Claude / Compare both)
   - Optional constraints textarea with placeholder "e.g., 'Format as a police investigation'"
3. GET `/api/contents?subjectId=[id]&type=course` endpoint returns list of courses
4. Dropdown shows: "Chapter [X]: [Title]" with visual indicator if course is draft vs published
5. Form validation: Course selection required, constraints optional
6. Empty state if no courses exist: "Create a course first before generating TD" with link to Cours tab
7. Selected course preview shown below dropdown (first 200 chars of content + "View full course" link)
8. "View full course" opens modal/panel showing complete course content (read-only)
9. Responsive form layout matching WriterTool design patterns
10. Form state persists if user navigates away and returns (Zustand state)

#### Story 2.3: TD Generation with Course Context

**As a** user,
**I want** to generate a TD that incorporates the full content of a selected course,
**so that** the TD exercises are directly relevant and aligned with the course material.

**Acceptance Criteria:**

1. On TD form submit, POST `/api/generate/td` with payload:
   ```json
   {
     subjectId: ObjectId,
     linkedCourseId: ObjectId,
     constraints: String,
     model: 'gemini'|'claude',
     compareModels: boolean
   }
   ```
2. API route retrieves full course content via `loadCourseContext(linkedCourseId)`
3. Prompt constructed with structure:
   ```
   [TD Template]

   COURSE CONTEXT:
   [Full course content - up to 100k tokens]

   CHAPTER: [chapterTitle]
   CUSTOM CONSTRAINTS: [constraints or "None"]

   Generate TD following template guidelines...
   ```
4. Context snapshot saved in `contextUsed` field (for historical reference)
5. Generated TD saved with all metadata (linkedCourseId, specifications, versions)
6. Token usage logged for monitoring AI costs (console.log in dev, proper logging in prod)
7. Error handling for:
   - Course not found (404 response)
   - Context too large even for large models (prompt truncation with warning)
   - AI service failures
8. Loading indicator shows "Loading course context..." → "Generating TD with [Model]..."
9. After generation, redirect to draft view or comparison view based on `compareModels`
10. Generated TD quality validates course context was properly incorporated (manual QA check)

#### Story 2.4: Control Content Type Implementation

**As a** user,
**I want** to generate Contrôles (assessments) with their specific formatting and guidelines,
**so that** I can create evaluation materials distinct from courses and TDs.

**Acceptance Criteria:**

1. Contrôle content template created with specific assessment structure and guidelines
2. Template emphasizes: evaluation criteria, scoring rubrics, time constraints, difficulty balance
3. Content model supports Control-specific fields:
   ```typescript
   {
     type: 'control',
     specifications: {
       chapterTitle: String,
       linkedCourseIds: ObjectId[],  // Can reference multiple courses
       duration: Number,              // minutes
       constraints: String
     }
   }
   ```
4. "Contrôles" tab in subject detail page displays "Generate New Control" button
5. Control generation form includes:
   - Chapter/topic input
   - Multiple course selector (optional): "Base on courses: [multiselect dropdown]"
   - Duration input (minutes)
   - Model selector (Gemini / Claude / Compare both)
   - Constraints textarea
6. POST `/api/generate/control` endpoint created following same pattern as Course/TD
7. If courses selected, loads context from multiple courses (concatenated)
8. Prompt constructed using Control template + course contexts + specifications
9. Generated control saved with proper metadata and versioning
10. Control generation, draft, comparison, and publish workflows reuse existing components from Epic 1
11. Control badge/icon distinct in UI (e.g., 📋 vs 📖 for courses, 📝 for TDs)

#### Story 2.5: Unified Content List View per Subject

**As a** user,
**I want** to see all my generated content (Cours, TD, Contrôles) organized by tabs within each subject,
**so that** I can easily navigate and manage all content types for a given subject.

**Acceptance Criteria:**

1. Subject detail page displays three tabs: "Cours", "TD", "Contrôles"
2. Each tab shows:
   - List of content items for that type (card or table view)
   - "Generate New [Type]" button
   - Empty state if no content: "No [type] yet. Create your first one!"
3. Content cards display:
   - Chapter title
   - Status badge (Draft / Published / Comparing)
   - Model used (Gemini / Claude / Both)
   - Created date
   - Action buttons: View, Edit (if draft), Delete
4. Published items show "View in Notion" link with external icon
5. Draft items show "Continue Editing" button
6. Items in comparison state show "Complete Comparison" button
7. List sorted by creation date (newest first) with option to sort by chapter
8. Loading states for each tab (skeleton loaders)
9. Pagination or infinite scroll if > 20 items per type
10. Responsive layout: Card grid on desktop, stacked list on mobile
11. Delete action requires confirmation modal: "Delete [Chapter X Title]?"

#### Story 2.6: Cross-Content Type Comparison Support

**As a** user,
**I want** the comparison and version management system to work consistently across all content types (Cours, TD, Contrôles),
**so that** I can compare AI models regardless of what I'm generating.

**Acceptance Criteria:**

1. Comparison view (`/compare/[contentId]`) detects content type and adjusts UI labels
2. Split view works identically for all types: Cours, TD, Contrôles
3. Version selection logic unified: One `selectVersion` API endpoint handles all types
4. Draft editing with Tiptap works for all content types
5. Regeneration with alternate model available for all types
6. Notion publishing flow adapted per type:
   - Different Notion page templates for Cours vs TD vs Contrôles
   - Metadata includes content type in Notion page properties
7. Rejected version archival works uniformly across all types
8. Status badges (Draft/Published/Comparing/Rejected) consistent styling across types
9. Content type indicator visible throughout UI: Icon + label (e.g., "📖 Cours", "📝 TD", "📋 Contrôle")
10. Navigation breadcrumbs show: Subject > Content Type > Specific Item
11. All Epic 1 features (comparison, version selection, archival, editing, publish) validated for TD and Control types

#### Story 2.7: Custom Constraints Enhancement and Examples

**As a** user,
**I want** to see examples and suggestions for custom constraints when generating content,
**so that** I can better utilize the flexibility of AI generation and create more creative pedagogical materials.

**Acceptance Criteria:**

1. Constraints textarea in all generation forms includes:
   - Placeholder with example: "e.g., 'Format as a police investigation' or 'Use real-world case studies'"
   - "Show examples" link below textarea
2. Clicking "Show examples" reveals collapsible section with:
   - 5-7 constraint examples per content type (Cours, TD, Contrôle)
   - Examples categorized: Format-based, Tone-based, Difficulty-based, Theme-based
   - Click on example to auto-fill textarea (or append if not empty)
3. Examples stored in config/constants file (easy to update without code changes)
4. Examples for Cours: "Use storytelling approach", "Include historical context", "Focus on practical applications"
5. Examples for TD: "Case study analysis", "Group discussion format", "Problem-solving scenarios", "Police investigation theme"
6. Examples for Contrôle: "Multiple choice + essay", "Real-world application focus", "Progressive difficulty"
7. User can combine multiple examples (comma-separated or freeform)
8. Constraints properly passed to AI prompt in all generation flows
9. Generated content visibly reflects applied constraints (manual QA validation)
10. UI tooltip explaining: "Constraints guide the AI to customize the generation to your needs"

#### Story 2.8: Generation History and Recent Items Widget

**As a** user,
**I want** to see my recently generated content across all subjects and types,
**so that** I can quickly access my latest work without navigating through multiple subjects.

**Acceptance Criteria:**

1. Dashboard (after level selection) includes "Recent Content" widget
2. Widget displays last 5-10 generated items across all subjects
3. Each item shows:
   - Subject name
   - Content type icon + label (Cours/TD/Contrôle)
   - Chapter title
   - Status badge
   - Timestamp (relative: "2 hours ago")
   - Quick action link: "View" or "Continue editing"
4. GET `/api/contents/recent?level=lycée&limit=10` endpoint created
5. Query sorts by `createdAt` descending, filters by user's selected level (Lycée)
6. Empty state: "No content generated yet. Create your first subject!"
7. Widget refreshes when new content generated (Zustand state update or API refetch)
8. Clicking item navigates to appropriate view (draft/comparison/published)
9. "View All" link navigates to full history page (Epic 3 feature, placeholder for now)
10. Widget responsive: Horizontal scroll on mobile, grid on desktop

---

### Epic 3: Content History & Advanced Management

**Epic Goal:**

Construire un système complet de gestion et d'historique du contenu généré, permettant à l'utilisateur de consulter, filtrer, rechercher et gérer tous ses contenus (drafts, published, rejected versions) à travers tous les sujets et types. Améliorer l'expérience d'édition avec des fonctionnalités avancées de Tiptap, et implémenter un système de CRUD complet pour les versions archivées (consulter, promouvoir, supprimer individuellement ou en masse). À la fin de cet epic, un utilisateur peut consulter l'historique de tout son contenu pédagogique, nettoyer les versions rejetées dont il n'a plus besoin, et éditer ses drafts avec des outils d'édition riches et performants.

#### Story 3.1: Complete History View with Filters

**As a** user,
**I want** to view all my generated content across all subjects with comprehensive filtering options,
**so that** I can easily find and manage specific pieces of content.

**Acceptance Criteria:**

1. New route `/history` accessible from main navigation
2. History page displays all content items for selected level (Lycée or Supérieur)
3. GET `/api/contents/all?level=[level]` endpoint returns all content with metadata
4. Content displayed in table or card grid view with columns/fields:
   - Subject name
   - Content type (Cours/TD/Contrôle with icons)
   - Chapter/Title
   - Status (Draft/Published/Comparing/Rejected)
   - Model used (Gemini/Claude/Both)
   - Created date
   - Last modified date
   - Actions (View, Edit, Delete)
5. Filter panel includes:
   - **Subject filter**: Multiselect dropdown of all subjects
   - **Type filter**: Checkboxes (Cours, TD, Contrôles)
   - **Status filter**: Checkboxes (Draft, Published, Comparing, Rejected)
   - **Model filter**: Checkboxes (Gemini, Claude)
   - **Date range filter**: From/To date pickers
6. Filters applied client-side (Zustand state) or server-side (query params)
7. Active filters displayed as chips with X to remove individual filters
8. "Clear all filters" button
9. Filter state persists across page navigation (localStorage or URL params)
10. Empty state when no content matches filters: "No content found. Try adjusting filters."
11. Loading states with skeleton loaders
12. Responsive: Collapsible filter panel on mobile

#### Story 3.2: Search and Sort Functionality

**As a** user,
**I want** to search my content by keywords and sort results by different criteria,
**so that** I can quickly locate specific content without browsing through lists.

**Acceptance Criteria:**

1. Search bar at top of history page with placeholder: "Search by chapter, subject, or content..."
2. Search performs real-time filtering (debounced 300ms) across:
   - Chapter titles
   - Subject names
   - Content body (first 500 chars)
3. Search highlights matching terms in results (optional UX enhancement)
4. Sort dropdown with options:
   - Newest first (default)
   - Oldest first
   - Subject (A-Z)
   - Subject (Z-A)
   - Chapter/Title (A-Z)
   - Recently modified
5. Sort order persists with filter state
6. Combine search + filters: Results match both search terms AND active filters
7. Search query displayed in URL (`?search=droit`) for shareable links
8. Clear search button (X icon) in search bar
9. Search result count displayed: "Showing 15 results for 'droit'"
10. Empty state for no search results: "No content found for '[query]'. Try different keywords."
11. Search performance optimized (indexed fields in MongoDB if needed)

#### Story 3.3: Rejected Versions Management Interface

**As a** user,
**I want** to view, manage, and clean up all my rejected AI-generated versions,
**so that** I can keep my workspace organized and remove content I no longer need.

**Acceptance Criteria:**

1. History page includes "Show rejected versions" toggle (default: hidden)
2. When enabled, rejected versions appear in list with distinct styling:
   - Lighter opacity or muted colors
   - "Rejected" badge in red/orange
   - Label showing which model was rejected (e.g., "Rejected - Gemini")
3. Rejected items grouped with their parent content or shown inline with context
4. Each rejected version shows:
   - Original specifications (chapter, constraints)
   - Model used
   - Generation date
   - Parent content link (if selected version exists)
5. Actions available for rejected versions:
   - **View**: Opens read-only modal/page showing full content
   - **Promote to Draft**: Swaps with currently selected version
   - **Delete**: Removes permanently from database
6. "View" opens modal with:
   - Full rejected content (read-only, formatted)
   - Metadata (model, date, specifications)
   - Actions: Close, Promote, Delete
7. "Promote to Draft" triggers confirmation modal:
   - "This will replace the current draft with this rejected version. Continue?"
   - On confirm, POST `/api/contents/[id]/promote-version` with `versionIndex`
8. Promotion logic:
   - Current selected version marked as rejected
   - Promoted version becomes selected version
   - Status updated (if published, prompt user: "This content is published. Promoting will create a new draft. Unpublish first?")
9. Delete confirmation: "Permanently delete this rejected version? This cannot be undone."
10. Deleted versions removed from `versions` array in MongoDB
11. Bulk selection available for rejected versions (checkboxes)

#### Story 3.4: Bulk Actions for Content Management

**As a** user,
**I want** to perform actions on multiple content items or rejected versions at once,
**so that** I can efficiently manage large amounts of content.

**Acceptance Criteria:**

1. Checkbox selection available on all content items in history view
2. "Select all" checkbox in table/grid header
3. Selection count displayed: "X items selected"
4. Bulk action toolbar appears when items selected:
   - **Delete selected** (with confirmation)
   - **Change status** (draft ↔ unpublish if applicable in future)
   - **Export selected** (optional: export as JSON/CSV)
5. Specific bulk action for rejected versions: "Delete all rejected versions"
6. "Delete all rejected versions" button prominent when "Show rejected versions" enabled
7. Confirmation modal for bulk delete:
   - "Delete [X] rejected versions permanently?"
   - List first 5 items to be deleted with "...and [X] more"
   - Checkbox: "I understand this cannot be undone"
   - Confirm and Cancel buttons
8. DELETE `/api/contents/bulk-delete-rejected` endpoint
9. API validates all items are actually rejected before deletion
10. Progress indicator during bulk operations (e.g., "Deleting 3 of 10...")
11. Success feedback: "Successfully deleted [X] rejected versions"
12. Error handling: Partial failures reported ("Deleted 8 of 10. 2 failed: [reasons]")
13. Selection cleared after bulk action completes
14. Undo functionality (optional): Toast with "Undo" button for 10 seconds after bulk delete

#### Story 3.5: Enhanced Draft Editor with Advanced Tiptap Features

**As a** user,
**I want** advanced rich text editing capabilities in the draft editor,
**so that** I can format and refine my generated content with professional-quality tools.

**Acceptance Criteria:**

1. Tiptap editor initialized with extensions:
   - Bold, Italic, Underline, Strikethrough
   - Headings (H1-H4)
   - Bullet lists, Ordered lists
   - Blockquotes
   - Code blocks (inline and block)
   - Links (with edit/remove)
   - Horizontal rule
   - Text alignment (left, center, right, justify)
   - Undo/Redo
2. Floating toolbar appears on text selection (like Medium editor)
3. Slash commands for quick formatting: Type `/` to show command menu
4. Keyboard shortcuts displayed in tooltips (Ctrl+B for bold, etc.)
5. Editor toolbar at top with grouped buttons (formatting, lists, blocks, etc.)
6. Word count and character count displayed below editor
7. Auto-save indicator: "Saving..." → "Saved at [time]" → "All changes saved"
8. Auto-save triggers:
   - 3 seconds after last edit (debounced)
   - On blur (user clicks outside editor)
   - Before navigation (prompt if unsaved changes)
9. Version history (optional): Save snapshots every 5 minutes for recovery
10. Content validation before save: Ensure valid HTML/markdown structure
11. Editor theme matches app styling (WriterTool pattern)
12. Responsive: Editor adapts to screen size, mobile-friendly controls
13. Focus mode toggle: Hides sidebars for distraction-free editing
14. Export draft as Markdown or PDF (optional enhancement)

#### Story 3.6: Content Comparison Across Time

**As a** user,
**I want** to compare different versions of the same content (e.g., original generation vs edited draft),
**so that** I can see what changes I made and potentially revert if needed.

**Acceptance Criteria:**

1. Draft view includes "View Changes" button if content has been edited after generation
2. Clicking "View Changes" opens diff view showing:
   - Left panel: Original generated content
   - Right panel: Current edited draft
   - Highlighted differences (additions in green, deletions in red)
3. Diff algorithm applied (e.g., google-diff-match-patch or similar library)
4. Toggle between "Side-by-side" and "Inline" diff views
5. Diff view read-only (no editing, just comparison)
6. "Revert to original" button in diff view:
   - Confirmation: "Discard all edits and revert to original generation?"
   - On confirm, replaces draft content with original version content
7. Diff view also available for comparing rejected vs selected versions:
   - Access via "Compare with rejected version" link in draft view
8. Navigation breadcrumbs in diff view: Subject > Content > Comparison
9. Close button returns to draft editor
10. Diff rendering performant even for long documents (virtualization if needed)

#### Story 3.7: Advanced Content Metadata and Tagging

**As a** user,
**I want** to add custom tags and notes to my content,
**so that** I can organize and annotate my pedagogical materials beyond the basic subject/type structure.

**Acceptance Criteria:**

1. Content model extended with optional fields:
   ```typescript
   {
     tags: String[],        // Custom user tags
     notes: String,         // Private notes (not sent to Notion)
     difficulty: 'easy'|'medium'|'hard'  // Optional difficulty rating
   }
   ```
2. Draft and published content views include metadata section:
   - Tags input: Type and press Enter to add tag (chip-style display)
   - Notes textarea: Private annotations
   - Difficulty selector: Dropdown or radio buttons
3. Tags autocomplete from existing tags across all content
4. PUT `/api/contents/[id]/metadata` endpoint updates metadata fields
5. History view filters extended to include:
   - Tag filter: Multiselect from all existing tags
   - Difficulty filter: Checkboxes (Easy, Medium, Hard)
6. Tags displayed in content cards/rows in history view
7. Clicking a tag in history view applies it as filter
8. Notes visible only in detail/edit views (not in list views)
9. Metadata auto-saved along with content edits
10. Export functionality includes tags and notes in metadata
11. Tags and difficulty used for smart suggestions: "You might want to tag this as 'Constitutional Law'"

#### Story 3.8: Content Analytics and Usage Insights

**As a** user,
**I want** to see statistics and insights about my content generation patterns,
**so that** I can understand my usage and optimize my workflow.

**Acceptance Criteria:**

1. New `/analytics` route accessible from navigation
2. Analytics dashboard displays:
   - **Total content generated**: Count by type (Cours, TD, Contrôles)
   - **Content by subject**: Bar or pie chart showing distribution
   - **Model usage**: Gemini vs Claude usage percentage
   - **Status breakdown**: Draft vs Published vs Rejected counts
   - **Generation timeline**: Line graph showing content created over time
3. Filters to scope analytics:
   - Date range (Last 7 days, 30 days, 90 days, All time)
   - Level (Lycée, Supérieur, or both)
4. GET `/api/analytics?level=[level]&range=[range]` endpoint computes stats
5. Additional metrics:
   - **Average generation time** (if tracked)
   - **Most active subjects** (most content generated)
   - **Comparison usage**: How often user uses "Compare both models"
   - **Editing intensity**: Average number of edits per draft
6. Cost estimate (optional): Estimated AI API costs based on token usage
7. Export analytics as PDF or CSV report
8. Visual charts using Chart.js or similar library
9. Responsive: Charts adapt to screen size
10. Analytics refresh on page load (cached for 5 minutes to avoid excessive DB queries)
11. Empty state for new users: "Generate content to see analytics"

---

### Epic 4: Enseignement Supérieur & Production Polish

**Epic Goal:**

Étendre StudyMate pour supporter le niveau "Enseignement Supérieur" en dupliquant et adaptant toute la logique fonctionnelle développée pour le Lycée (gestion de matières, génération de contenus, comparaison IA, historique, etc.). Optimiser les performances de l'application pour un usage en production (cold starts serverless, caching intelligent, rate limiting), affiner l'UX globale avec des améliorations de navigation et d'accessibilité, et finaliser la documentation technique. À la fin de cet epic, StudyMate est une application complète et performante couvrant tous les niveaux d'enseignement de la Seconde au Master, prête pour un usage quotidien intensif.

#### Story 4.1: Enseignement Supérieur Level Implementation

**As a** user,
**I want** to select "Enseignement Supérieur" and manage subjects for university-level content,
**so that** I can organize my pedagogical materials for higher education separately from Lycée.

**Acceptance Criteria:**

1. Level selection screen includes both "Lycée" and "Enseignement Supérieur" options
2. Selection persists in session (Zustand store + localStorage)
3. All routes scoped by level: `/lycee/*` and `/superieur/*`
4. Subject creation for Supérieur level sets `level: 'supérieur'` in database
5. Subject dashboard filters subjects by selected level
6. Navigation shows current level indicator (breadcrumb or header badge)
7. User can switch levels via dropdown or dedicated UI element
8. Switching levels preserves any unsaved work (confirmation prompt if editing)
9. History and analytics views filtered by selected level
10. Empty state for Supérieur when first accessed: "No subjects yet for Enseignement Supérieur. Create your first one!"
11. All subject management features (create, view, delete) work identically for Supérieur
12. Notion integration distinguishes content level in page metadata

#### Story 4.2: Content Generation for Enseignement Supérieur

**As a** user,
**I want** to generate Cours, TD, and Contrôles for university-level subjects with the same workflow as Lycée,
**so that** I can create higher education content with full feature parity.

**Acceptance Criteria:**

1. All content types (Cours, TD, Contrôles) available for Supérieur subjects
2. Content templates optionally adapted for university context:
   - Higher academic rigor expected
   - More complex terminology
   - Research-oriented approaches
   - Optional: Separate templates for L1/L2/L3/M1/M2 levels
3. Dual AI comparison (Gemini/Claude) works identically for Supérieur content
4. Course context loading for TD generation works for Supérieur
5. All content specifications (chapter, constraints, duration) apply to Supérieur
6. Draft, comparison, version selection, and publish workflows identical to Lycée
7. Rejected version management works for Supérieur content
8. Tiptap editor with full features available for Supérieur drafts
9. Notion publishing creates pages in Supérieur-specific database or with level tag
10. Content isolation: Lycée and Supérieur content completely separated
11. History view correctly displays Supérieur content when level selected
12. All Epic 1-3 features validated for Enseignement Supérieur content

#### Story 4.3: Cross-Level Content Navigation and Quick Switching

**As a** user,
**I want** to quickly switch between Lycée and Enseignement Supérieur contexts,
**so that** I can manage both types of content efficiently in the same session.

**Acceptance Criteria:**

1. Persistent level switcher in main navigation (dropdown or toggle)
2. Switcher shows current level with icon/badge
3. Switching levels:
   - Navigates to appropriate dashboard (/lycee or /superieur)
   - Preserves filter/search state per level (separate Zustand stores)
   - Shows confirmation if editing content: "Switch levels? Any unsaved changes will be lost."
4. Recent content widget shows items for currently selected level only
5. Breadcrumbs always include level context: "Lycée > Droit > Cours"
6. Keyboard shortcut for level switch (e.g., Ctrl+Shift+L for Lycée, Ctrl+Shift+S for Supérieur)
7. Analytics page includes "Compare Levels" toggle to show both Lycée and Supérieur stats
8. URL structure reflects level: `/lycee/subjects/[id]` vs `/superieur/subjects/[id]`
9. Deep links work correctly: Sharing a Lycée subject link opens in Lycée context
10. Level context persists across browser sessions (localStorage)
11. Mobile responsive: Level switcher accessible in collapsed navigation menu

#### Story 4.4: Performance Optimization - Serverless Cold Starts

**As a** developer,
**I want** to minimize serverless cold start times on Vercel,
**so that** users experience fast response times even after periods of inactivity.

**Acceptance Criteria:**

1. MongoDB connection singleton pattern optimized:
   - Connection pooling implemented correctly
   - Connection reuse across invocations
   - Cached connection validated before reuse
2. Vercel Edge Functions evaluated for lightweight routes (e.g., `/api/subjects`)
3. API routes optimized:
   - Lazy loading of heavy dependencies (AI SDKs only when needed)
   - Tree-shaking configured to minimize bundle size
4. Cold start time measured and logged (target: < 2s for first request)
5. Warm-up endpoint `/api/health` created for periodic pinging if needed
6. Heavy computations moved to async background if possible (Vercel cron or queue)
7. Static assets (images, fonts) optimized and served via Vercel CDN
8. Next.js build optimized:
   - Code splitting configured properly
   - Unused dependencies removed
   - Build size analyzed (next-bundle-analyzer)
9. Performance monitoring added (console.time for key operations in dev)
10. Documentation created: "Performance Best Practices" for future development

#### Story 4.5: Intelligent Caching Strategy

**As a** developer,
**I want** to implement caching for frequently accessed data,
**so that** database queries are minimized and page load times are reduced.

**Acceptance Criteria:**

1. Subjects list cached client-side (Tanstack Query with staleTime: 5 minutes)
2. Recent content widget cached (staleTime: 2 minutes)
3. Content list per subject cached (staleTime: 3 minutes)
4. Cache invalidation triggers:
   - After creating/updating/deleting subject
   - After generating/editing/deleting content
   - After publishing to Notion
5. Server-side caching for heavy queries (optional: Redis or Vercel KV for session cache)
6. AI-generated content NOT cached (always fresh from DB)
7. Optimistic updates for mutations:
   - Subject creation shows immediately in list before API confirms
   - Content deletion removes from UI immediately with rollback on error
8. Cache strategy documented in technical docs
9. Cache hit/miss monitoring in development (console logs)
10. User-facing feedback: Loading indicators only on cache miss, instant display on cache hit
11. Notion page URLs cached after publish (avoid redundant API calls)

#### Story 4.6: Rate Limiting and API Protection

**As a** developer,
**I want** to implement rate limiting on AI generation and Notion API routes,
**so that** we prevent excessive costs and respect API limits.

**Acceptance Criteria:**

1. Rate limiting middleware installed (e.g., `next-rate-limit` or custom solution)
2. AI generation routes rate-limited:
   - `/api/generate/*`: Max 10 requests per minute per session
   - Error response: HTTP 429 "Too many generation requests. Please wait."
3. Notion publish routes rate-limited:
   - `/api/publish/*`: Max 3 requests per second (Notion limit)
   - Queue requests if burst exceeds limit
4. Rate limit counters stored in memory (or Vercel KV for multi-instance)
5. User-friendly error messages:
   - "Generating content too quickly. Please wait [X] seconds."
   - Toast notification with countdown timer
6. Admin bypass (optional): Environment variable to disable rate limits in development
7. Rate limit headers included in API responses (X-RateLimit-Remaining, X-RateLimit-Reset)
8. Logging for rate limit violations (track patterns for abuse or bugs)
9. Gradual backoff UI: Disable generate button temporarily after rate limit hit
10. Documentation: "API Rate Limits and Best Practices"

#### Story 4.7: UX Polish and Accessibility Improvements

**As a** user,
**I want** a refined and polished user interface with smooth interactions,
**so that** StudyMate feels professional and pleasant to use.

**Acceptance Criteria:**

1. Consistent spacing and typography across all pages (Tailwind config audit)
2. Loading states refined:
   - Skeleton loaders for content lists
   - Shimmer effect for placeholders
   - Spinner for quick operations (< 2s expected)
   - Progress bars for long operations (AI generation, bulk delete)
3. Transitions and animations:
   - Page transitions smooth (fade or slide)
   - Modal enter/exit animations
   - Button hover and active states
   - Dropdown animations
4. Toast notifications for all user actions:
   - Success: Green toast with checkmark
   - Error: Red toast with X icon
   - Info: Blue toast with info icon
   - Auto-dismiss after 5s with manual close option
5. Empty states with illustrations or icons (not just text)
6. Error boundaries implemented:
   - Catch React errors and show friendly message
   - "Something went wrong. Refresh the page or contact support."
   - Error logged to console for debugging
7. Form validation messages clear and helpful:
   - Inline validation (real-time feedback)
   - Error messages below fields in red
   - Success checkmarks for valid fields
8. Focus states visible for keyboard navigation (WCAG 2.1 compliance)
9. Color contrast meets WCAG AA standards (audit with tool)
10. Responsive design polish: Test on mobile, tablet, desktop
11. Dark mode support (optional but recommended for modern app)
12. Onboarding tooltip or tour for first-time users (optional)

#### Story 4.8: Error Handling and Resilience

**As a** user,
**I want** the application to gracefully handle errors and provide clear guidance,
**so that** I understand what went wrong and how to proceed.

**Acceptance Criteria:**

1. All API routes have try-catch blocks with proper error responses
2. Error response format standardized:
   ```json
   {
     "error": true,
     "message": "User-friendly error message",
     "code": "ERROR_CODE",
     "details": "Technical details (dev mode only)"
   }
   ```
3. Client-side error handling for common scenarios:
   - Network failures: "Connection lost. Please check your internet."
   - 404 Not Found: "Content not found. It may have been deleted."
   - 401/403 Auth errors (future-proofing): "Unauthorized access."
   - 500 Server errors: "Server error. Please try again or contact support."
4. AI service failures handled gracefully:
   - Retry logic (3 attempts with exponential backoff)
   - Fallback message: "AI service temporarily unavailable. Try again in a moment."
   - Option to switch model if one fails: "Claude failed. Try Gemini instead?"
5. Notion API failures handled:
   - Retry logic with rate limit awareness
   - Error messages: "Failed to publish to Notion. [Reason]. Retry?"
   - Content saved locally even if Notion publish fails (can retry later)
6. MongoDB connection failures:
   - Graceful degradation: "Database temporarily unavailable."
   - Auto-reconnect attempt after delay
7. Partial failure handling in bulk operations:
   - Report success count and failures separately
   - Option to retry only failed items
8. Error logging:
   - Console logs in development
   - Optional: Error tracking service (Sentry) for production
9. User guidance for errors:
   - "What happened" + "What to do next"
   - Contact/support link (even if personal app)
10. Offline detection: Banner when user loses internet connection

#### Story 4.9: Documentation and Technical Handoff

**As a** developer,
**I want** comprehensive technical documentation,
**so that** future development and maintenance are straightforward.

**Acceptance Criteria:**

1. README.md includes:
   - Project overview and purpose
   - Tech stack summary
   - Prerequisites (Node version, MongoDB Atlas, API keys)
   - Installation steps (clone, install, configure .env)
   - Development commands (dev, build, start, lint)
   - Deployment instructions (Vercel setup)
2. Environment variables documented:
   - `.env.example` file with all required variables
   - Comments explaining each variable
   - Instructions for obtaining API keys (Gemini, Claude, Notion)
3. Architecture documentation (docs/ARCHITECTURE.md):
   - High-level architecture diagram (frontend, API routes, MongoDB, external APIs)
   - Data models and relationships
   - Key workflows (content generation, comparison, publish)
   - Folder structure explanation
4. API documentation (docs/API.md):
   - All endpoints listed with method, path, description
   - Request/response examples
   - Error codes and meanings
5. Component documentation:
   - Key components documented with TSDoc comments
   - Props interfaces documented
   - Usage examples for complex components
6. Database schema documentation (docs/DATABASE.md):
   - All collections and fields
   - Indexes and their purpose
   - Sample documents
7. Deployment guide (docs/DEPLOYMENT.md):
   - Vercel setup step-by-step
   - MongoDB Atlas configuration
   - Environment variable setup in Vercel
   - Troubleshooting common deployment issues
8. Contributing guide (docs/CONTRIBUTING.md) if planning to share code
9. Changelog (CHANGELOG.md) tracking versions and changes
10. Inline code comments for complex logic (prompts, AI service abstraction, etc.)

#### Story 4.10: Final Testing and Production Readiness

**As a** developer,
**I want** to thoroughly test the application end-to-end,
**so that** StudyMate is stable and reliable for daily use.

**Acceptance Criteria:**

1. End-to-end testing checklist completed:
   - ✅ Create subject (Lycée and Supérieur)
   - ✅ Generate Cours with Gemini
   - ✅ Generate Cours with Claude
   - ✅ Compare both models for Cours
   - ✅ Select version from comparison
   - ✅ Edit draft with Tiptap
   - ✅ Publish to Notion (verify page created)
   - ✅ Generate TD with course context
   - ✅ Generate Contrôle
   - ✅ View history with filters
   - ✅ Search content
   - ✅ Manage rejected versions (view, promote, delete)
   - ✅ Bulk delete rejected versions
   - ✅ Switch between Lycée and Supérieur
   - ✅ View analytics
2. Cross-browser testing:
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)
3. Device testing:
   - Desktop (1920x1080, 1366x768)
   - Tablet (iPad, Android tablet)
   - Mobile (iPhone, Android phone)
4. Performance testing:
   - Page load times (target: < 3s on 3G)
   - AI generation time monitored (acceptable: 10-30s depending on model)
   - Cold start times (target: < 2s)
5. Load testing (optional for personal app, but good practice):
   - Simulate 10 concurrent requests to /api/generate
   - Verify rate limiting works
6. Security audit:
   - API keys not exposed in client-side code
   - Environment variables properly configured
   - No sensitive data in logs
   - HTTPS enforced on Vercel
7. Data validation:
   - All forms validate inputs correctly
   - Invalid data rejected by API
   - SQL/NoSQL injection prevented (Mongoose handles this)
8. Production deployment checklist:
   - All environment variables set in Vercel
   - MongoDB Atlas whitelisted Vercel IPs (or allow all for serverless)
   - Notion integration tested in production
   - AI APIs working in production
   - Domain configured (if applicable)
9. Monitoring setup:
   - Vercel analytics enabled
   - Error logging active (console or Sentry)
   - Cost monitoring for MongoDB, AI APIs
10. Final sign-off: Application tested and ready for daily use

---

## Checklist Results Report

### Executive Summary

**Overall PRD Completeness:** 92%

**MVP Scope Appropriateness:** Full-Featured (User explicitly requested "pas de MVP, propre direct")

**Readiness for Architecture Phase:** ✅ **READY**

**Most Critical Observation:** This is an exceptionally comprehensive PRD for a personal productivity tool. The "no MVP" approach means all features are in scope from day one, which is appropriate for a personal project where the user is both product owner and end user. Only minor documentation enhancements recommended.

### Category Analysis Table

| Category                         | Status  | Critical Issues                                    |
| -------------------------------- | ------- | -------------------------------------------------- |
| 1. Problem Definition & Context  | PASS    | None - Clear problem and user context              |
| 2. MVP Scope Definition          | PARTIAL | N/A - User chose full-featured approach over MVP   |
| 3. User Experience Requirements  | PASS    | None - Comprehensive UI goals and flows            |
| 4. Functional Requirements       | PASS    | None - FR1-FR19 comprehensive and testable         |
| 5. Non-Functional Requirements   | PASS    | None - Performance, security, reliability covered  |
| 6. Epic & Story Structure        | PASS    | None - Well-sequenced, properly sized stories      |
| 7. Technical Guidance            | PASS    | None - Clear stack and architectural decisions     |
| 8. Cross-Functional Requirements | PASS    | None - Data, integrations, operations documented   |
| 9. Clarity & Communication       | PASS    | None - Well-structured and clearly written         |

### Final Decision

✅ **READY FOR ARCHITECT**

**Summary:** The StudyMate PRD is comprehensive, well-structured, and provides clear guidance for the architecture phase. The requirements are detailed enough for implementation while avoiding over-specification. The epic and story structure is exemplary with logical sequencing and appropriate sizing.

**Confidence Level:** Very High (92%)

**Next Steps:**
1. Proceed to UX Expert for UI/UX design
2. Proceed to Architect for technical architecture design

---

## Next Steps

Le PRD StudyMate est maintenant complet et validé. Les prochaines étapes consistent à transformer ces exigences produit en spécifications techniques et design UX/UI détaillés.

### UX Expert Prompt

```
En tant qu'UX Expert, vous allez concevoir l'interface utilisateur de StudyMate, un hub de création de contenu pédagogique pour enseignants.

CONTEXTE:
- Application web responsive (Next.js 16 + React 19 + TailwindCSS + shadcn/ui)
- Pattern de design inspiré de WriterTool (moderne, épuré, professionnel)
- Utilisateur unique (enseignant créant du contenu de la Seconde au Master)
- Workflows complexes : génération IA, comparaison de modèles, édition, publication Notion

VOTRE MISSION:
1. Concevoir les wireframes et maquettes pour les 10+ écrans identifiés dans le PRD
2. Définir l'architecture de l'information et la navigation hiérarchique par onglets
3. Créer la bibliothèque de composants UI réutilisables (shadcn/ui)
4. Designer le workflow de comparaison split-view (Gemini vs Claude)
5. Concevoir l'interface d'édition de drafts avec Tiptap
6. Définir les patterns d'interaction (modals, dropdowns, toasts, loading states)
7. Assurer la cohérence visuelle avec WriterTool

LIVRABLES ATTENDUS:
- Design system complet (couleurs, typographie, espacements, composants)
- Wireframes basse fidélité pour tous les écrans
- Maquettes haute fidélité pour écrans critiques (génération, comparaison, édition)
- Prototypes interactifs pour workflows clés
- Guidelines d'interaction et d'animation

DOCUMENTS À CONSULTER:
- Ce PRD complet (sections UI Goals, Epics, Stories avec AC détaillés)
- WriterTool project summary (/Users/yukimurra/.gemini/antigravity/brain/e05385f4-f248-4125-b23c-49868dd5fd13/project_summary.md)

COMMENCEZ PAR:
Lire le PRD section "User Interface Design Goals" et les acceptance criteria des stories Epic 1-4 pour comprendre tous les écrans et interactions requis.
```

### Architect Prompt

```
En tant qu'Architect, vous allez concevoir l'architecture technique complète de StudyMate, un hub de création de contenu pédagogique.

CONTEXTE:
- Stack: Next.js 16 (App Router) + TypeScript + MongoDB Atlas + Vercel (serverless)
- AI: Dual integration Gemini 1.5 Pro + Claude 3.5 Sonnet avec abstraction
- Intégrations: Notion API (@notionhq/client)
- Patterns: Monorepo, API Routes, Zustand state management, Tiptap editor

VOTRE MISSION:
1. Concevoir les schémas MongoDB (Subjects, Contents avec versioning, ContentTemplates)
2. Définir l'architecture des API Routes Next.js (/api/generate, /api/publish, etc.)
3. Créer le système d'abstraction AI (AIService interface + GeminiService + ClaudeService)
4. Concevoir le système de versioning de contenu (draft/published/rejected/comparing)
5. Optimiser pour Vercel serverless (cold starts, connection pooling, caching)
6. Définir la stratégie de gestion des erreurs et retry logic
7. Planifier l'intégration Notion avec rate limiting
8. Concevoir le système de templates de prompts IA

CONTRAINTES TECHNIQUES:
- Vercel serverless: Cold starts, 60s timeout, connection pooling requis
- MongoDB Atlas: Free tier M0, optimiser connexions serverless
- AI APIs: Coûts tokens, rate limiting, fenêtres contexte larges (1M Gemini, 200k Claude)
- Notion API: 3 req/sec max
- Scalabilité: Architecture modulaire pour ajouter types de contenu facilement

LIVRABLES ATTENDUS:
- Diagramme d'architecture (frontend, API routes, DB, external APIs)
- Schémas MongoDB avec indexes et relations
- Définition des API endpoints (request/response, error codes)
- Architecture du système de versioning et draft management
- Stratégie d'optimisation Vercel (caching, code splitting, connection pooling)
- Design patterns pour abstraction AI et templates de prompts
- Plan de gestion des erreurs et résilience
- Documentation technique (ARCHITECTURE.md, DATABASE.md, API.md)

DOCUMENTS À CONSULTER:
- Ce PRD complet (sections Technical Assumptions, tous les Epics avec stories détaillées)
- WriterTool project summary pour comprendre les patterns établis

POINTS D'ATTENTION:
- Epic 1 Story 1.4: Design de l'abstraction AI (critical)
- Epic 1 Story 1.2: MongoDB connection singleton pour serverless (critical)
- Epic 2 Story 2.3: Chargement de cours complet en contexte (large tokens)
- Epic 3 Story 3.5: Intégration Tiptap avec auto-save
- Epic 4 Stories 4.4-4.6: Optimisations performance (cold starts, caching, rate limiting)

COMMENCEZ PAR:
Lire le PRD section "Technical Assumptions" et analyser les acceptance criteria de toutes les stories Epic 1-4 pour comprendre les exigences techniques détaillées.
```

---

**End of PRD**
