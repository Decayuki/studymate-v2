# StudyMate

Hub de création de contenu pédagogique avec IA (Gemini 1.5 Pro + Claude 3.5 Sonnet)

## 📚 Description

StudyMate centralise la génération de contenus pédagogiques (Cours, TDs, Contrôles) pour Lycée et Enseignement Supérieur, avec:

- **Dual AI:** Gemini 1.5 Pro + Claude 3.5 Sonnet
- **Comparaison:** Side-by-side AI model comparison
- **Édition:** Tiptap rich text editor avec auto-save
- **Publication:** Intégration Notion API

## 🛠 Stack Technique

- **Frontend:** Next.js 16 + React 19 + TypeScript
- **UI:** shadcn/ui + TailwindCSS
- **Backend:** Next.js API Routes (Serverless)
- **Database:** MongoDB Atlas
- **State:** Zustand + Tanstack Query
- **Deploy:** Vercel

## 📦 Structure Monorepo

```
studymate/
├── app/                  # Next.js App Router
├── components/           # React components
├── lib/                  # Utilities
├── hooks/                # Custom hooks
├── packages/
│   ├── shared/          # Types, schemas, constants
│   ├── db/              # MongoDB models & repositories
│   ├── ai/              # AI abstraction layer
│   └── notion/          # Notion API integration
└── docs/                # Documentation (PRD, Architecture)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x LTS
- npm 10.x
- MongoDB Atlas account
- Gemini API key
- Claude API key (Anthropic)
- Notion Integration token

### Installation

```bash
# Clone repository
git clone <repository-url>
cd studymate

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your credentials
# MONGODB_URI=mongodb+srv://...
# GEMINI_API_KEY=AIza...
# ANTHROPIC_API_KEY=sk-ant-...
# NOTION_INTEGRATION_TOKEN=secret_...

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📖 Documentation

- **PRD:** `docs/prd.md` - Product Requirements Document
- **Architecture:** `docs/architecture.md` - Fullstack Architecture Document

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Unit tests (coming soon)
npm run test

# E2E tests (coming soon)
npm run test:e2e
```

## 🚢 Deployment

Auto-deploy to Vercel on push to `main` branch.

```bash
# Build production
npm run build

# Start production server
npm start
```

## 📄 License

Private project - All rights reserved

---

**Built with ❤️ using Next.js 16, Gemini 1.5 Pro, and Claude 3.5 Sonnet**
