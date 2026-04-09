# FRONTEND INVENTORY — Foco no ENEM

> Blueprint for rebuilding the frontend from zero.
> Generated on 2026-04-09. Covers every page, component, API route, backend service, DB table, env var, and integration.

---

## 1. PAGES

### Landing
| File | Purpose | Backend Logic |
|------|---------|---------------|
| `app/page.tsx` | Server wrapper — renders HomePageClient with SEO metadata | None |
| `app/HomePageClient.tsx` | Full landing page: hero, features (4 cards), how-it-works (3 steps), testimonials, CTA | None (pure visual) |

### Auth (route group `(auth)`)
| File | Purpose | Backend Logic |
|------|---------|---------------|
| `app/(auth)/layout.tsx` | Isolated auth layout: logo header, centered content, legal footer. robots: noindex | None |
| `app/(auth)/login/page.tsx` | Suspense wrapper for LoginForm | None |
| `app/(auth)/login/LoginForm.tsx` | Email/password login, Google OAuth, forgot-password link, auto-redirect if authed | `signIn()`, `signInWithGoogle()`, `validateEmail()` |
| `app/(auth)/register/page.tsx` | Suspense wrapper for RegisterForm | None |
| `app/(auth)/register/RegisterForm.tsx` | Registration: name, email, password (strength meter), goal, Google OAuth, T&C agreement | `signUp()`, `signInWithGoogle()`, `validateEmail()`, `validatePassword()` |
| `app/(auth)/forgot-password/page.tsx` | Email input → sends reset via Supabase | `supabase.auth.resetPasswordForEmail()` |
| `app/(auth)/reset-password/page.tsx` | New password form with strength indicator, session validation | `supabase.auth.updateUser()`, `validatePassword()` |

### Auth (non-grouped)
| File | Purpose | Backend Logic |
|------|---------|---------------|
| `app/auth/callback/route.ts` | **API Route** — OAuth code exchange, redirects to /conta or /auth/auth-code-error | `supabase.auth.exchangeCodeForSession()` |
| `app/auth/auth-code-error/page.tsx` | Error page for failed OAuth — auto-redirect after 5s | None |
| `app/auth/login/page.tsx` | Redirect: /auth/login → /(auth)/login | `redirect()` |
| `app/auth/register/page.tsx` | Redirect: /auth/register → /(auth)/register | `redirect()` |

### Questões (Quiz)
| File | Purpose | Backend Logic |
|------|---------|---------------|
| `app/questoes/page.tsx` | Suspense wrapper for QuestoesPageClient | None |
| `app/questoes/QuestoesPageClient.tsx` | Quiz simulator: discipline selection, AI question generation, answer interface, results, score storage | Calls `/api/questoes`, stores results via API, uses `getUser()` |

### Redação (Essay)
| File | Purpose | Backend Logic |
|------|---------|---------------|
| `app/redacao/page.tsx` | Suspense wrapper for RedacaoPageClient | None |
| `app/redacao/RedacaoPageClient.tsx` | Essay editor: theme selection, text editor, AI correction, competency scores (1-5), feedback display | Calls `/api/corrigir`, `/api/gerar-tema`, operating hours check |

### Notícias (News)
| File | Purpose | Backend Logic |
|------|---------|---------------|
| `app/noticias/page.tsx` | Wrapper for NoticiasPageClient | None |
| `app/noticias/NoticiasPageClient.tsx` | News feed with pagination (6/page), featured highlights, search, AI-powered GPT search | Calls `/api/noticias`, `/api/noticias/gpt-busca` |
| `app/noticias/[slug]/page.tsx` | Single article view: content, tags, related news, social sharing | Calls `/api/noticias/[slug]` |
| `app/noticias/pesquisa/page.tsx` | Search results page with query param `q` | Calls `/api/noticias/busca` |
| `app/noticias/admin/page.tsx` | Admin news management panel | Calls admin API routes |
| `app/noticias/hooks.ts` | `useNoticiasFeed(page, limit)` and `useNoticiasHighlights(shouldFetch)` hooks | Fetch from `/api/noticias` |

### Comunidade (Community)
| File | Purpose | Backend Logic |
|------|---------|---------------|
| `app/comunidade/page.tsx` | Wrapper for CommunityPageClient | None |
| `app/comunidade/CommunityPageClient.tsx` | Forum: age verification, T&C, topic filter, thread creation, real-time SSE updates, comments, likes, user profiles, achievements | Calls `/api/comunidade/*` endpoints, SSE stream |
| `app/comunidade/hooks/useCommunityThreads.ts` | Hook: threads, real-time SSE, CRUD for posts/comments/likes, auto-reconnect | REST + SSE to `/api/comunidade/*` |
| `app/comunidade/hooks/useCommunityTopics.ts` | Hook: fetch community topics | Calls `/api/comunidade/topics` |

### Conta (Account)
| File | Purpose | Backend Logic |
|------|---------|---------------|
| `app/conta/page.tsx` | Wrapper for ContaPageClient | None |
| `app/conta/ContaPageClient.tsx` | Dashboard: stats tabs (overall, essays, questions), charts (Recharts), recalculate button | Calls `/api/conta/dados`, `/api/conta/recalcular` |
| `app/conta/editar/page.tsx` | Wrapper for ContaEditarPageClient | None |
| `app/conta/editar/ContaEditarPageClient.tsx` | Edit profile: name, bio, goal, ENEM year | Calls `updateUserProfile()` |

### Resultados (Results)
| File | Purpose | Backend Logic |
|------|---------|---------------|
| `app/resultados/[id]/page.tsx` | Wrapper for ResultadosPageClient | None |
| `app/resultados/[id]/ResultadosPageClient.tsx` | Essay results: competency scores, AI feedback per competency, original essay text | Calls `/api/resultados/[id]` |

### Doação (Donation)
| File | Purpose | Backend Logic |
|------|---------|---------------|
| `app/doacao/page.tsx` | Donation page: 5 preset amounts, custom input, Stripe checkout | Calls `/api/doacao/checkout` |
| `app/doacao/sucesso/page.tsx` | Success confirmation: transaction ID, impact cards, social sharing | Reads `session_id` from query params |

### Static Pages
| File | Purpose | Backend Logic |
|------|---------|---------------|
| `app/sobre/page.tsx` | About: company story (2022-2024), values (4), features (4), CTA | None |
| `app/privacidade/page.tsx` | Privacy policy: 8 sections in accordion | None |
| `app/termos/page.tsx` | Terms of service: 9 sections in accordion | None |

---

## 2. COMPONENTS

### Layout
| File | Purpose |
|------|---------|
| `app/components/layout/Header.tsx` | Navigation (6 links), auth menu, theme toggle, mobile hamburger, scroll detection |
| `app/components/layout/Footer.tsx` | Branding, resource links (4), support links (4), social media, contact email |

### UI
| File | Purpose |
|------|---------|
| `app/components/ui/ThemeToggle.tsx` | Dark/light toggle, fixed bottom-right, sun/moon icons |
| `app/components/ui/AccountLinkButton.tsx` | Conditional link: /conta if logged in, /register if not. Accepts custom labels |
| `app/components/ui/OperatingHoursIndicator.tsx` | Emoji status for operating hours (7h-23h30 Brasília), calls `/api/schedule/time` |
| `app/components/ui/skeleton.tsx` | Loading skeleton placeholder |

### Shared
| File | Purpose |
|------|---------|
| `app/components/shared/CookieConsent.tsx` | Cookie notice banner, localStorage persistence (`foconoenem_cookie_consent_v1`) |
| `app/components/shared/NewsImage.tsx` | Next.js Image wrapper with fallback to `/foconoenemicon.png` on error |
| `app/components/shared/AdSenseLoader.tsx` | Google AdSense integration (`ca-pub-8449266040565561`) |

### Feature
| File | Purpose |
|------|---------|
| `app/components/features/quiz/QuestionCard.tsx` | Single quiz question: text, alternatives (A-E), selection, explanation |
| `app/components/features/quiz/QuizResults.tsx` | Quiz results summary: score, correct/incorrect, per-question feedback (lazy-loaded) |

---

## 3. CORE FILES (layout, providers, SEO)

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout: fonts (Geist Sans/Mono, Press Start 2P), Header/Footer, CookieConsent, AdSense, Vercel analytics, theme init script, SEO metadata |
| `app/providers.tsx` | Client component wrapping app with `AuthProvider` + `ThemeProvider` |
| `app/structured-data.tsx` | JSON-LD Schema.org: EducationalOrganization, WebSite, WebApplication |

---

## 4. STYLES

| File | Purpose |
|------|---------|
| `app/styles/index.css` | Entry point importing all CSS (tokens → base → forms → components → utilities) |
| `app/styles/tokens.css` | CSS custom properties: colors, foregrounds, backgrounds, borders, typography, spacing, radius, z-index, light/dark themes |
| `app/styles/base.css` | Resets, body defaults, typography, links, form element defaults, accessibility |
| `app/styles/components.css` | `.card`, `.btn` (primary/secondary/outline), `.badge`, `.input/.textarea/.select`, `.grid`, animations |
| `app/styles/forms.css` | Form elements: inputs, textareas, selects, checkboxes, radios, validation states, disabled states |
| `app/styles/utilities.css` | Utility classes |

---

## 5. API ROUTES

### Essay & Quiz
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/corrigir` | POST | AI essay correction via Groq — returns competency scores + feedback |
| `/api/gerar-tema` | POST | Generate or fetch cached essay theme via Groq |
| `/api/questoes` | POST | Generate AI quiz questions by discipline via Groq |
| `/api/resultados/[id]` | GET | Fetch stored essay result by ID |

### News
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/noticias` | GET | List news with pagination, optional `destaque` filter |
| `/api/noticias/[slug]` | GET | Single article by slug |
| `/api/noticias/busca` | GET | Full-text search (Portuguese config) |
| `/api/noticias/gpt-busca` | POST | AI-powered news search via Groq |
| `/api/noticias/importar` | POST | Import articles from NewsAPI (admin) |
| `/api/noticias/destaques/status` | GET | Featured news status |
| `/api/noticias/admin` | GET | Admin news listing |
| `/api/noticias/admin/moderar` | POST | Moderate news articles (admin) |
| `/api/noticias/admin/status` | GET | Admin dashboard stats |

### Community
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/comunidade/topics` | GET | List discussion topics |
| `/api/comunidade/posts` | GET/POST | List or create posts |
| `/api/comunidade/posts/[postId]` | GET/DELETE | Get or delete a post |
| `/api/comunidade/posts/[postId]/likes` | POST/DELETE | Like/unlike a post |
| `/api/comunidade/comments` | GET/POST | List or create comments |
| `/api/comunidade/comments/count` | GET | Comment count for a post |
| `/api/comunidade/comments/[commentId]` | DELETE | Delete a comment |
| `/api/comunidade/threads` | GET | Thread listing with comments |
| `/api/comunidade/likes` | GET | User's likes |
| `/api/comunidade/profiles` | GET | Community user profiles |
| `/api/comunidade/achievements` | GET | Community achievements |

### Account
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/conta/dados` | GET | Fetch user statistics + recent essays |
| `/api/conta/recalcular` | POST | Trigger statistics recalculation (RPC) |
| `/api/conquistas` | GET | User achievements |

### Donation (Stripe)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/doacao/checkout` | POST | Create Stripe checkout session |
| `/api/doacao/webhook` | POST | Stripe webhook handler |

### System
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/atualizarDestaques` | GET | Cron job: refresh featured news (daily at 00:00 UTC) |
| `/api/destaques/remover` | POST | Remove featured status from articles |
| `/api/schedule/time` | GET | Current operating hours status |
| `/api/realtime-proxy` | GET | SSE proxy for real-time community updates |
| `/api/admin/manutencao` | POST | Admin maintenance operations |

### Auth
| Route | Method | Purpose |
|-------|--------|---------|
| `app/auth/callback/route.ts` | GET | OAuth code exchange → redirect |

---

## 6. BACKEND SERVICES (lib/)

### Authentication (`lib/auth/`)
| File | Purpose |
|------|---------|
| `service.ts` | Core auth: `signUp()`, `signIn()`, `signInWithGoogle()`, `requestPasswordReset()`, `updatePassword()`, `refreshSession()` |
| `profile-service.ts` | Profile CRUD: `getUserProfile()`, `createUserProfile()`, `updateUserProfile()` |
| `stats-service.ts` | Stats: `getUserStatistics()`, `recalculateUserStatistics()` (RPC) |
| `goals-service.ts` | Goals CRUD: `getUserGoals()`, `createUserGoal()`, `updateUserGoal()`, `deleteUserGoal()` |
| `achievements-service.ts` | `getUserAchievements()` with join to achievement details |
| `community-service.ts` | `confirmCommunityAge()`, `acceptCommunityTerms()`, `updateCommunitySettings()` |
| `validation.ts` | `validatePassword()` (strength), `validateEmail()` (RFC 5322), `sanitizeInput()` |
| `security.ts` | CSRF tokens, rate limiting (client), session idle detection, redirect sanitization, user-agent parsing |
| `constants.ts` | Session config (7d max, 30min idle), password rules, rate limits (5/15min), auth paths |
| `types.ts` | `UserProfile`, `UserStatistics`, `UserGoal`, `Achievement`, `AuthState`, `SignUpData`, `SignInData` |
| `context.tsx` | React `AuthProvider` + `AuthContext`: user, session, profile, `signOut()`, `refreshProfile()` |
| `index.ts` | Barrel export |

### AI (`lib/ai/`)
| File | Purpose |
|------|---------|
| `groq.ts` | Groq LLM provider factory: primary + fallback clients, rate limit detection |
| `retry.ts` | `withGroqRetry()`: multi-provider retry with fallback on rate limits |
| `parse-json.ts` | `extractJson()`: safe JSON extraction from LLM responses |

### Database (`lib/db/`)
| File | Purpose |
|------|---------|
| `client.ts` | Browser Supabase client singleton + `withTimeout()` (fast 4s, default 8s, extended 15s) + `DatabaseError` |
| `server.ts` | Server Supabase clients: `createServerClient()` (RLS), `createAdminClient()` (service role) |
| `types.ts` | DB row types, insert/update variants, application models, enums |
| `transformers.ts` | Row↔Model conversion: `toUserProfile()`, `toNoticia()`, `toCommunityPost()`, reverse transformers |
| `repositories/users.ts` | Profile, statistics, goals, achievements CRUD |
| `repositories/essays.ts` | Essay results + theme cache CRUD |
| `repositories/quizzes.ts` | Quiz result CRUD |
| `repositories/news.ts` | News CRUD + full-text search |
| `repositories/community.ts` | Posts, comments, likes, topics CRUD |
| `repositories/analytics.ts` | Event tracking + stats queries |
| `index.ts` | Barrel export |

### Server Utilities (`lib/server/`)
| File | Purpose |
|------|---------|
| `auth-request.ts` | `resolveRequestUser()`: validate Bearer token, return user context |
| `conta.ts` | `fetchContaData()`, `getAuthenticatedUserId()`, `recalculateContaStatistics()` |
| `noticias.ts` | Server-side news: list, fetch by slug, full-text search, fetch by tag (admin client) |
| `analytics.ts` | `trackEvent()`: log to analytics_events table |
| `rate-limit.ts` | `checkRateLimit()`: DB-backed rate limiting |
| `operating-hours.ts` | `getOperatingHoursInfo()`, `isWithinOperatingHours()` (7:00-23:30 São Paulo) |

### Supabase Clients (`lib/supabase/`)
| File | Purpose |
|------|---------|
| `client.ts` | Browser-side Supabase client factory |
| `server.ts` | Server-side Supabase client factory (cookie-based sessions) |
| `middleware.ts` | `updateSession()`: session refresh + security headers |

### Contexts (`lib/contexts/`)
| File | Purpose |
|------|---------|
| `ThemeContext.tsx` | `ThemeProvider`, `useTheme()`, `useResolvedTheme()` — dark/light/system with localStorage |
| `index.ts` | Barrel export |

### Hooks (`lib/hooks/`)
| File | Purpose |
|------|---------|
| `useOutsideClick.ts` | Detect clicks outside element (mousedown + touchstart) |
| `useScrollPosition.ts` | Track scroll position, `{ isScrolled, scrollY }` with threshold |
| `index.ts` | Barrel export |

### Constants (`lib/constants/`)
| File | Purpose |
|------|---------|
| `routes.ts` | `ROUTES` object: HOME, ESSAY, QUESTIONS, NEWS, COMMUNITY, ACCOUNT, etc. |
| `navigation.ts` | `NAV_LINKS` (header), `FOOTER_LINKS` (footer) with href + label |
| `seo.ts` | `SEO` config: site name, title template, description, locale, images; `THEME_COLORS` |
| `index.ts` | Barrel export |

### Root Utilities
| File | Purpose |
|------|---------|
| `lib/admin-auth.ts` | `authorizeAdmin()`: Bearer token or cron secret validation against email allowlist |
| `lib/errors.ts` | `isAbortError()`: detect AbortError from browser/Node.js |
| `lib/security.ts` | Zod schemas (email, password, uuid, pagination), `handleApiError()`, `sanitizeString()` |
| `lib/news-import.ts` | NewsAPI import: fetch, normalize, dedupe, insert articles |
| `lib/schedule.ts` | Operating hours via RapidAPI/WorldTimeAPI (7:00-23:30 São Paulo) |
| `lib/with-timeout.ts` | `withTimeout()`: promise timeout wrapper (default 10s) |

---

## 7. SUPABASE SCHEMA

### Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `user_profiles` | User profile data | user_id, nome_completo, avatar_url, bio, objetivo, ano_enem, community_* settings |
| `user_statistics` | Aggregated performance stats | user_id, total_redacoes, media_nota_redacao, melhor/pior_nota, media_competencia1-5, quiz totals per discipline |
| `user_goals` | Learning targets | user_id, tipo (redacao_nota_minima/questoes_acerto_minimo/estudar_disciplina/praticar_competencia), valor_alvo, prazo, progresso, concluida |
| `user_achievements` | Earned badges | user_id, achievement_id, earned_at, metadata |
| `achievements` | Achievement definitions | slug, name, description, icon, criteria (JSONB) |
| `essay_results` | AI essay corrections | user_id, nota (0-1000), competencia1-5 (JSONB), feedback_geral, ponto_fortes[], pontos_a_melhorar[], redacao_original, tema, texto_apoio1/2, origem (IA/Simulação) |
| `cached_themes` | Pre-generated essay themes | tema, texto_apoio1, texto_apoio2, usado_count |
| `quiz_results` | Quiz performance records | user_id, total_questions, correct/wrong/unanswered, score, disciplines[], questions_data (JSONB), answers_data (JSONB) |
| `noticias` | News articles | titulo, slug, resumo, conteudo, imagem_url, autor, data_publicacao, tags[], destaque, fonte_url, search_vector (tsvector) |
| `community_topics` | Forum categories | slug, title, description |
| `community_posts` | Forum threads | topic_id, user_id, title, content, status (published/archived), last_activity_at |
| `community_comments` | Forum replies | post_id, user_id, content, status (visible/hidden) |
| `community_post_likes` | Post engagement | post_id, user_id (unique constraint) |
| `analytics_events` | Usage tracking | event_type (enum), metadata (JSONB), user_ip, user_agent, user_id |
| `rate_limits` | Request throttling | identifier, endpoint, request_count, window_start |
| `configuracoes` | System settings | chave (unique), valor |

### Enums
- `event_type_enum`: essay_submitted, essay_viewed, theme_generated, theme_cached, quiz_started, quiz_completed, page_view, error_occurred

### Functions
- `recalculate_user_statistics(target_user_id)`: Aggregates essay + quiz data into user_statistics (SECURITY DEFINER)
- `cleanup_old_rate_limits()`: Deletes rate_limits older than 1 hour
- `update_updated_at_column()`: Trigger function for auto-updating `updated_at`

### RLS Policies
- All tables have RLS enabled
- Users can only read/write their own data (via `auth.uid()`)
- `service_role` has full access on all tables
- Community content is publicly readable (when status = 'visible'/'published')
- Achievements are publicly readable

---

## 8. ENVIRONMENT VARIABLES

| Variable | Purpose | Context |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key | Client |
| `SUPABASE_URL` | Alternative Supabase URL | Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key (bypasses RLS) | Server only |
| `NEXT_PUBLIC_SUPABASE_TIMEOUT_MS` | Query timeout in ms | Client |
| `GROQ_API_KEY` | Primary Groq LLM API key | Server only |
| `GROQ_FALLBACK_API_KEY` | Fallback Groq key (rate limit resilience) | Server only |
| `GROQ_MODEL` | Primary LLM model (default: openai/gpt-oss-120b) | Server only |
| `GROQ_FALLBACK_MODEL` | Fallback model (default: llama3-70b-8192) | Server only |
| `NEWSAPI_API_KEY` | NewsAPI.org key for imports | Server only |
| `RAPIDAPI_KEY` | RapidAPI key (World Time API) | Server only |
| `STRIPE_SECRET_KEY` | Stripe secret key | Server only |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key | Client |
| `SITE_URL` | Internal site URL | Server |
| `NEXT_PUBLIC_SITE_URL` | Public site URL for redirects | Client + Server |
| `ADMIN_ALLOWED_EMAILS` | Comma-separated admin email allowlist | Server only |

---

## 9. EXTERNAL INTEGRATIONS

| Service | Purpose | Files Using It |
|---------|---------|---------------|
| **Supabase** | Database, Auth, RLS, Realtime | `lib/supabase/*`, `lib/db/*`, `lib/auth/*`, all API routes |
| **Groq** | LLM for essay correction, quiz generation, theme generation, AI news search | `lib/ai/*`, `/api/corrigir`, `/api/questoes`, `/api/gerar-tema`, `/api/noticias/gpt-busca` |
| **Stripe** | Donation payments | `/api/doacao/checkout`, `/api/doacao/webhook`, `app/doacao/*` |
| **NewsAPI** | News article import | `lib/news-import.ts`, `/api/noticias/importar` |
| **RapidAPI** (World Time) | São Paulo timezone for operating hours | `lib/schedule.ts`, `lib/server/operating-hours.ts` |
| **Vercel Analytics** | Page view and performance tracking | `app/layout.tsx` |
| **Vercel Speed Insights** | Core Web Vitals monitoring | `app/layout.tsx` |
| **Google AdSense** | Ad monetization | `app/components/shared/AdSenseLoader.tsx` |

---

## 10. CONFIGURATION FILES

| File | Purpose |
|------|---------|
| `next.config.ts` | Next.js config: strict mode, no powered-by header, wildcard image remotes, security headers (CSP, HSTS, X-Frame-Options) |
| `tailwind.config.js` | Tailwind config: darkMode via `[data-theme="dark"]` selector, custom colors mapped to CSS vars, extended theme |
| `tsconfig.json` | TypeScript config |
| `vercel.json` | Vercel cron: `/api/atualizarDestaques` daily at 00:00 UTC |
| `middleware.ts` | Next.js middleware: session refresh via `updateSession()`, applies to all routes except static assets |
| `next-sitemap.config.js` | Sitemap generation config |
| `eslint.config.mjs` | ESLint config |
| `postcss.config.mjs` | PostCSS config |
| `package.json` | Dependencies: React 19, Next.js 16, Supabase SSR, Stripe, Groq SDK, Recharts, Luxon, Motion, Zod |

---

## 11. TYPE DEFINITIONS (types/)

| File | Key Types |
|------|-----------|
| `types/index.ts` | `EssaySubmission`, `EssayResult` (5 competencies), `Noticia`, `Alternative`, `Question`, `QuizResult` |
| `types/supabase.ts` | Auto-generated Supabase types for all tables and enums |
| `types/deno-runtime.d.ts` | Deno runtime types (edge functions) |
| `types/edge-modules.d.ts` | Edge function module types |
| `types/postgrest-augment.d.ts` | PostgREST API augmentation types |

---

## 12. MIDDLEWARE

`middleware.ts` — Calls `updateSession()` from `lib/supabase/middleware.ts` to refresh auth state. Matcher applies to all routes except `_next/static`, `_next/image`, `favicon.ico`, and image files.
