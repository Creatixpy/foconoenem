# Foco no ENEM - Product Requirements Document

## 1. Product Overview
Foco no ENEM is a free educational platform designed to help Brazilian students prepare for the ENEM (Exame Nacional do Ensino Médio). The platform offers AI-powered essay grading, quiz generation, news aggregation, community discussions, and gamified learning experiences.

## 2. Target Users
- Brazilian high school students preparing for ENEM
- Teachers and educators seeking supplementary tools
- Self-study learners of any age

## 3. Core Features

### 3.1 AI Essay Writing & Correction (/redacao → /resultados/[id])
- Rich text editor with character counter (50-5000 chars)
- Default theme with support texts; option to generate random themes via AI
- AI-powered grading across 5 ENEM competencies (0-200 each, total 0-1000)
- Detailed feedback: comments, strengths, areas for improvement per competency
- Optional account linking to save essay history

### 3.2 AI Quiz Generator (/questoes)
- Multiple-choice quiz across 5 disciplines: Matemática, Português, Química, Física, Geografia
- 3 AI-generated questions per selected discipline
- Answer explanations and accuracy breakdown
- Optional account linking to track quiz history and statistics

### 3.3 News Aggregation (/noticias)
- Curated ENEM-related news articles
- Tag-based filtering and full-text search
- Individual article pages with related articles
- Admin panel for CRUD, moderation, and bulk import

### 3.4 Community Forum (/comunidade)
- Discussion topics and threaded posts
- Like and comment system
- User profiles and reputation

### 3.5 Donation System (/doacao)
- Stripe-powered donations with preset amounts (R$ 5, 10, 25, 50, 100)
- Custom amount input (R$ 5 - R$ 10,000)
- Success page with impact visualization

### 3.6 User Account (/conta)
- Dashboard with profile, performance stats, achievements, streaks, study goals
- Performance charts (Recharts)
- Profile editing, password change, account deletion

### 3.7 Authentication
- Email/password login and registration via Supabase Auth
- Password recovery flow (forgot → reset)
- JWT-based session management via middleware

## 4. Non-Functional Requirements
- Operating hours: 7h-23h30 Brasilia time for AI endpoints
- Rate limiting: 5/min for essay correction, 3/min for theme generation
- LGPD-compliant data handling
- Row-Level Security (RLS) on all Supabase tables
- Responsive design with retro gaming aesthetic

## 5. Tech Stack
- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS
- Backend: Next.js API Routes, Supabase (PostgreSQL, Auth, Edge Functions)
- AI: Groq SDK with retry and fallback
- Payments: Stripe
- Hosting: Vercel
