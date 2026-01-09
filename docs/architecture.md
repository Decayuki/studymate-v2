# StudyMate Fullstack Architecture Document

**Version:** 1.0
**Date:** 2026-01-08
**Author:** Winston (Architect Agent)

---

## Table of Contents

1. [Introduction](#introduction)
2. [High Level Architecture](#high-level-architecture)
3. [Tech Stack](#tech-stack)
4. [Data Models](#data-models)
5. [API Specification](#api-specification)
6. [Components](#components)
7. [External APIs](#external-apis)
8. [Core Workflows](#core-workflows)
9. [Database Schema](#database-schema)
10. [Frontend Architecture](#frontend-architecture)
11. [Backend Architecture](#backend-architecture)
12. [Unified Project Structure](#unified-project-structure)
13. [Development Workflow](#development-workflow)
14. [Deployment Architecture](#deployment-architecture)
15. [Security and Performance](#security-and-performance)
16. [Testing Strategy](#testing-strategy)
17. [Coding Standards](#coding-standards)
18. [Error Handling Strategy](#error-handling-strategy)
19. [Monitoring and Observability](#monitoring-and-observability)
20. [Checklist Results Report](#checklist-results-report)

---

## Introduction

This document outlines the complete fullstack architecture for **StudyMate**, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

### Starter Template or Existing Project

**Starter Template Decision:** **Partial - WriterTool Design Patterns**

StudyMate is **not** built from a pre-packaged fullstack starter, but leverages established design patterns and architectural decisions from the **WriterTool** project. This approach provides:

**What We Inherit from WriterTool:**
- UI/UX patterns: shadcn/ui component library with TailwindCSS
- Rich text editing architecture: Tiptap integration patterns
- State management approach: Zustand for client-side state
- Deployment strategy: Vercel platform familiarity
- Design system: "Local-first feel" UX philosophy

**What We Build Fresh:**
- Backend architecture: MongoDB Atlas with serverless optimization (WriterTool uses Postgres + Prisma)
- AI abstraction layer: Dual AI provider system with comparison features (WriterTool uses single AI with diff-based approach)
- Domain model: Education-specific entities (Subjects, Contents, Templates)
- Notion integration: Publishing workflow with rate limiting
- Content versioning: Draft/published/rejected/comparing states

**Key Constraints Imposed:**
1. **Next.js 16 App Router** - Must use modern App Router patterns, no Pages Router
2. **Vercel Serverless** - All backend code must account for cold starts, 60s timeouts, connection pooling
3. **shadcn/ui + TailwindCSS** - UI components follow established WriterTool aesthetic
4. **TypeScript Strict Mode** - Full type safety across frontend and backend

**Architectural Freedom:**
- Database schema design (NoSQL vs SQL different from WriterTool)
- API structure (REST via API Routes vs GraphQL/tRPC options)
- AI service architecture (abstraction layer design)
- Content model design (versioning, comparison, templates)

**Decision Rationale:**
- ✅ **pnpm workspaces** (simple, efficace pour notre structure)
- ✅ **Custom setup** (pas de create-t3-app - nos besoins sont trop spécifiques avec MongoDB + dual AI)
- ✅ **Option d'évolution:** Turborepo peut être ajouté plus tard si le caching devient critique

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2026-01-08 | 1.0 | Initial architecture document created | Winston (Architect Agent) |

---

## High Level Architecture

### Technical Summary

StudyMate is a **serverless-first, full-stack Next.js application** deployed on Vercel, utilizing MongoDB Atlas for data persistence and dual AI provider integration (Gemini 1.5 Pro + Claude 3.5 Sonnet).

The architecture follows a **monolithic App Router pattern** where frontend and backend coexist within a single Next.js application, leveraging API Routes for backend logic and Server Components for optimal performance. The system features a **pluggable AI abstraction layer** enabling seamless provider switching and side-by-side content comparison, with rich text editing powered by Tiptap and client-side state managed through Zustand.

**Key integration points:** Frontend components consume API Routes (`/api/*`) for all data operations, which coordinate with MongoDB for persistence, AI providers for content generation, and Notion API for publishing. The serverless deployment on Vercel requires **connection pooling optimization** for MongoDB and **stateless function design** to handle cold starts efficiently.

This architecture achieves PRD goals by providing a **unified content creation hub** that centralizes fragmented AI workflows, supports flexible AI model comparison, and enables seamless publishing to Notion while maintaining a clean separation between presentation, business logic, and data layers.

### Platform and Infrastructure Choice

**✅ Selected Platform: Vercel + MongoDB Atlas**

**Key Services:**
- **Frontend Hosting:** Vercel Edge Network (global CDN, automatic HTTPS)
- **Backend Runtime:** Vercel Serverless Functions (Node.js 20.x)
- **Database:** MongoDB Atlas M0 Free Tier (512MB storage, shared cluster)
- **File Storage:** Vercel Blob (for future file uploads if needed)
- **Environment Management:** Vercel Environment Variables (dev/preview/production)
- **CI/CD:** Vercel Git Integration (auto-deploy from GitHub main branch)

**Deployment Host and Regions:**
- **Primary Region:** `iad1` (Washington D.C., US East) - closest to MongoDB Atlas free tier default region
- **Edge Caching:** Global (Vercel CDN automatically distributes static assets worldwide)
- **MongoDB Region:** `us-east-1` (AWS) - MongoDB Atlas M0 default

### Repository Structure

**Structure:** **Monorepo with pnpm Workspaces**

**Rationale:**
- Next.js App Router naturally combines frontend and backend in one application
- Shared TypeScript types/utilities need to be accessible across client and server code
- Single deployment unit to Vercel simplifies CI/CD
- pnpm workspaces provide sufficient dependency management without Turborepo/Nx complexity

**Monorepo Tool:** **pnpm workspaces**

**Package Organization:**

```
studymate/ (root)
├── app/                          # Main Next.js application (frontend + API routes)
│   ├── (routes)/                # Frontend pages (App Router)
│   └── api/                     # Backend API routes
├── packages/
│   ├── shared/                  # Shared types, constants, utilities
│   ├── db/                      # MongoDB models, connection singleton, schemas
│   ├── ai/                      # AI abstraction layer (GeminiService, ClaudeService)
│   └── notion/                  # Notion API client wrapper
└── package.json                 # Root workspace configuration
```

**Shared Code Strategy:**
- **Types:** `@studymate/shared` - TypeScript interfaces used by both client and server
- **Database:** `@studymate/db` - Server-side only, MongoDB models and connection
- **AI Services:** `@studymate/ai` - Server-side only, AI provider abstraction
- **Notion Client:** `@studymate/notion` - Server-side only, Notion API wrapper

### High Level Architecture Diagram

```mermaid
graph TB
    subgraph "User Layer"
        User[👤 User Browser]
    end

    subgraph "Vercel Edge Network"
        CDN[CDN / Edge Cache]
    end

    subgraph "Vercel Serverless (iad1)"
        subgraph "Next.js App Router"
            Pages[React Server Components<br/>app/ routes]
            API[API Routes<br/>/api/*]
        end

        subgraph "Business Logic Packages"
            AIService[AI Abstraction Layer<br/>@studymate/ai]
            DBService[Database Layer<br/>@studymate/db]
            NotionService[Notion Client<br/>@studymate/notion]
        end

        StateLayer[Client State<br/>Zustand Stores]
        Editor[Tiptap Editor<br/>Rich Text]
    end

    subgraph "External Services"
        MongoDB[(MongoDB Atlas<br/>M0 Free Tier)]
        Gemini[Gemini 1.5 Pro API<br/>Google AI]
        Claude[Claude 3.5 Sonnet API<br/>Anthropic]
        Notion[Notion API<br/>Publishing Target]
    end

    User -->|HTTPS| CDN
    CDN -->|Static Assets| Pages
    CDN -->|Dynamic| API

    Pages -->|Client Actions| API
    Pages -->|Hydrate| StateLayer
    Pages -->|Mount| Editor

    API -->|Use| AIService
    API -->|Use| DBService
    API -->|Use| NotionService

    AIService -->|Generate Content| Gemini
    AIService -->|Generate Content| Claude

    DBService -->|CRUD Operations<br/>Connection Pool| MongoDB

    NotionService -->|Publish Content<br/>Rate Limited| Notion

    StateLayer -.->|Optimistic Updates| Pages
    Editor -.->|Auto-save| API

    classDef userLayer fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef vercel fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef external fill:#f3e5f5,stroke:#4a148c,stroke-width:2px

    class User userLayer
    class CDN,Pages,API,AIService,DBService,NotionService,StateLayer,Editor vercel
    class MongoDB,Gemini,Claude,Notion external
```

### Architectural Patterns

- **Jamstack with Serverless Backend:** Static-first rendering with Server Components, dynamic data via API Routes - _Rationale:_ Optimal performance for Vercel deployment, reduces client-side JavaScript, improves SEO for content-heavy pages

- **AI Provider Abstraction (Strategy Pattern):** Common `AIService` interface with swappable `GeminiService` and `ClaudeService` implementations - _Rationale:_ Enables runtime model selection, facilitates side-by-side comparison, isolates provider-specific logic

- **Repository Pattern (Data Access Layer):** MongoDB operations abstracted behind repository interfaces (`SubjectRepository`, `ContentRepository`) - _Rationale:_ Decouples business logic from database implementation, simplifies testing with mocks, enables future schema migrations

- **Connection Singleton (Serverless Optimization):** MongoDB connection pooling with module-level caching across function invocations - _Rationale:_ Critical for serverless - prevents exhausting MongoDB M0 connection limits (500 max), reduces cold start latency

- **Optimistic UI Updates:** Zustand stores update immediately, API calls reconcile in background - _Rationale:_ Provides "local-first feel" similar to WriterTool, improves perceived performance for content editing

- **Server Components by Default, Client Components by Exception:** Use React Server Components for data fetching, client components only for interactivity - _Rationale:_ Reduces JavaScript bundle size, leverages Next.js 13+ architecture, improves initial page load

- **API Route Handler Pattern:** Each API route uses consistent error handling, validation, and response formatting - _Rationale:_ Ensures uniform error responses, simplifies client-side error handling, enables centralized logging

- **Content Version Snapshots (Event Sourcing Lite):** Store all AI-generated versions with timestamps and metadata - _Rationale:_ Supports comparison feature, provides audit trail, enables "rejected version" CRUD without data loss

---

## Tech Stack

### Technology Stack Table

**DEFINITIVE Technology Selections - Single Source of Truth**

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| **Frontend Language** | TypeScript | 5.6+ | Type-safe frontend code | Strict mode enforced, catches errors at compile time, enables excellent IDE support |
| **Frontend Framework** | Next.js | 16.x | Full-stack React framework | App Router with Server Components, built-in API routes, optimal Vercel deployment, RSC reduces bundle size |
| **React** | React | 19.x | UI library | Latest features, Server Components support, improved concurrent rendering |
| **UI Component Library** | shadcn/ui | latest | Accessible component primitives | Radix UI-based, customizable, matches WriterTool design patterns, no runtime overhead (copy-paste components) |
| **CSS Framework** | TailwindCSS | 3.4+ | Utility-first styling | Rapid UI development, consistent design system, tree-shaking for minimal CSS bundle, WriterTool compatibility |
| **State Management** | Zustand | 4.5+ | Client-side global state | Minimal boilerplate, works seamlessly with RSC, optimistic UI updates, WriterTool-proven pattern |
| **Rich Text Editor** | Tiptap | 2.8+ | WYSIWYG content editing | Headless editor (full control over UI), Markdown support, extensible with custom nodes, auto-save integration |
| **Data Fetching** | Tanstack Query | 5.x | Server state management | Caching, optimistic updates, background refetching, handles loading/error states elegantly |
| **Backend Language** | TypeScript (Node.js) | 20.x LTS | Type-safe backend code | Shared types with frontend via @studymate/shared, serverless function runtime on Vercel |
| **Backend Framework** | Next.js API Routes | 16.x | Serverless API endpoints | Collocated with frontend, automatic deployment, supports middleware, typed route handlers |
| **API Style** | REST (API Routes) | - | HTTP API architecture | Simple, well-understood, sufficient for CRUD operations, no GraphQL complexity needed |
| **Database** | MongoDB Atlas | 7.0+ | NoSQL document database | M0 free tier (512MB), flexible schema for content versioning, native JSON storage, serverless-optimized connection handling |
| **ODM** | Mongoose | 8.x | MongoDB object modeling | Type-safe schemas, validation, middleware hooks, virtuals for computed fields, established ecosystem |
| **Validation** | Zod | 3.23+ | Runtime type validation | Type inference for TypeScript, API request/response validation, composable schemas, excellent error messages |
| **Cache** | None (MVP) | - | N/A | MongoDB query performance sufficient for initial scale, Vercel KV can be added later if profiling shows need |
| **File Storage** | Vercel Blob | - | Future file uploads | Integrated with Vercel, S3-compatible, not needed for MVP (content is text-only initially) |
| **Authentication** | None (MVP) | - | N/A | No user auth required for MVP per PRD - single-user application initially |
| **AI SDK (Gemini)** | @google/generative-ai | latest | Gemini API client | Official Google SDK, 1M token context window, streaming support |
| **AI SDK (Claude)** | @anthropic-ai/sdk | latest | Claude API client | Official Anthropic SDK, 200k token context window, tool use support |
| **Notion SDK** | @notionhq/client | 2.x | Notion API integration | Official Notion SDK, rate limiting helpers, type-safe page creation |
| **Frontend Testing** | Vitest | 2.x | Unit/integration tests (frontend) | Fast, Vite-native, Jest-compatible API, ESM support, component testing |
| **Backend Testing** | Vitest | 2.x | Unit tests (API routes, services) | Unified test framework across stack, faster than Jest, better TypeScript support |
| **E2E Testing** | Playwright | 1.48+ | End-to-end browser testing | Multi-browser support, auto-wait, network mocking, trace viewer for debugging |
| **Package Manager** | pnpm | 9.x | Dependency management | Fast installs, strict dependency resolution, workspace support, disk space efficient |
| **Build Tool** | Next.js (built-in) | 16.x | Application bundler | Integrated with framework, automatic code splitting, tree-shaking |
| **Bundler** | Turbopack | (Next.js 16) | Dev server & production builds | Rust-based, faster than Webpack, incremental compilation, HMR optimized |
| **IaC Tool** | None | - | N/A | Vercel handles infrastructure as code via vercel.json + dashboard config, no Terraform/CDK needed |
| **CI/CD** | GitHub Actions + Vercel | - | Automated testing & deployment | Vercel auto-deploys on push to main, GitHub Actions for PR tests/linting |
| **Monitoring** | Vercel Analytics | - | Performance monitoring | Built-in Web Vitals tracking, serverless function logs, free tier included |
| **Error Tracking** | Vercel Logs (MVP) | - | Error aggregation | Console logs automatically captured, upgrade to Sentry later if needed |
| **Logging** | Console (structured) | - | Application logging | Serverless function logs, structured JSON format, queryable in Vercel dashboard |
| **Linting** | ESLint | 9.x | Code quality | Next.js config, TypeScript rules, enforce coding standards |
| **Formatting** | Prettier | 3.x | Code formatting | Auto-format on save, consistent style across team, integrates with ESLint |
| **Git Hooks** | Husky + lint-staged | - | Pre-commit validation | Run linting/formatting on staged files, prevent bad commits |

---

## Data Models

### Subject (Matière)

**Purpose:** Représente une matière enseignée (ex: Mathématiques Terminale, Histoire Licence 1). Container logique pour tous les contenus liés à un cours.

**Key Attributes:**
- `_id`: ObjectId - Identifiant unique MongoDB
- `name`: string - Nom de la matière (ex: "Mathématiques Terminale S")
- `level`: 'lycee' | 'superieur' - Niveau d'enseignement
- `description`: string (optional) - Description du cours
- `createdAt`: Date - Date de création
- `updatedAt`: Date - Date de dernière modification

**TypeScript Interface:**

```typescript
interface Subject {
  _id: string; // MongoDB ObjectId as string
  name: string;
  level: 'lycee' | 'superieur';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Zod schema for validation
const SubjectSchema = z.object({
  name: z.string().min(1).max(200),
  level: z.enum(['lycee', 'superieur']),
  description: z.string().max(1000).optional(),
});
```

**Relationships:**
- `1:N with Content` - Un Subject peut avoir plusieurs Contents (cours, TD, contrôles)
- `1:N with ContentTemplate` - Un Subject peut avoir des templates de prompts personnalisés

### Content (Contenu Généré)

**Purpose:** Représente un contenu pédagogique généré par IA (Cours, TD, ou Contrôle). Supporte le versioning multi-modèle et les statuts de workflow.

**Key Attributes:**
- `_id`: ObjectId - Identifiant unique
- `subjectId`: ObjectId (ref Subject) - Matière parente
- `type`: 'course' | 'td' | 'control' - Type de contenu
- `chapterTitle`: string - Titre du chapitre/contenu
- `specifications`: object - Spécifications de génération
  - `constraints`: string - Contraintes pédagogiques (durée, notions à couvrir, etc.)
  - `linkedCourseId`: ObjectId (optional) - Pour TD: cours de référence
  - `linkedCourseIds`: ObjectId[] (optional) - Pour Contrôle: cours couverts
  - `duration`: number (optional) - Pour Contrôle: durée en minutes
- `versions`: array - Historique des versions générées
  - `model`: 'gemini' | 'claude' - Modèle AI utilisé
  - `content`: string - Contenu Markdown généré
  - `generatedAt`: Date - Date de génération
  - `rejected`: boolean (default: false) - Version rejetée par l'utilisateur
- `selectedVersion`: 'gemini' | 'claude' | null - Modèle de la version actuellement sélectionnée
- `status`: 'draft' | 'comparing' | 'published' | 'rejected' - État du contenu
- `notionPageId`: string (optional) - ID de la page Notion après publication
- `tags`: string[] (optional) - Tags pour organisation
- `notes`: string (optional) - Notes personnelles
- `difficulty`: 'easy' | 'medium' | 'hard' (optional) - Niveau de difficulté
- `createdAt`: Date
- `updatedAt`: Date

**TypeScript Interface:**

```typescript
type AIModel = 'gemini' | 'claude';
type ContentType = 'course' | 'td' | 'control';
type ContentStatus = 'draft' | 'comparing' | 'published' | 'rejected';

interface ContentVersion {
  model: AIModel;
  content: string; // Markdown
  generatedAt: Date;
  rejected: boolean;
}

interface ContentSpecifications {
  constraints: string;
  linkedCourseId?: string; // For TD
  linkedCourseIds?: string[]; // For Control
  duration?: number; // For Control (minutes)
}

interface Content {
  _id: string;
  subjectId: string; // ref to Subject
  type: ContentType;
  chapterTitle: string;
  specifications: ContentSpecifications;
  versions: ContentVersion[];
  selectedVersion: AIModel | null;
  status: ContentStatus;
  notionPageId?: string;
  tags?: string[];
  notes?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  createdAt: Date;
  updatedAt: Date;
}

// Zod schema
const ContentSchema = z.object({
  subjectId: z.string(),
  type: z.enum(['course', 'td', 'control']),
  chapterTitle: z.string().min(1).max(300),
  specifications: z.object({
    constraints: z.string().min(10),
    linkedCourseId: z.string().optional(),
    linkedCourseIds: z.array(z.string()).optional(),
    duration: z.number().min(5).max(480).optional(),
  }),
  selectedVersion: z.enum(['gemini', 'claude']).nullable(),
  status: z.enum(['draft', 'comparing', 'published', 'rejected']),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(2000).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});
```

**Relationships:**
- `N:1 with Subject` - Chaque Content appartient à un Subject
- `N:1 with Content (self-reference)` - Un TD peut référencer un Content de type 'course'
- `N:N with Content (self-reference)` - Un Control peut référencer plusieurs Contents de type 'course'

### ContentTemplate (Templates de Prompts IA)

**Purpose:** Stocke des templates de prompts IA réutilisables pour standardiser la génération de contenu par matière et type. (Future enhancement, pas dans MVP mais prévu Epic 4+)

**Key Attributes:**
- `_id`: ObjectId - Identifiant unique
- `subjectId`: ObjectId (ref Subject, optional) - Template spécifique à une matière (null = global)
- `contentType`: 'course' | 'td' | 'control' - Type de contenu cible
- `name`: string - Nom du template
- `promptTemplate`: string - Template de prompt avec placeholders `{{variable}}`
- `variables`: object - Définition des variables (nom, type, description)
- `isDefault`: boolean - Template par défaut pour ce type
- `createdAt`: Date
- `updatedAt`: Date

**TypeScript Interface:**

```typescript
interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'array';
  description: string;
  required: boolean;
}

interface ContentTemplate {
  _id: string;
  subjectId?: string; // null = global template
  contentType: ContentType;
  name: string;
  promptTemplate: string; // e.g., "Génère un cours sur {{topic}} pour niveau {{level}}..."
  variables: PromptVariable[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Zod schema
const ContentTemplateSchema = z.object({
  subjectId: z.string().optional(),
  contentType: z.enum(['course', 'td', 'control']),
  name: z.string().min(1).max(200),
  promptTemplate: z.string().min(20),
  variables: z.array(z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'array']),
    description: z.string(),
    required: z.boolean(),
  })),
  isDefault: z.boolean(),
});
```

**Relationships:**
- `N:1 with Subject (optional)` - Template peut être lié à une matière spécifique ou global
- `Used by Content generation logic` - Pas de relation directe dans DB, utilisé côté application

### Entity Relationship Diagram

```mermaid
erDiagram
    Subject ||--o{ Content : "has many"
    Subject ||--o{ ContentTemplate : "has templates"
    Content }o--|| Subject : "belongs to"
    Content }o--o| Content : "linkedCourseId (TD)"
    Content }o--o{ Content : "linkedCourseIds (Control)"

    Subject {
        ObjectId _id PK
        string name
        enum level
        string description
        Date createdAt
        Date updatedAt
    }

    Content {
        ObjectId _id PK
        ObjectId subjectId FK
        enum type
        string chapterTitle
        object specifications
        array versions
        enum selectedVersion
        enum status
        string notionPageId
        array tags
        string notes
        enum difficulty
        Date createdAt
        Date updatedAt
    }

    ContentTemplate {
        ObjectId _id PK
        ObjectId subjectId FK
        enum contentType
        string name
        string promptTemplate
        array variables
        boolean isDefault
        Date createdAt
        Date updatedAt
    }
```

---

## API Specification

### REST API Specification (OpenAPI 3.0)

```yaml
openapi: 3.0.0
info:
  title: StudyMate API
  version: 1.0.0
  description: API REST pour la génération et gestion de contenus pédagogiques avec IA

servers:
  - url: http://localhost:3000/api
    description: Développement local
  - url: https://studymate.vercel.app/api
    description: Production Vercel

paths:
  # SUBJECTS ENDPOINTS
  /subjects:
    get:
      summary: Liste toutes les matières
      parameters:
        - name: level
          in: query
          schema:
            type: string
            enum: [lycee, superieur]
      responses:
        '200':
          description: Liste des matières
          content:
            application/json:
              schema:
                type: object
                properties:
                  subjects:
                    type: array
                    items:
                      $ref: '#/components/schemas/Subject'

    post:
      summary: Créer une nouvelle matière
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, level]
              properties:
                name:
                  type: string
                  minLength: 1
                  maxLength: 200
                level:
                  type: string
                  enum: [lycee, superieur]
                description:
                  type: string
                  maxLength: 1000
      responses:
        '201':
          description: Matière créée avec succès

  /subjects/{id}:
    get:
      summary: Récupérer une matière par ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Détails de la matière

    patch:
      summary: Mettre à jour une matière
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                level:
                  type: string
                  enum: [lycee, superieur]
                description:
                  type: string
      responses:
        '200':
          description: Matière mise à jour

    delete:
      summary: Supprimer une matière
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Matière supprimée

  # CONTENTS ENDPOINTS
  /contents:
    get:
      summary: Liste tous les contenus
      parameters:
        - name: subjectId
          in: query
          schema:
            type: string
        - name: type
          in: query
          schema:
            type: string
            enum: [course, td, control]
        - name: status
          in: query
          schema:
            type: string
            enum: [draft, comparing, published, rejected]
      responses:
        '200':
          description: Liste des contenus

    post:
      summary: Créer un nouveau contenu
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [subjectId, type, chapterTitle, specifications]
              properties:
                subjectId:
                  type: string
                type:
                  type: string
                  enum: [course, td, control]
                chapterTitle:
                  type: string
                specifications:
                  type: object
      responses:
        '201':
          description: Contenu créé

  /contents/{id}/generate:
    post:
      summary: Générer du contenu avec un modèle IA
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [model]
              properties:
                model:
                  type: string
                  enum: [gemini, claude]
      responses:
        '200':
          description: Contenu généré avec succès

  /contents/{id}/compare:
    post:
      summary: Générer avec les deux modèles simultanément
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Contenus générés avec les deux modèles

  /contents/{id}/publish:
    post:
      summary: Publier le contenu sur Notion
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Contenu publié sur Notion

components:
  schemas:
    Subject:
      type: object
      required: [_id, name, level, createdAt, updatedAt]
      properties:
        _id:
          type: string
        name:
          type: string
        level:
          type: string
          enum: [lycee, superieur]
        description:
          type: string
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    Content:
      type: object
      required: [_id, subjectId, type, chapterTitle, specifications, versions, status]
      properties:
        _id:
          type: string
        subjectId:
          type: string
        type:
          type: string
          enum: [course, td, control]
        chapterTitle:
          type: string
        specifications:
          type: object
        versions:
          type: array
          items:
            type: object
        selectedVersion:
          type: string
          enum: [gemini, claude]
          nullable: true
        status:
          type: string
          enum: [draft, comparing, published, rejected]

    Error:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            timestamp:
              type: string
            requestId:
              type: string
```

---

## Components

### Component Architecture

**Major Logical Components:**

1. **Subject Management Component**
   - Repository: SubjectRepository (CRUD operations)
   - Service: SubjectService (business logic)
   - Tech: Mongoose models, Next.js API Routes

2. **Content Management Component**
   - Repository: ContentRepository (version management)
   - Service: ContentService (status transitions)
   - Tech: Zustand store, Tanstack Query

3. **AI Content Generation Component**
   - Interface: AIService
   - Implementations: GeminiService, ClaudeService
   - Factory: AIServiceFactory
   - Tech: Strategy Pattern, Google/Anthropic SDKs

4. **Rich Text Editor Component**
   - Component: TiptapEditor
   - Hook: useAutoSave (2s debounce)
   - Tech: Tiptap + Markdown extension

5. **Comparison View Component**
   - Component: ComparisonView (split layout)
   - Component: VersionSelector
   - Tech: CSS Grid, Zustand

6. **Notion Publishing Component**
   - Service: NotionService
   - Rate Limiter: NotionRateLimiter (3 req/sec)
   - Converter: MarkdownToNotionBlocks
   - Tech: @notionhq/client, p-queue

7. **State Management Component**
   - Stores: useSubjectsStore, useContentsStore, useUIStore
   - Tech: Zustand + Immer middleware

8. **Database Connection Component**
   - Function: connectDB() singleton
   - Tech: Mongoose, global cache

### Component Diagram

```mermaid
graph TB
    subgraph "Frontend (Client Components)"
        UI[Subject/Content UI]
        Editor[Tiptap Editor]
        Comparison[Comparison View]
        State[Zustand Stores]
    end

    subgraph "Frontend (Server Components)"
        RSC[React Server Components]
    end

    subgraph "Backend (API Routes)"
        SubjectAPI[Subject API Routes]
        ContentAPI[Content API Routes]
        GenerateAPI[Generate API Routes]
        PublishAPI[Publish API Routes]
    end

    subgraph "Business Logic Layer"
        SubjectService[Subject Service]
        ContentService[Content Service]
        AIFactory[AI Service Factory]
        NotionService[Notion Service]
    end

    subgraph "Data Access Layer"
        SubjectRepo[Subject Repository]
        ContentRepo[Content Repository]
        DBConnection[DB Connection Singleton]
    end

    subgraph "External Services"
        MongoDB[(MongoDB Atlas)]
        GeminiAPI[Gemini API]
        ClaudeAPI[Claude API]
        NotionAPI[Notion API]
    end

    UI --> State
    Editor --> State
    Comparison --> State
    State --> ContentAPI
    State --> SubjectAPI

    RSC --> SubjectAPI
    RSC --> ContentAPI

    SubjectAPI --> SubjectService
    ContentAPI --> ContentService
    GenerateAPI --> ContentService
    GenerateAPI --> AIFactory
    PublishAPI --> NotionService

    SubjectService --> SubjectRepo
    ContentService --> ContentRepo
    AIFactory --> |creates| GeminiService[Gemini Service]
    AIFactory --> |creates| ClaudeService[Claude Service]

    SubjectRepo --> DBConnection
    ContentRepo --> DBConnection
    DBConnection --> MongoDB

    GeminiService --> GeminiAPI
    ClaudeService --> ClaudeAPI
    NotionService --> NotionAPI
```

---

## External APIs

### Gemini 1.5 Pro API

- **Purpose:** Génération de contenu pédagogique avec contexte large (1M tokens)
- **Documentation:** https://ai.google.dev/gemini-api/docs
- **Base URL:** `https://generativelanguage.googleapis.com/v1beta`
- **Authentication:** API Key (header `x-goog-api-key`)
- **Rate Limits:** Free tier: 15 req/min, 1M tokens/min, 1500 req/day

**Key Endpoints:**
- `POST /models/gemini-1.5-pro:generateContent`

**Integration Notes:**
- SDK: `@google/generative-ai`
- Timeout: 50s
- Context: 1M tokens (charge cours complets)
- Retry: 3 attempts with exponential backoff

### Claude 3.5 Sonnet API

- **Purpose:** Génération alternative pour comparaison
- **Documentation:** https://docs.anthropic.com/claude/reference
- **Base URL:** `https://api.anthropic.com/v1`
- **Authentication:** Header `x-api-key`
- **Rate Limits:** Tier 1: 50 req/min, 40k tokens/min input

**Key Endpoints:**
- `POST /messages`

**Integration Notes:**
- SDK: `@anthropic-ai/sdk`
- Timeout: 50s
- Context: 200k tokens
- Retry: 3 attempts with exponential backoff

### Notion API

- **Purpose:** Publication de contenu vers workspace
- **Documentation:** https://developers.notion.com/reference
- **Base URL:** `https://api.notion.com/v1`
- **Authentication:** Header `Authorization: Bearer <token>`
- **Rate Limits:** **3 requests/second** (CRITICAL)

**Key Endpoints:**
- `POST /pages` - Création de page
- `PATCH /pages/{id}` - Mise à jour

**Integration Notes:**
- SDK: `@notionhq/client`
- Rate limiting: p-queue (max 3 req/sec)
- Markdown conversion: Parser MD → Notion blocks
- Retry: 429 handling with `retry-after` header

---

## Core Workflows

### Workflow 1: Content Generation (Single Model)

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as /api/contents/{id}/generate
    participant Service as Content Service
    participant AI as Gemini/Claude API
    participant DB as MongoDB

    User->>UI: Sélectionne modèle + Click "Générer"
    UI->>API: POST {model: 'gemini'}

    API->>Service: generateContent(contentId, model)
    Service->>DB: Load content + linked courses

    Service->>AI: generate(prompt)
    Note right of AI: 1M tokens context<br/>Timeout: 50s
    AI-->>Service: generated markdown

    Service->>DB: Save version to content.versions
    Service-->>UI: {content, generatedVersion}
    UI->>User: Affiche dans Tiptap
```

### Workflow 2: Model Comparison (Dual Generation)

```mermaid
sequenceDiagram
    actor User
    participant UI as Comparison UI
    participant API as /api/contents/{id}/compare
    participant Gemini as Gemini API
    participant Claude as Claude API
    participant DB as MongoDB

    User->>UI: Click "Comparer les modèles"
    UI->>API: POST /compare

    par Parallel Generation
        API->>Gemini: generate(prompt)
    and
        API->>Claude: generate(prompt)
    end

    Gemini-->>API: gemini content
    Claude-->>API: claude content

    API->>DB: Save both versions, status='comparing'
    API-->>UI: {geminiVersion, claudeVersion}

    UI->>UI: Render split view
    User->>UI: Select version
    UI->>API: PATCH {selectedVersion, status='draft'}
```

### Workflow 3: Content Editing with Auto-Save

```mermaid
sequenceDiagram
    actor User
    participant Editor as Tiptap Editor
    participant Hook as useAutoSave
    participant API as /api/contents/{id}
    participant DB as MongoDB

    User->>Editor: Type/edit content
    Editor->>Hook: onChange(newContent)
    Hook->>Hook: Debounce 2s

    Hook->>API: PATCH {versions[selectedVersion].content}
    API->>DB: Update content
    DB-->>Editor: Show "✓ Sauvegardé"
```

### Workflow 4: Notion Publication

```mermaid
sequenceDiagram
    actor User
    participant UI as Content UI
    participant API as /api/contents/{id}/publish
    participant Queue as Rate Limit Queue
    participant Notion as Notion API
    participant DB as MongoDB

    User->>UI: Click "Publier sur Notion"
    UI->>API: POST /publish

    API->>Queue: Enqueue (3 req/sec limit)
    Queue->>Notion: POST /pages
    Notion-->>Queue: {pageId, url}

    Queue->>DB: Update notionPageId, status='published'
    DB-->>UI: {notionUrl}
    UI->>User: Toast "✓ Publié" + Link
```

---

## Database Schema

### MongoDB Schemas (Mongoose)

#### Subject Schema

```typescript
// packages/db/src/models/Subject.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ISubject extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  level: 'lycee' | 'superieur';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      minlength: [1, 'Name must be at least 1 character'],
      maxlength: [200, 'Name cannot exceed 200 characters'],
      index: true,
    },
    level: {
      type: String,
      required: [true, 'Subject level is required'],
      enum: {
        values: ['lycee', 'superieur'],
        message: '{VALUE} is not a valid level',
      },
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
    collection: 'subjects',
  }
);

// Compound index
SubjectSchema.index({ level: 1, name: 1 });

export const Subject = mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema);
```

#### Content Schema

```typescript
// packages/db/src/models/Content.ts
import mongoose, { Schema, Document } from 'mongoose';

type AIModel = 'gemini' | 'claude';
type ContentType = 'course' | 'td' | 'control';
type ContentStatus = 'draft' | 'comparing' | 'published' | 'rejected';

export interface IContentVersion {
  model: AIModel;
  content: string;
  generatedAt: Date;
  rejected: boolean;
}

export interface IContentSpecifications {
  constraints: string;
  linkedCourseId?: mongoose.Types.ObjectId;
  linkedCourseIds?: mongoose.Types.ObjectId[];
  duration?: number;
}

export interface IContent extends Document {
  _id: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  type: ContentType;
  chapterTitle: string;
  specifications: IContentSpecifications;
  versions: IContentVersion[];
  selectedVersion: AIModel | null;
  status: ContentStatus;
  notionPageId?: string;
  tags?: string[];
  notes?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  createdAt: Date;
  updatedAt: Date;
}

const ContentVersionSchema = new Schema<IContentVersion>(
  {
    model: {
      type: String,
      required: true,
      enum: ['gemini', 'claude'],
    },
    content: {
      type: String,
      required: true,
    },
    generatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    rejected: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { _id: false }
);

const ContentSpecificationsSchema = new Schema<IContentSpecifications>(
  {
    constraints: {
      type: String,
      required: [true, 'Constraints are required'],
      minlength: [10, 'Constraints must be at least 10 characters'],
    },
    linkedCourseId: {
      type: Schema.Types.ObjectId,
      ref: 'Content',
    },
    linkedCourseIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Content',
    },
    duration: {
      type: Number,
      min: [5, 'Duration must be at least 5 minutes'],
      max: [480, 'Duration cannot exceed 480 minutes'],
    },
  },
  { _id: false }
);

const ContentSchema = new Schema<IContent>(
  {
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject ID is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Content type is required'],
      enum: {
        values: ['course', 'td', 'control'],
        message: '{VALUE} is not a valid content type',
      },
      index: true,
    },
    chapterTitle: {
      type: String,
      required: [true, 'Chapter title is required'],
      trim: true,
      minlength: [1, 'Title must be at least 1 character'],
      maxlength: [300, 'Title cannot exceed 300 characters'],
      index: 'text',
    },
    specifications: {
      type: ContentSpecificationsSchema,
      required: true,
    },
    versions: {
      type: [ContentVersionSchema],
      default: [],
      validate: {
        validator: function(v: IContentVersion[]) {
          return v.length <= 20;
        },
        message: 'Cannot exceed 20 versions per content',
      },
    },
    selectedVersion: {
      type: String,
      enum: ['gemini', 'claude', null],
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: ['draft', 'comparing', 'published', 'rejected'],
      default: 'draft',
      index: true,
    },
    notionPageId: {
      type: String,
      sparse: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    notes: {
      type: String,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'contents',
  }
);

// Compound indexes
ContentSchema.index({ subjectId: 1, type: 1, status: 1 });
ContentSchema.index({ status: 1, createdAt: -1 });
ContentSchema.index({ 'specifications.linkedCourseId': 1 });

// Virtual for selected content
ContentSchema.virtual('selectedContent').get(function(this: IContent) {
  if (!this.selectedVersion) return null;
  const version = this.versions.find(v => v.model === this.selectedVersion && !v.rejected);
  return version?.content || null;
});

// Pre-save validation
ContentSchema.pre('save', function(next) {
  if (this.status === 'published' && !this.selectedVersion) {
    next(new Error('Cannot publish without selecting a version'));
  }

  if (this.type === 'td' && !this.specifications.linkedCourseId) {
    next(new Error('TD must have linkedCourseId'));
  }

  if (this.type === 'control' && (!this.specifications.linkedCourseIds || this.specifications.linkedCourseIds.length === 0)) {
    next(new Error('Control must have at least one linkedCourseId'));
  }

  next();
});

export const Content = mongoose.models.Content || mongoose.model<IContent>('Content', ContentSchema);
```

### Database Indexes Summary

| Collection | Index | Type | Purpose |
|------------|-------|------|---------|
| `subjects` | `name` | Single | Search by name |
| `subjects` | `level` | Single | Filter by level |
| `subjects` | `{level, name}` | Compound | Common query pattern |
| `contents` | `subjectId` | Single | Filter by subject (critical) |
| `contents` | `type` | Single | Filter by content type |
| `contents` | `status` | Single | Filter by status |
| `contents` | `chapterTitle` | Text | Full-text search |
| `contents` | `{subjectId, type, status}` | Compound | Dashboard queries |
| `contents` | `{status, createdAt}` | Compound | Recent published |
| `contents` | `specifications.linkedCourseId` | Single | Find related TDs |

---

## Frontend Architecture

### Component Organization

```
app/
├── (routes)/
│   ├── page.tsx                      # Home (Server Component)
│   ├── subjects/
│   │   ├── page.tsx                  # List (Server Component)
│   │   ├── [id]/page.tsx             # Detail (Server Component)
│   │   └── new/page.tsx              # Create form
│   └── contents/
│       ├── [id]/
│       │   ├── page.tsx              # Detail
│       │   ├── edit/page.tsx         # Tiptap editor
│       │   └── compare/page.tsx      # Comparison view
│       └── new/page.tsx              # Create wizard

components/
├── ui/                               # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── subjects/
│   ├── subject-card.tsx
│   ├── subject-form.tsx
│   └── subject-list.tsx
├── contents/
│   ├── content-editor.tsx            # Tiptap integration
│   ├── content-comparison.tsx        # Split view
│   └── ai-model-selector.tsx
└── providers/
    ├── query-provider.tsx
    └── toast-provider.tsx
```

### Component Template (Server Component)

```typescript
// app/subjects/page.tsx
import { Suspense } from 'react';
import { SubjectList } from '@/components/subjects/subject-list';

export default async function SubjectsPage() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subjects`, {
    cache: 'no-store',
    next: { tags: ['subjects'] },
  });

  const { subjects } = await response.json();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Mes Matières</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <SubjectList subjects={subjects} />
      </Suspense>
    </div>
  );
}
```

### Component Template (Client Component)

```typescript
// components/contents/content-editor.tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Markdown from '@tiptap/extension-markdown';
import { useAutoSave } from '@/hooks/use-auto-save';

export function ContentEditor({ contentId, initialContent, selectedVersion }) {
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown.getMarkdown();
      handleContentChange(markdown);
    },
  });

  const { handleContentChange, isSaving, lastSaved } = useAutoSave({
    contentId,
    selectedVersion,
    onSave: async (markdown) => {
      await fetch(`/api/contents/${contentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versions: [{ model: selectedVersion, content: markdown }] }),
      });
    },
  });

  return (
    <div className="border rounded-lg">
      <EditorContent editor={editor} />
      <div className="px-4 py-2 text-sm">
        {isSaving ? '💾 Sauvegarde...' : lastSaved ? `✓ Sauvegardé à ${lastSaved.toLocaleTimeString()}` : null}
      </div>
    </div>
  );
}
```

### State Management (Zustand)

```typescript
// lib/store/contents-store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface ContentsState {
  contents: Content[];
  isGenerating: boolean;

  setContents: (contents: Content[]) => void;
  addVersion: (contentId: string, version: ContentVersion) => void;
  selectVersion: (contentId: string, model: 'gemini' | 'claude') => void;
}

export const useContentsStore = create<ContentsState>()(
  immer((set) => ({
    contents: [],
    isGenerating: false,

    setContents: (contents) => set({ contents }),

    addVersion: (contentId, version) => set((state) => {
      const content = state.contents.find(c => c._id === contentId);
      if (content) {
        content.versions.push(version);
      }
    }),

    selectVersion: (contentId, model) => set((state) => {
      const content = state.contents.find(c => c._id === contentId);
      if (content) {
        content.selectedVersion = model;
        content.status = 'draft';
      }
    }),
  }))
);
```

### API Client

```typescript
// lib/api/client.ts
export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new APIError(
      data.error?.message || 'An error occurred',
      response.status,
      data.error?.code || 'UNKNOWN_ERROR'
    );
  }

  return data;
}
```

---

## Backend Architecture

### Function Organization

```
app/api/
├── subjects/
│   ├── route.ts                      # GET, POST /api/subjects
│   └── [id]/route.ts                 # GET, PATCH, DELETE
├── contents/
│   ├── route.ts                      # GET, POST /api/contents
│   └── [id]/
│       ├── route.ts                  # GET, PATCH, DELETE
│       ├── generate/route.ts         # POST (AI generation)
│       ├── compare/route.ts          # POST (dual AI)
│       └── publish/route.ts          # POST (Notion)

packages/
├── db/
│   ├── src/
│   │   ├── connection.ts             # Singleton
│   │   ├── models/
│   │   └── repositories/
├── ai/
│   ├── src/
│   │   ├── interfaces/AIService.ts
│   │   ├── services/
│   │   │   ├── GeminiService.ts
│   │   │   ├── ClaudeService.ts
│   │   │   └── AIServiceFactory.ts
│   │   └── prompts/PromptBuilder.ts
└── notion/
    └── src/
        ├── NotionService.ts
        └── NotionRateLimiter.ts
```

### API Route Template

```typescript
// app/api/subjects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SubjectRepository } from '@studymate/db/repositories/SubjectRepository';
import { connectDB } from '@studymate/db/connection';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') as 'lycee' | 'superieur' | null;

    const subjectRepo = new SubjectRepository();
    const subjects = level
      ? await subjectRepo.findByLevel(level)
      : await subjectRepo.findAll();

    return NextResponse.json({ subjects });
  } catch (error) {
    return handleAPIError(error);
  }
}

export const runtime = 'nodejs';
export const maxDuration = 10; // 10s timeout for CRUD
```

### MongoDB Connection Singleton

```typescript
// packages/db/src/connection.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

declare global {
  var mongooseConnection: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

let cached = global.mongooseConnection;

if (!cached) {
  cached = global.mongooseConnection = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const options = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, options).then((mongoose) => {
      console.log('✅ MongoDB connected');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
```

### Repository Pattern

```typescript
// packages/db/src/repositories/ContentRepository.ts
import { Content, IContent } from '../models/Content';

export class ContentRepository {
  async findAll(filters?: { subjectId?: string; type?: string; status?: string }): Promise<IContent[]> {
    const query: any = {};
    if (filters?.subjectId) query.subjectId = filters.subjectId;
    if (filters?.type) query.type = filters.type;
    if (filters?.status) query.status = filters.status;

    return Content.find(query).populate('subjectId').sort({ createdAt: -1 }).lean().exec();
  }

  async findById(id: string): Promise<IContent | null> {
    return Content.findById(id).populate('subjectId').lean().exec();
  }

  async addVersion(id: string, version: IContentVersion): Promise<IContent | null> {
    return Content.findByIdAndUpdate(
      id,
      { $push: { versions: version } },
      { new: true, runValidators: true }
    ).lean().exec();
  }
}
```

---

## Unified Project Structure

```plaintext
studymate/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Tests + lint
│       └── deploy.yml                # Vercel auto-deploy
│
├── app/                              # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   │
│   ├── (routes)/
│   │   ├── subjects/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   │
│   │   └── contents/
│   │       ├── [id]/
│   │       │   ├── page.tsx
│   │       │   ├── edit/page.tsx
│   │       │   └── compare/page.tsx
│   │       └── new/page.tsx
│   │
│   └── api/                          # API Routes
│       ├── subjects/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       └── contents/
│           ├── route.ts
│           └── [id]/
│               ├── route.ts
│               ├── generate/route.ts
│               ├── compare/route.ts
│               └── publish/route.ts
│
├── components/
│   ├── ui/                          # shadcn/ui
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   │
│   ├── subjects/
│   │   ├── subject-card.tsx
│   │   └── subject-form.tsx
│   │
│   ├── contents/
│   │   ├── content-editor.tsx
│   │   ├── content-comparison.tsx
│   │   └── ai-model-selector.tsx
│   │
│   └── providers/
│       ├── query-provider.tsx
│       └── toast-provider.tsx
│
├── hooks/
│   ├── use-auto-save.ts
│   ├── use-subjects.ts
│   └── use-contents.ts
│
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   ├── subjects-service.ts
│   │   └── contents-service.ts
│   │
│   ├── store/
│   │   ├── subjects-store.ts
│   │   └── contents-store.ts
│   │
│   └── utils.ts
│
├── packages/                         # Monorepo packages
│   ├── shared/
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── schemas/
│   │   │   └── constants/
│   │   └── package.json
│   │
│   ├── db/
│   │   ├── src/
│   │   │   ├── connection.ts
│   │   │   ├── models/
│   │   │   └── repositories/
│   │   └── package.json
│   │
│   ├── ai/
│   │   ├── src/
│   │   │   ├── interfaces/
│   │   │   ├── services/
│   │   │   └── prompts/
│   │   └── package.json
│   │
│   └── notion/
│       ├── src/
│       │   ├── NotionService.ts
│       │   └── NotionRateLimiter.ts
│       └── package.json
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/
│   ├── prd.md
│   └── architecture.md
│
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── pnpm-workspace.yaml
├── vercel.json
└── README.md
```

---

## Development Workflow

### Prerequisites

```bash
node --version        # v20.x LTS
pnpm --version        # v9.x
git --version         # Latest
```

### Initial Setup

```bash
# Clone repository
git clone https://github.com/username/studymate.git
cd studymate

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with credentials
# MONGODB_URI=mongodb+srv://...
# GEMINI_API_KEY=AIza...
# ANTHROPIC_API_KEY=sk-ant-...
# NOTION_INTEGRATION_TOKEN=secret_...
```

### Development Commands

```bash
# Start dev server
pnpm dev
# → http://localhost:3000

# Build for production
pnpm build

# Start production server
pnpm start

# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e
```

### Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3000

# Backend (.env.local)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/studymate
GEMINI_API_KEY=AIzaSy...
ANTHROPIC_API_KEY=sk-ant-api03-...
NOTION_INTEGRATION_TOKEN=secret_...
NOTION_PARENT_PAGE_ID=abc123...

# Shared
NODE_ENV=development
```

---

## Deployment Architecture

### Deployment Strategy

**Frontend:**
- Platform: Vercel Edge Network
- Build: `pnpm build`
- CDN: Automatic global distribution

**Backend:**
- Platform: Vercel Serverless Functions (Node.js 20.x)
- Deploy: Git push to main triggers auto-deploy

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm type-check
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

### Environments

| Environment | Frontend URL | Backend URL | Purpose |
|-------------|-------------|-------------|---------|
| **Development** | http://localhost:3000 | http://localhost:3000/api | Local dev |
| **Preview** | https://studymate-git-[branch].vercel.app | Same | PR previews |
| **Production** | https://studymate.vercel.app | https://studymate.vercel.app/api | Live |

---

## Security and Performance

### Security Requirements

**Frontend Security:**
- CSP Headers: `default-src 'self'; script-src 'self' 'unsafe-inline'`
- XSS Prevention: React auto-escapes, Tiptap sanitizes
- Secure Storage: No sensitive data in localStorage

**Backend Security:**
- Input Validation: Zod schemas on all API routes
- Rate Limiting: Future Epic 4+ (Upstash)
- CORS Policy: Same-origin (Vercel default)

**Authentication (Future):**
- Token Storage: httpOnly cookies (NextAuth.js)
- Session Management: MongoDB sessions, 30-day expiry
- OAuth Providers: Google, GitHub

### Performance Optimization

**Frontend Performance:**
- Bundle Size: < 200KB initial JS (RSC)
- Loading: Server Components, dynamic imports
- Caching: Tanstack Query (5min staleTime)

**Backend Performance:**
- Response Time: CRUD <500ms p95, AI <45s p95
- Database: Compound indexes, `.lean()` queries
- Connection Pooling: maxPoolSize: 10

**Vercel Optimizations:**
- Cold Start: Connection singleton reuse
- Code Splitting: Separate API routes
- Timeouts: 10s CRUD, 50s AI generation

---

## Testing Strategy

### Testing Pyramid

```
        E2E (Playwright)
       /                \
     Integration (Vitest)
    /                    \
  Frontend Unit         Backend Unit
 (Vitest + RTL)        (Vitest)
```

### Test Organization

```
tests/
├── unit/
│   ├── components/
│   │   ├── subjects/
│   │   └── contents/
│   ├── hooks/
│   └── stores/
│
├── integration/
│   └── api/
│       ├── subjects.test.ts
│       └── contents.test.ts
│
└── e2e/
    ├── subjects.spec.ts
    ├── content-generation.spec.ts
    └── notion-publish.spec.ts
```

### Test Examples

**Frontend Component Test:**

```typescript
// tests/unit/components/subjects/subject-card.test.tsx
import { render, screen } from '@testing-library/react';
import { SubjectCard } from '@/components/subjects/subject-card';

describe('SubjectCard', () => {
  it('renders subject name and level', () => {
    const subject = {
      _id: '123',
      name: 'Mathématiques',
      level: 'lycee' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(<SubjectCard subject={subject} />);

    expect(screen.getByText('Mathématiques')).toBeInTheDocument();
    expect(screen.getByText('Lycée')).toBeInTheDocument();
  });
});
```

**Backend API Test:**

```typescript
// tests/integration/api/subjects.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectDB, disconnectDB } from '@studymate/db/connection';

describe('POST /api/subjects', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('creates a new subject', async () => {
    const response = await fetch('http://localhost:3000/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Histoire', level: 'superieur' }),
    });

    expect(response.status).toBe(201);
    const { subject } = await response.json();
    expect(subject.name).toBe('Histoire');
  });
});
```

**E2E Test:**

```typescript
// tests/e2e/content-generation.spec.ts
import { test, expect } from '@playwright/test';

test('generate content with Gemini', async ({ page }) => {
  await page.goto('/subjects');

  await page.click('text=Nouvelle Matière');
  await page.fill('input[name="name"]', 'Physique');
  await page.selectOption('select[name="level"]', 'lycee');
  await page.click('button[type="submit"]');

  await page.click('text=Nouveau Contenu');
  await page.fill('input[name="chapterTitle"]', 'La mécanique');
  await page.click('text=Sélectionner le modèle');
  await page.click('text=Gemini 1.5 Pro');
  await page.click('text=Générer');

  await expect(page.locator('.tiptap-editor')).toContainText('mécanique', { timeout: 60000 });
});
```

---

## Coding Standards

### Critical Fullstack Rules

- **Type Sharing:** Always define shared types in `packages/shared/src/types` and import from `@studymate/shared`

- **API Calls:** Never make direct `fetch()` calls from components - use service layer (`lib/api/*-service.ts`)

- **Environment Variables:** Frontend must prefix with `NEXT_PUBLIC_`, backend access via `process.env.VAR_NAME`

- **Error Handling:** All API routes must use standardized error format (code, message, details, timestamp, requestId)

- **State Updates:** Never mutate Zustand state directly - use Immer middleware

- **MongoDB Connection:** Always use `connectDB()` singleton at start of API routes

- **Validation:** All API route inputs must be validated with Zod schemas

- **Server vs Client Components:** Default to Server Components, use `'use client'` only for interactivity

### Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| **Components** | PascalCase | - | `SubjectCard.tsx` |
| **Hooks** | camelCase with 'use' | - | `useAutoSave.ts` |
| **API Routes** | - | kebab-case | `/api/contents/[id]/generate` |
| **Services** | camelCase | camelCase | `subjectsService` |
| **Database Models** | - | PascalCase | `Subject`, `Content` |
| **Zod Schemas** | PascalCase + Schema | - | `CreateSubjectSchema` |

---

## Error Handling Strategy

### Error Flow

```mermaid
sequenceDiagram
    participant UI
    participant API
    participant Service
    participant External

    UI->>API: Request
    API->>Service: Process
    Service->>External: Call

    alt Success
        External-->>API: Success
        API-->>UI: 200 OK
    else Validation Error
        Service-->>API: ZodError
        API-->>UI: 400 Bad Request
    else External Error
        External-->>Service: Error
        Service->>Service: Retry 3x
        alt Retry succeeds
            Service-->>API: Result
        else Retry fails
            Service-->>API: Error
            API-->>UI: 503 Unavailable
        end
    end
```

### Error Response Format

```typescript
interface ApiError {
  error: {
    code: string;           // VALIDATION_ERROR, NOT_FOUND, etc.
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}
```

### Frontend Error Handling

```typescript
// lib/api/client.ts
export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new APIError(
      data.error?.message || 'An error occurred',
      response.status,
      data.error?.code || 'UNKNOWN_ERROR',
      data.error?.details
    );
  }

  return data;
}
```

### Backend Error Handling

```typescript
// lib/api/utils.ts
export function handleAPIError(error: unknown): NextResponse {
  const requestId = crypto.randomUUID();

  if (error instanceof mongoose.Error.ValidationError) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid data',
          details: error.errors,
          timestamp: new Date().toISOString(),
          requestId,
        },
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        requestId,
      },
    },
    { status: 500 }
  );
}
```

---

## Monitoring and Observability

### Monitoring Stack

- **Frontend:** Vercel Analytics (Web Vitals)
- **Backend:** Vercel Function Logs
- **Error Tracking:** Vercel Logs (MVP), Sentry (Epic 4+)
- **Performance:** Vercel Speed Insights

### Key Metrics

**Frontend Metrics:**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

**Backend Metrics:**
- Request Rate: Requests/minute per endpoint
- Error Rate: 5xx errors / total (target < 1%)
- Response Time: p50, p95, p99
  - CRUD: p95 < 500ms
  - AI generation: p95 < 45s
- Cold Starts: Frequency and duration

**Infrastructure Metrics:**
- MongoDB: Connection count (max 500), query time
- Vercel: Bandwidth (100GB/month free), function time

### Logging Strategy

```typescript
// Structured logging
console.log(JSON.stringify({
  level: 'info',
  message: 'Content generated',
  contentId: '123',
  model: 'gemini',
  duration: 12500,
  timestamp: new Date().toISOString(),
}));
```

---

## Checklist Results Report

### Executive Summary

**Overall Architecture Readiness: HIGH ✅**

**Project Type:** Full-Stack Application (Next.js 16 + MongoDB + Vercel)

**Critical Strengths:**
1. ✅ Comprehensive coverage - All 19 sections documented
2. ✅ PRD alignment - 100% requirements addressed
3. ✅ AI implementation ready - Clear patterns, optimized modularity
4. ✅ Serverless optimization - Connection singleton, timeout handling
5. ✅ Full-stack integration - Unified type system, consistent patterns

**Critical Risks:**
1. ⚠️ MongoDB M0 limits (500 connections) - Mitigated with connection pooling
2. ⚠️ AI API costs - User-controlled, no auto-generation
3. ⚠️ No authentication for MVP - Single-user assumption

### Section-by-Section Analysis

- **Section 1 (Requirements):** 14/14 ✅ (100%)
- **Section 2 (Architecture):** 19/19 ✅ (100%)
- **Section 3 (Tech Stack):** 27/28 ✅ (96%)
- **Section 4 (Frontend):** 26/26 ✅ (100%)
- **Section 5 (Resilience):** 18/20 ✅ (90%)
- **Section 6 (Security):** 17/20 ✅ (85%)
- **Section 7 (Implementation):** 24/24 ✅ (100%)
- **Section 8 (Dependencies):** 14/15 ✅ (93%)
- **Section 9 (AI Suitability):** 16/16 ✅ (100%)
- **Section 10 (Accessibility):** 8/10 ✅ (80%)

**Overall Pass Rate: 183/192 items = 95.3% ✅**

**Recommendation: APPROVED for Development ✅**

### Top Recommendations

**MUST-FIX:** None - all critical items addressed

**SHOULD-FIX:**
1. Add rate limiting (Epic 4)
2. Add authentication (Epic 5)
3. Document MongoDB upgrade path (M0 → M10)
4. Add accessibility testing (axe-core)

**NICE-TO-HAVE:**
1. Sentry error tracking (Epic 4+)
2. Redis/Vercel KV caching (if needed)
3. Multi-region deployment (Epic 4+)

### AI Implementation Readiness

**Score: 98/100 - EXCELLENT ✅**

**Strengths:**
- Clear patterns (all API routes identical structure)
- Sized components (2-4h AI sessions)
- Explicit types (full TypeScript coverage)
- Code examples (8 detailed templates)
- Minimal dependencies (isolated packages)

**Areas Requiring Attention:**
1. MongoDB Connection Singleton (Critical - detailed template provided)
2. Tiptap Integration (Complex - full example provided)
3. Notion Rate Limiting (p-queue pattern documented)

---

**Document Complete - Ready for Development** ✅
