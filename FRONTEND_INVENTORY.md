# PROJECT INVENTORY — Foco no ENEM

> Snapshot generated from the repository state on 2026-04-21.
> This document is repo-first: if something is not present in the tree or current import graph, it is intentionally not claimed here.
> Despite the historical file name, this inventory covers both frontend and active backend code in the Next.js app.

---

## 1. Current Scope

The current application is a full-stack Next.js 16 project with:

- public marketing and legal pages
- auth flows with Supabase
- ENEM essay flow with AI theme generation, correction and OCR support
- quiz flow with generated questions and result persistence
- approved-news feed, admin moderation/import and AI summaries based on stored articles
- account dashboard, profile editing and account deletion with password confirmation
- Stripe donation checkout and webhook handling

The active runtime lives in:

- `app/` for pages, layouts and route handlers
- `lib/` for business logic and integrations
- `supabase/migrations/` for local schema history

The repository does **not** currently ship local Supabase Edge Function code. `supabase/functions/` contains only legacy documentation.

---

## 2. Route Surface

### Root and feature routes

| Route | Files | Purpose |
| --- | --- | --- |
| `/` | `app/page.tsx`, `app/HomePageClient.tsx` | Landing page |
| `/redacao` | `app/redacao/page.tsx`, `app/redacao/RedacaoPageClient.tsx`, `app/redacao/PhotoUpload.tsx` | Essay workflow, OCR upload support, correction UI |
| `/questoes` | `app/questoes/page.tsx`, `app/questoes/QuestoesPageClient.tsx` | Quiz generation, answering and result flow |
| `/noticias` | `app/noticias/page.tsx`, `app/noticias/NoticiasPageClient.tsx` | Public news feed |
| `/noticias/[slug]` | `app/noticias/[slug]/page.tsx` | Approved news detail |
| `/noticias/pesquisa` | `app/noticias/pesquisa/page.tsx` | News search page |
| `/noticias/admin` | `app/noticias/admin/page.tsx` | News admin panel |
| `/conta` | `app/conta/page.tsx`, `app/conta/ContaPageClient.tsx` | Account dashboard |
| `/conta/editar` | `app/conta/editar/page.tsx`, `app/conta/editar/ContaEditarPageClient.tsx` | Profile editing |
| `/resultados/[id]` | `app/resultados/[id]/page.tsx`, `app/resultados/[id]/ResultadosPageClient.tsx` | Essay result view |
| `/doacao` | `app/doacao/page.tsx` | Donation page |
| `/doacao/sucesso` | `app/doacao/sucesso/page.tsx` | Donation success page |
| `/sobre` | `app/sobre/page.tsx` | About page |
| `/privacidade` | `app/privacidade/page.tsx` | Privacy policy |
| `/termos` | `app/termos/page.tsx` | Terms page |

### Auth routes

| Route | Files | Purpose |
| --- | --- | --- |
| `/login` | `app/(auth)/login/page.tsx`, `app/(auth)/login/LoginForm.tsx` | Main login UI |
| `/register` | `app/(auth)/register/page.tsx`, `app/(auth)/register/RegisterForm.tsx` | Main registration UI |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | Password reset request |
| `/reset-password` | `app/(auth)/reset-password/page.tsx` | Password reset completion |
| `/(auth)` layout | `app/(auth)/layout.tsx` | Shared auth layout |
| `/auth/callback` | `app/auth/callback/route.ts` | OAuth callback and session exchange |
| `/auth/auth-code-error` | `app/auth/auth-code-error/page.tsx` | OAuth error page |
| `/auth/login` | `app/auth/login/page.tsx` | Redirect alias to `/login` |
| `/auth/register` | `app/auth/register/page.tsx` | Redirect alias to `/register` |

### Deprecated auth client files

| File | Status |
| --- | --- |
| `app/auth/login/LoginPageClient.tsx` | Deprecated placeholder, intentionally unused |
| `app/auth/register/RegisterPageClient.tsx` | Deprecated placeholder, intentionally unused |

### Root app shell

| File | Purpose |
| --- | --- |
| `app/layout.tsx` | Root metadata, global shell, telemetry toggles, theme boot script |
| `app/providers.tsx` | Wraps `AuthProvider` and `ThemeProvider` |
| `app/styles/index.css` | CSS entrypoint |

---

## 3. API Surface

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/admin/manutencao` | `GET`, `POST` | Admin/cron cleanup of cached themes, rate limits and analytics rows |
| `/api/atualizarDestaques` | `GET` | Admin/cron refresh of approved news highlights using Groq |
| `/api/conquistas` | `POST` | Evaluate and sync unlocked user achievements |
| `/api/conta/dados` | `GET` | Account dashboard payload |
| `/api/conta/excluir` | `POST` | Delete the authenticated account after password confirmation |
| `/api/conta/recalcular` | `POST` | Recalculate aggregated user statistics |
| `/api/corrigir` | `GET`, `POST` | Fetch stored essay by query-string ID / submit essay for correction |
| `/api/destaques/remover` | `POST` | Remove highlight status from selected news |
| `/api/doacao/checkout` | `POST` | Create Stripe Checkout session |
| `/api/doacao/webhook` | `POST` | Process Stripe webhook |
| `/api/gerar-tema` | `GET` | Serve cached essay theme or generate a new one |
| `/api/noticias` | `GET` | List approved news |
| `/api/noticias/[slug]` | `GET` | Fetch a single approved article |
| `/api/noticias/admin` | `GET`, `POST` | Redirect helper to admin page / reject direct POST usage |
| `/api/noticias/admin/moderar` | `POST` | Moderate news records |
| `/api/noticias/admin/status` | `GET` | Admin authorization status |
| `/api/noticias/busca` | `GET` | Text search over approved news |
| `/api/noticias/destaques/status` | `GET` | Status of the last highlights refresh |
| `/api/noticias/gpt-busca` | `POST` | AI summary based only on approved news stored in DB |
| `/api/noticias/importar` | `POST` | Admin import from NewsAPI |
| `/api/ocr` | `POST` | OCR via Gemini Vision |
| `/api/questoes` | `GET`, `POST` | Generate quiz questions / persist quiz result |
| `/api/resultados/[id]` | `GET` | Fetch essay result by route param |
| `/api/schedule/time` | `GET` | Return current Brazil datetime and fallback source |
| `/auth/callback` | `GET` | OAuth code exchange route |

---

## 4. Components and UI Files

### Layout and shared shell

| File | Purpose |
| --- | --- |
| `app/components/layout/Header.tsx` | Header, auth menu, theme toggle and mobile navigation |
| `app/components/layout/Footer.tsx` | Footer links and branding |
| `app/components/layout/index.ts` | Barrel for layout components |

### Quiz feature components

| File | Purpose |
| --- | --- |
| `app/components/features/quiz/QuestionCard.tsx` | Quiz question card |
| `app/components/features/quiz/QuizResults.tsx` | Quiz result summary |
| `app/components/features/quiz/index.ts` | Barrel for quiz components |

### Placeholder barrels

| File | Current state |
| --- | --- |
| `app/components/shared/index.ts` | Empty barrel |
| `app/components/ui/index.ts` | Empty barrel |

---

## 5. Styling Files

| File | Purpose |
| --- | --- |
| `app/styles/index.css` | Imports design tokens and base styles |
| `app/styles/tokens.css` | CSS variables and theme tokens |
| `app/styles/base.css` | Base element styles and utilities used by the app shell |

There are currently no separate `components.css`, `forms.css` or `utilities.css` files in the repository.

---

## 6. Library Map

### `lib/ai/`

| File | Purpose |
| --- | --- |
| `lib/ai/gemini.ts` | OCR extraction through Gemini |
| `lib/ai/groq.ts` | Groq provider factory and rate-limit helpers |
| `lib/ai/parse-json.ts` | Safe JSON extraction from model output |
| `lib/ai/retry.ts` | Retry/fallback orchestration for Groq-backed tasks |

### `lib/auth/`

| File | Purpose |
| --- | --- |
| `lib/auth/achievements-service.ts` | Achievement reads for the authenticated user |
| `lib/auth/constants.ts` | Auth constants and route references |
| `lib/auth/context.tsx` | `AuthProvider` and auth state management |
| `lib/auth/goals-service.ts` | Goal CRUD |
| `lib/auth/index.ts` | Barrel |
| `lib/auth/profile-service.ts` | Profile CRUD |
| `lib/auth/security.ts` | Auth-side security helpers |
| `lib/auth/service.ts` | Sign-in, sign-up, reset and session refresh flows |
| `lib/auth/stats-service.ts` | Statistics reads and recalculation |
| `lib/auth/types.ts` | Auth and profile-related types |
| `lib/auth/validation.ts` | Email/password validation helpers |

### `lib/constants/`

| File | Purpose |
| --- | --- |
| `lib/constants/index.ts` | Barrel |
| `lib/constants/navigation.ts` | Centralized nav/footer link definitions |
| `lib/constants/routes.ts` | Route constants |
| `lib/constants/seo.ts` | Reusable SEO constants |

### `lib/contexts/`

| File | Purpose |
| --- | --- |
| `lib/contexts/ThemeContext.tsx` | Theme state, persistence and `themeScript` |
| `lib/contexts/index.ts` | Barrel |

### `lib/db/`

| File | Purpose |
| --- | --- |
| `lib/db/client.ts` | Browser DB helpers and timeout/error helpers |
| `lib/db/index.ts` | Barrel |
| `lib/db/server.ts` | Server and admin Supabase client wrappers |
| `lib/db/transformers.ts` | Row/model transformation helpers |
| `lib/db/types.ts` | DB-layer application types |
| `lib/db/repositories/analytics.ts` | Analytics persistence/query helpers |
| `lib/db/repositories/essays.ts` | Essay result and cached theme helpers |
| `lib/db/repositories/news.ts` | News persistence and search helpers |
| `lib/db/repositories/quizzes.ts` | Quiz result helpers |
| `lib/db/repositories/users.ts` | User/profile/statistics/goal helpers |

### `lib/hooks/`

| File | Purpose |
| --- | --- |
| `lib/hooks/index.ts` | Barrel |
| `lib/hooks/useOutsideClick.ts` | Outside-click detection |
| `lib/hooks/useScrollPosition.ts` | Scroll state hook |

### `lib/server/`

| File | Purpose |
| --- | --- |
| `lib/server/analytics.ts` | Server-side analytics event logging |
| `lib/server/auth-request.ts` | Resolve authenticated user from cookies/token |
| `lib/server/brazil-time.ts` | Brazil timezone helpers based on local server time |
| `lib/server/conta.ts` | Account dashboard data assembly and stat recalculation |
| `lib/server/noticias.ts` | Read-only approved news access for public routes |
| `lib/server/operating-hours.ts` | Business-hours evaluation |
| `lib/server/page-auth.ts` | Server-side page guards for authenticated routes |
| `lib/server/rate-limit.ts` | Server-side rate limiting |

### `lib/supabase/`

| File | Purpose |
| --- | --- |
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/supabase/middleware.ts` | Session refresh and security headers used by `proxy.ts` |
| `lib/supabase/server.ts` | SSR Supabase client with cookie bridge |

### Root-level utilities in `lib/`

| File | Purpose |
| --- | --- |
| `lib/admin-auth.ts` | Admin authorization and audit-log helper |
| `lib/errors.ts` | Generic error helpers |
| `lib/news-import.ts` | NewsAPI fetch/normalize/dedupe/import pipeline |
| `lib/schedule.ts` | Client-side operating-hours helper via `/api/schedule/time` |
| `lib/security.ts` | Generic API input and error helpers |

---

## 7. Environment Variables Actually Read by Code

| Variable | Used by | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | app, SSR, admin and public DB access | Required for normal runtime |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser auth/public reads/SSR | Required for normal runtime |
| `NEXT_PUBLIC_SITE_URL` | root metadata, redirect safety | Recommended |
| `SITE_URL` | sitemap generation | Build-time |
| `SUPABASE_SERVICE_ROLE_KEY` | admin writes, analytics, imports, maintenance | Required for privileged server flows |
| `GROQ_API_KEY` | essay, themes, quiz generation, AI news summary | Primary IA key |
| `GROQ_MODEL` | Groq integration | Optional override |
| `GROQ_FALLBACK_API_KEY` | Groq integration | Optional fallback provider |
| `GROQ_FALLBACK_MODEL` | Groq integration | Optional fallback model |
| `GROQ_MAX_ATTEMPTS` | Groq retry logic | Optional |
| `GEMINI_API_KEY` | `/api/ocr` | Optional OCR feature |
| `NEWSAPI_API_KEY` | news import | Preferred NewsAPI variable |
| `NEWSAPI_KEY` | news import | Accepted alias |
| `ADMIN_ALLOWED_EMAILS` | admin auth | Comma-separated allowlist |
| `ADMIN_CRON_SECRET` | admin cron auth | Accepted secret alias |
| `CRON_SECRET` | admin cron auth | Preferred secret name in Vercel cron context |
| `STRIPE_SECRET_KEY` | donation checkout and webhook | Required for donation backend |
| `STRIPE_WEBHOOK_SECRET` | donation webhook | Required if webhook is enabled |
| `NODE_ENV` | root layout telemetry toggle | Standard runtime variable |

The codebase does **not** currently read `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

---

## 8. Types and Data Files

| File | Purpose |
| --- | --- |
| `types/index.ts` | Shared app types |
| `types/postgrest-augment.d.ts` | PostgREST type augmentations |
| `types/supabase.ts` | Generated Supabase database types |

---

## 9. Supabase Assets

| Path | Purpose |
| --- | --- |
| `supabase/migrations/` | Local migration history |
| `supabase/remote-latest.sql` | Remote schema snapshot/reference |
| `supabase/scripts/20250210_export_user_data.sql` | Data export helper script |
| `supabase/functions/README.md` | Legacy Edge Function audit and operational note |

As of the latest audit documented in `supabase/functions/README.md`, remote Edge Functions may still exist in the Supabase project, but the repository no longer depends on them at runtime.

---

## 10. Public and Verification Assets

| File | Purpose |
| --- | --- |
| `public/robots.txt` | Search engine policy and sitemap reference |
| `public/sitemap.xml` | Generated sitemap |
| `public/ads.txt` | Google publisher declaration |
| `public/BingSiteAuth.xml` | Bing verification |
| `public/google085fc0ba40da0037.html` | Google verification |
| `public/.well-known/discord` | External verification/integration artifact |
| `public/foconoenemicon.png` | Primary app icon |
| `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` | Static SVG assets currently present in the repo |

---

## 11. Config Files

| File | Purpose |
| --- | --- |
| `next.config.ts` | Next.js config, remote image hosts and security headers |
| `next-sitemap.config.js` | Sitemap and robots generation rules |
| `proxy.ts` | Session-refresh proxy matcher |
| `eslint.config.mjs` | Flat ESLint config based on Next core-web-vitals |
| `postcss.config.mjs` | PostCSS config |
| `tailwind.config.js` | Tailwind configuration |
| `tsconfig.json` | TypeScript config |
| `vercel.json` | Cron definitions for highlights refresh and maintenance |
| `package.json` | Scripts and dependencies |

---

## 12. Operational Notes

- `npm run build` performs both the production build and sitemap regeneration.
- `npm run lint` is the active static validation command in the repo.
- There is no automated test suite checked into the project today.
- `app/components/shared/index.ts` and `app/components/ui/index.ts` are present but currently empty.
- `app/auth/login/LoginPageClient.tsx` and `app/auth/register/RegisterPageClient.tsx` are deprecated placeholders.
- The current runtime path is Next.js route handlers under `app/api`; Supabase Edge Functions are legacy only.
- The repository does not contain an active community/forum subsystem anymore.
