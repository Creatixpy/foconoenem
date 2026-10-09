# PROJECT INVENTORY — AprovIA

> Local file-structure review on 2026-09-30; this review does not verify remote services.
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
- account dashboard, profile editing, Max subscription management with 7-day trial and account deletion with password confirmation
- Stripe donation checkout, Max subscription billing and shared webhook handling

The active runtime lives in:

- `app/` for pages, layouts and route handlers
- `lib/` for business logic and integrations
- `supabase/migrations/` for local schema history

The repository contains no active Supabase Edge Functions. Runtime APIs are Next.js Route Handlers.

---

## 2. Route Surface

### Root and feature routes

| Route | Files | Purpose |
| --- | --- | --- |
| `/` | `app/page.tsx`, `app/_components/home/*.tsx` | Landing page composed from four Server Components |
| `/redacao` | `app/redacao/page.tsx`, `app/redacao/RedacaoPageClient.tsx`, `app/redacao/useEssayWorkflow.ts`, `app/redacao/_components/*`, `app/redacao/essay-presentation.ts`, `app/redacao/PhotoUpload.tsx`, `app/redacao/prepareOcrImage.ts` | Continuous theme/editor/correction flow with local presentation components and dynamically loaded photo upload; timestamped per-origin/user local drafts, confirmed OCR replacement, single accessible word counter and guarded correction UI |
| `/questoes` | `app/questoes/page.tsx`, `app/questoes/QuestoesPageClient.tsx`, `app/questoes/use-quiz-workflow.ts`, `app/questoes/quiz-api.ts` | Page composition, workflow state/persistence and validated HTTP requests separated; same-tab recovery, native radios, previous/review navigation and frozen manual submission retries |
| `/planos` | `app/planos/page.tsx`, `app/planos/PlanosPageClient.tsx` | Free/Max comparison, subscription status, checkout and portal entry points |
| `/noticias` | `app/noticias/page.tsx`, `app/noticias/NoticiasPageClient.tsx`, `app/noticias/error.tsx` | Public feed with background highlights refresh, recoverable pagination and segment errors |
| `/noticias/[slug]` | `app/noticias/[slug]/page.tsx`, `app/noticias/[slug]/article.module.css` | Sanitized article with local typography and optional related content; missing articles preserve 404 |
| `/noticias/pesquisa` | `app/noticias/pesquisa/page.tsx` | URL-driven archive/AI search (`q`, optional `modo=ia`) with history synchronization |
| `/noticias/admin` | `app/noticias/admin/page.tsx` | News admin panel |
| `/conta` | `app/conta/page.tsx`, `app/conta/ContaPageClient.tsx` | Account dashboard, URL-selected history (`aba=redacoes`) and Max subscription management (`#plano`) |
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

### Root app shell

| File | Purpose |
| --- | --- |
| `app/layout.tsx` | Root metadata, fonts, dark-only global shell, rebranding banner and consent-aware telemetry |
| `app/auth-providers.tsx` | Client `AuthProvider` wrapper; protected server pages can pass the already validated user to avoid duplicate client auth validation |
| `app/styles/index.css` | CSS entrypoint |

### Privacy components

| File | Purpose |
| --- | --- |
| `app/components/privacy/ConsentAwareTelemetry.tsx` | Cookie preferences panel and consent-gated Vercel Analytics/Speed Insights loading |
| `app/components/privacy/CookiePreferencesButton.tsx` | Footer control that reopens cookie preferences |
| `public/cookie-consent-init.js` | Pre-hydration flag that prevents a saved cookie preference from flashing the SSR banner on reload |

---

### Study shell and canonical navigation

- Canonical metadata and sitemap use `aproviaedu.vercel.app`. Public GET/HEAD content on the former domain receives 301; auth, study, account, payments, admin and APIs retain their original host.
- `lib/contracts/page-metadata.ts` composes page titles, canonical URLs and private-page robots rules; `lib/contracts/site-routing.ts` defines the public redirect allowlist.
- Account navigation uses an avatar disclosure, existing mobile hamburger and query-selected history. Workspace footers are compact; public news retains the full footer.
- Redação keeps the 5,000-character validation contract, displaying it only when violated. Draft timestamp metadata is optional for backwards compatibility; photos remain in memory.
- Rebrand dismissal tolerates unavailable storage and expires on 2026-10-30; the legacy workspace notice has independent per-session dismissal.

## 3. API Surface

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/conta/dados` | `GET` | Account dashboard payload |
| `/api/conta/excluir` | `POST` | Delete the authenticated account after password confirmation and purge user-owned quiz attempts, essays, quizzes and analytics |
| `/api/conta/recalcular` | `POST` | Recalculate aggregated user statistics |
| `/api/corrigir` | `POST` | Accept `{ submissionId, redacao, theme }`, resolve canonical theme data and persist one validated correction |
| `/api/assinatura/checkout` | `POST` | Start Stripe Subscription Checkout for the Max plan, with a 7-day trial when eligible |
| `/api/assinatura/portal` | `POST` | Open Stripe Billing Portal for the authenticated user |
| `/api/assinatura/status` | `GET` | Return authentication state and the current Free/Max subscription summary |
| `/api/doacao/checkout` | `POST` | Create Stripe Checkout session and persist `donation_checkouts` |
| `/api/doacao/webhook` | `POST` | Process donation and subscription Stripe webhooks with idempotent persistence |
| `/api/gerar-tema` | `POST` | Atomically claim/generate a canonical theme and return its `themeId` plus support texts |
| `/api/perfil` | `GET`, `POST`, `PATCH` | Server-side profile reads and writes for the authenticated user |
| `/api/noticias` | `GET` | List approved news and refresh stale highlights on demand when requested |
| `/api/noticias/[slug]` | `GET` | Fetch a single approved article |
| `/api/noticias/admin/moderar` | `POST` | Moderate news records |
| `/api/noticias/admin/status` | `GET` | Admin authorization status |
| `/api/noticias/busca` | `GET` | Bounded text search over approved news |
| `/api/noticias/destaques/status` | `GET` | Status of the last highlights refresh |
| `/api/noticias/gpt-busca` | `POST` | AI summary based only on approved news stored in DB |
| `/api/noticias/importar` | `POST` | Admin import from NewsAPI |
| `/api/ocr` | `POST` | Authenticated in-memory OCR with typed errors and stable Gemini model fallback |
| `/api/questoes` | `POST`, `PATCH` | Create by `{ requestId, disciplines }` without exposing answers / finalize by `{ attemptId, selectedAnswers }` with canonical review |
| `/auth/callback` | `GET` | OAuth code exchange route |

---

## 4. Components and UI Files

### Homepage sections

| File | Purpose |
| --- | --- |
| `app/_components/home/HomeHero.tsx` | Main introduction and study entry points |
| `app/_components/home/HomeFeatures.tsx` | Core study tools |
| `app/_components/home/HomeHowItWorks.tsx` | Three-step study flow |
| `app/_components/home/HomeStart.tsx` | Final call to start studying |

These Server Components are private to the homepage; `app/page.tsx` handles their composition and metadata.

### Layout and shared shell

| File | Purpose |
| --- | --- |
| `app/components/layout/Header.tsx` | Header, auth menu and compact navigation below the desktop breakpoint |
| `app/components/layout/Footer.tsx` | Footer links and branding |
| `app/components/shared/AprovIALogo.tsx` | Reusable responsive AprovIA symbol and wordmark |
| `app/components/shared/FlowStatus.tsx` | Shared accessible status/error presentation |
| `app/components/shared/RebrandingBanner.tsx` | Dismissible transition notice backed by local storage |

### Quiz feature components

| File | Purpose |
| --- | --- |
| `app/components/features/quiz/QuestionCard.tsx` | Quiz question card |
| `app/components/features/quiz/QuizResults.tsx` | Quiz result summary |

### Study workflow files

| File | Purpose |
| --- | --- |
| `app/redacao/_components/ThemeSection.tsx` | Generated/manual theme selection, support text and generation feedback |
| `app/redacao/_components/RequirementsChecklist.tsx` | Accessible theme and essay requirement states |
| `app/redacao/_components/icons.tsx` | Icons private to the essay page |
| `app/redacao/essay-presentation.ts` | Pure word-count, draft, submit-label and requirement presentation helpers |
| `app/redacao/useEssayWorkflow.ts` | User-isolated draft, theme requests, correction identity and cancellation |
| `app/redacao/PhotoUpload.tsx` | Dynamically loaded OCR upload/review and confirmed text replacement |
| `app/questoes/use-quiz-workflow.ts` | User/tab draft recovery, attempt creation, navigation and frozen submission retries |
| `app/questoes/quiz-api.ts` | Cancelable POST/PATCH requests with strict answer-safe response validation |

### News feature files

| File | Purpose |
| --- | --- |
| `app/noticias/hooks.ts` | Cancelable public feed, background highlights, article lookup and archive/AI queries; stale completions are ignored |
| `app/noticias/useNewsSearch.ts` | URL/history synchronization and shared search orchestration |
| `app/noticias/SearchForm.tsx` | Labeled archive/AI search form |
| `app/noticias/error.tsx` | Retry/recovery for unavailable news segments |
| `app/noticias/[slug]/ShareButton.tsx` | Copy-link control with selected manual-copy fallback |

---

## 5. Styling Files

| File | Purpose |
| --- | --- |
| `app/styles/index.css` | Imports design tokens and base styles |
| `app/styles/tokens.css` | Dark-only AprovIA design tokens |
| `app/styles/base.css` | Base/app-shell styles and scoped student touch targets, focus and reduced motion |
| `app/noticias/[slug]/article.module.css` | Local article paragraphs, headings, lists, quotes and links |

There are currently no separate `components.css`, `forms.css` or `utilities.css` files in the repository.

---

## 6. Library Map

### `lib/ai/`

| File | Purpose |
| --- | --- |
| `lib/ai/gemini.ts` | Gemini OCR adapter with 25-second per-model cancellation, no provider initialization for an aborted request and SDK retries disabled |
| `lib/ai/ocr-routing.ts` | Quality-first stable model order, readable-output validation and typed fallback errors |
| `lib/ai/groq.ts` | Groq provider factory, current fallback model and retryable-error classification |
| `lib/ai/retry.ts` | Global two-attempt retry/fallback budget; SDK retries remain disabled |

### `lib/contracts/`

| File | Purpose |
| --- | --- |
| `lib/contracts/essay.ts` | Strict Zod contracts for themes, submissions, ENEM competences and API responses |
| `lib/contracts/essay-input.ts` | Shared client word/character and manual-theme validation |
| `lib/contracts/student-drafts.ts` | Validated essay/quiz draft shapes and frozen quiz submission snapshot |
| `lib/contracts/ocr.ts` | Shared OCR MIME, payload, error-code and success-response contracts |
| `lib/contracts/quiz.ts` | Strict question, attempt and review contracts plus public answer-safe serialization |
| `lib/contracts/quiz-result.ts` | Neutral validation/mapping of persisted quiz snapshots |
| `lib/contracts/operating-hours.ts` | Shared São Paulo availability calculation; verified-user Max validity permits 24-hour presentation and expires back to the Free schedule |

### `lib/client/`

| File | Purpose |
| --- | --- |
| `lib/client/drafts.ts` | Versioned, user-isolated stores; explicit logout invalidation across tabs; unavailable/corrupt storage handling |
| `lib/client/use-user-draft.ts` | Restore before saving and persist changes/IDs before network work |
| `lib/client/api-errors.ts` | Student-facing API errors and `resetAt`/`Retry-After` interpretation |
| `lib/client/latest-request.ts` | Cancel/invalidate stale completions and deduplicate articles by ID |
| `lib/client/use-operating-hours.ts` | Refresh time and verified-user subscription availability each minute and on tab return; discard late responses for another user and retain bounded hints during transient failures |
| `lib/client/operating-hours-api.ts` | Cancelable no-store subscription-status requests and strict ownership/validity parsing for availability hints |
| `lib/client/use-retry-delay.ts` | Visible manual-retry cooldown |

### `lib/auth/`

| File | Purpose |
| --- | --- |
| `lib/auth/constants.ts` | Auth constants and route references |
| `lib/auth/context.tsx` | `AuthProvider`, verified initial bootstrap and explicit-only draft cleanup; automatic expiry keeps work |
| `lib/auth/profile-service.ts` | Client wrapper around `/api/perfil` |
| `lib/auth/security.ts` | Auth-side security helpers |
| `lib/auth/service.ts` | Sign-in, sign-up, reset and session refresh flows |
| `lib/auth/types.ts` | Auth and profile-related types |
| `lib/auth/validation.ts` | Email/password validation helpers |

### `lib/constants/`

| File | Purpose |
| --- | --- |
| `lib/constants/plans.ts` | Free/Max marketing comparison and shared plan presentation data |
| `lib/constants/subscriptions.ts` | Max plan code, monthly price, trial length and subscription types |

### `lib/db/`

| File | Purpose |
| --- | --- |
| `lib/db/server.ts` | Server-only client factories; sessionless admin client reused by configuration and SSR clients isolated per request |
| `lib/db/query.ts` | Typed `runQuery`, operation deadlines including SDK retry waits and database errors |
| `lib/db/repositories/essays.ts` | Essay result, canonical theme and idempotent submission RPC adapters with 8-second cancellation |
| `lib/db/repositories/quizzes.ts` | Atomic question catalog, request-id attempt and canonical submission RPC adapters; 8-second default cancellation and 4-second attempt-recovery queries |
| `lib/db/repositories/accounts.ts` | Parallel owner-filtered account history/statistics/subscription reads and statistics recalculation with 8-second deadlines |
| `lib/db/repositories/profiles.ts` | Owner-filtered profile reads/writes and idempotent statistics initialization without replacing existing totals |
| `lib/db/repositories/news.ts` | Approved news queries, stable ordering, search and empty-highlight fallback with operation cancellation |

### `lib/server/`

| File | Purpose |
| --- | --- |
| `lib/server/admin-auth.ts` | Admin authorization and optional audit logging; shared maintenance signal or its own 4-second deadline |
| `lib/server/analytics.ts` | Optional server-side analytics event logging with 4-second insert cancellation |
| `lib/server/auth-request.ts` | Resolve the verified authenticated user from SSR cookies |
| `lib/server/brazil-time.ts` | Brazil timezone helpers based on local server time |
| `lib/server/conta.ts` | Account repository orchestration and numeric/subscription presentation mapping |
| `lib/server/donations.ts` | Donation webhook persistence and checkout-status synchronization |
| `lib/server/local-maintenance.ts` | On-demand atomic cleanup of rate limits, analytics, themes, attempts, unreferenced questions and essay claims; each maintenance RPC plus audit uses one 8-second cancellation signal |
| `lib/server/news-content.ts` | Server-only sanitization of approved news HTML and external URLs |
| `lib/server/news-highlights.ts` | On-demand highlight refresh/status logic backed by `configuracoes` |
| `lib/server/news-import.ts` | Server-only NewsAPI fetch/normalize/dedupe/import pipeline |
| `lib/server/noticias.ts` | Server cache around approved news repositories; cache keys and 5-minute revalidation preserved |
| `lib/server/ocr-image.ts` | Server-only OCR upload size, MIME and magic-byte validation |
| `lib/server/operating-hours.ts` | Server clock wrapper and DB-backed, verified-user SSR availability snapshots |
| `lib/server/study-access.ts` | New-study runtime authorization: Max active/trialing with current access bypasses the daily schedule; Free keeps 07:00–23:30 and canonical replays precede plan loading |
| `lib/server/page-auth.ts` | Cached server-side page guards for authenticated routes |
| `lib/server/rate-limit.ts` | Atomic, fail-closed server-side rate limiting with 4-second operation cancellation |
| `lib/server/request-origin.ts` | Trusted-origin enforcement for stateful and authenticated APIs |
| `lib/server/security.ts` | Server-only API input and error helpers |
| `lib/server/subscription-return.ts` | Allowlisted return-path normalization for Stripe subscription flows |
| `lib/server/subscriptions.ts` | Max subscription summary, Stripe sync, customer provisioning and recoverable webhook claims |
| `lib/server/stripe.ts` | Shared Stripe server client helpers |

### `lib/server/ai/`

| File | Purpose |
| --- | --- |
| `lib/server/ai/provider.ts` | Plan-aware Groq runtime that preserves Free/Max behavior and provider retry metadata |
| `lib/server/ai/structured.ts` | Strict JSON parsing and schema validation with one bounded regeneration |

### `lib/server/essay/` and `lib/server/quiz/`

| File | Purpose |
| --- | --- |
| `lib/server/essay/ai.ts` | Injection-delimited prompts for theme, support and one-pass alignment/correction |
| `lib/server/essay/service.ts` | Idempotent correction and persistence orchestration; lazy AI runtime only after a new claim |
| `lib/server/essay/themes.ts` | Free/Max theme generation and canonical owner-checked resolution of generated themes or manual support texts |
| `lib/server/essay/result.ts` | Validated ENEM analysis to historical result snapshot mapping |
| `lib/server/essay/errors.ts` | Typed errors shared by theme and correction services |
| `lib/server/essay/fingerprint.ts` | Stable SHA-256 input fingerprint |
| `lib/server/quiz/generator.ts` | Strict per-discipline generation |
| `lib/server/quiz/concurrency.ts` | Ordered concurrency helper that stops scheduling after failure and waits for active jobs |
| `lib/server/quiz/service.ts` | Canonical attempt recovery before AI runtime loading; parallel plan/catalog reads, Free/Max selection, at most two concurrent generations and atomic attempt creation |

### `lib/supabase/`

| File | Purpose |
| --- | --- |
| `lib/supabase/client.ts` | SDK-managed browser client using shared public configuration and cancellable transport |
| `lib/supabase/config.ts` | Explicit public env access compatible with browser bundling and the shared 8-second HTTP deadline |
| `lib/supabase/transport.ts` | Caller cancellation and deadline across each HTTP response body; no additional retry policy |
| `lib/supabase/middleware.ts` | Session refresh preserving request/response cookies, security headers and SSR cache protections used by `proxy.ts` |
| `lib/supabase/server.ts` | Request-isolated SSR Supabase client with cookie bridge and bounded HTTP transport |

---

## 7. Environment Variables Actually Read by Code

| Variable | Used by | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | app, SSR and server DB access | Required for normal runtime |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser auth and SSR session handling | Required for normal runtime |
| `NEXT_PUBLIC_SITE_URL` | trusted request origins; canonical metadata uses site constant | Recommended |
| `SITE_URL` | trusted request origins; sitemap uses explicit canonical configuration | Optional |
| `SUPABASE_SERVICE_ROLE_KEY` | server DB access, admin writes, analytics, imports, maintenance, highlights, public news reads and payment persistence | Required for privileged server flows |
| `GROQ_API_KEY` | essay, themes, quiz generation, AI news summary | Required textual AI key for Free and Max |
| `GROQ_MODEL` | Groq integration | Optional override |
| `GROQ_FALLBACK_API_KEY` | Groq integration | Optional fallback provider |
| `GROQ_FALLBACK_MODEL` | Groq integration | Optional fallback model |
| `GROQ_MAX_ATTEMPTS` | Groq retry logic | Optional |
| `GEMINI_API_KEY` | `/api/ocr` | Optional OCR feature |
| `NEWSAPI_API_KEY` | news import | Preferred NewsAPI variable |
| `NEWSAPI_KEY` | news import | Accepted alias |
| `ADMIN_ALLOWED_EMAILS` | admin auth | Comma-separated allowlist |
| `STRIPE_SECRET_KEY` | donation checkout, subscription checkout, portal and webhook sync | Required for Stripe-backed billing |
| `STRIPE_WEBHOOK_SECRET` | donation and subscription webhook validation | Required if webhook is enabled |
| `STRIPE_MAX_PRICE_ID` | Max subscription checkout | Required recurring monthly price ID for the Max plan |
| `NODE_ENV` | root layout telemetry toggle | Standard runtime variable |
| `VERCEL` | root layout telemetry toggle | Automatically provided by Vercel |
| `VERCEL_PROJECT_PRODUCTION_URL` | trusted-origin validation | Automatically provided by Vercel when available |
| `VERCEL_URL` | trusted-origin validation | Automatically provided by Vercel when available |

The codebase does **not** currently read `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

---

## 8. Types and Data Files

| File | Purpose |
| --- | --- |
| `types/supabase.ts` | Generated Supabase database types |

---

## 9. Supabase Assets

| Path | Purpose |
| --- | --- |
| `supabase/migrations/` | Local migration history; schema changes are recorded here |

The stale remote schema snapshot and sensitive export helper were removed; use Supabase migrations plus MCP/CLI inspection as the source of truth.
System migrations: `20260717180319_reform_essay_quiz_systems.sql`, the validation follow-up `20260717181851_complete_system_idempotency.sql` and `20261008050718_fix_maintenance_timestamp_throttle.sql`. The latest migration makes maintenance throttling recognize legacy timestamps with either `T` or a space, tolerate invalid dates and write new timestamps in UTC ISO format; locking, retention, historical results and the server-only RPC signature/access are preserved.

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
| `public/favicon.svg` | Primary vector app icon |
| `public/manifest.json` | Web app manifest using the vector icon |
| `tests/systems/student-workflows.test.ts` | Draft isolation/logout, frozen IDs/answers, API errors, input limits, availability and stale requests |
| `tests/systems/news-detail.test.tsx` | Article preservation when related content fails, sanitization, genuine 404 and unavailable service |
| `docs/student-workflows-qa.md` | Workflow verification scenarios, results and limits of controlled browser QA |
| `docs/redacao-qa.md` | Essay presentation, shell, metadata and controlled-browser verification |
| `docs/database-refactor-qa.md` | Database integration refactor scope, reproducible coverage criterion and validation limits |
| `docs/max-hours-qa.md` | Max 24-hour access policy, unchanged frequency limits and focused verification |
| `tests/systems/operating-hours-access.test.ts` | Max expiry, verified-user isolation and subscription-response validation |
| `tests/systems/study-access.test.ts` | DB-backed entitlement status/expiry, SSR availability and fail-closed runtime authorization |
| `tests/systems/study-access-routes.test.ts` | Study routes preserve Free 403, frequency 429 and canonical replays with Max 24-hour authorization |
| `tests/systems/database-clients.test.ts` | Admin client lifecycle, request-isolated SSR cookies and session refresh headers |
| `tests/systems/database-transport.test.ts` | Caller cancellation, response-body deadlines and bounded SDK retry waits |
| `tests/systems/database-repositories.test.ts` | Account/profile ownership, missing records, stable news filters and persistence failures |
| `tests/systems/rate-limit.test.ts` | Atomic limit decisions and fail-closed behavior during missing configuration, errors and timeout |

---

## 11. Config Files

| File | Purpose |
| --- | --- |
| `next.config.ts` | Next.js config, remote image hosts and security headers |
| `next-sitemap.config.js` | Sitemap and robots generation rules |
| `proxy.ts` | Public legacy-host 301 allowlist and protected session-refresh matcher |
| `eslint.config.mjs` | Flat ESLint config based on Next core-web-vitals |
| `postcss.config.mjs` | PostCSS config |
| `tailwind.config.js` | Tailwind configuration |
| `tsconfig.json` | TypeScript config; incremental cache is stored under `.next/cache/typescript/` |
| `vitest.config.ts` | Node system tests with project aliases and isolated CSS-module handling |
| `package.json` | Scripts and dependencies |
| `.gitignore`, `.vercelignore` | Exclude private credentials, agent/editor state and diagnostics from Git/deploys |
| `.github/workflows/public-security.yml` | Offline security regression tests and tree/history checks with complete checkout history |
| `.githooks/`, `scripts/install-security-hooks.mjs` | Install local commit/push guards without overwriting existing hooks; inspect proposed push commits before upload |
| `scripts/public-security.mjs` | Shared redacted secret/private-path scanning for index, working tree and history |
| `scripts/verify-open-source.mjs`, `scripts/verify-history-clean.mjs` | Publication guards for current/staged content and reachable history |
| `scripts/create-public-release.mjs` | Export approved tracked index blobs to a new external directory |
| `tests/scripts/public-security.test.mjs` | Offline staged-only, private-path, metadata, credential and release-export regressions |

---

## 12. Operational Notes

- `npm run build` performs both the production build and sitemap regeneration.
- `npm run lint` is the active static validation command in the repo.
- `npm run test:security` verifies public-tree/history guards and release export without live secrets or services. CI executes these tests and both publication checks.
- Agent instructions and editor/MCP configuration remain local and are excluded from Git, deploys and public release export; runtime credentials remain in private environment stores.
- `next.config.ts` applies global `outputFileTracingExcludes` for private files. Prebuilt publication complements tracing exclusions with artifact inspection and removal of local environment files, their references and local diagnostics from an isolated package. The standalone Vercel CLI build uses production environment variables and preserves links plus function/external-dependency aliases in `filePathMap`; preparation restores missing aliases only from already-traced files and validates remaining references. Runtime credentials come from the Vercel deployment environment. Checks before and after promotion include study pages, protected APIs, the news feed, existing articles and a missing article with 404.
- `npm run test:systems` runs the focused Vitest suite for contracts, canonical service replay, persistence mapping, bounded repository/maintenance calls, quiz concurrency, OCR routing, drafts, student errors and news recovery, using in-memory data and mocked providers.
- Shared components and library helpers use direct file imports; unused barrels and starter assets are omitted.
- The current runtime path is Next.js route handlers under `app/api`.
- Study APIs explicitly use Node.js with `maxDuration` of 180 seconds for essay correction, 120 for themes, 300 for quiz POST/PATCH and 120 for OCR. Provider and database calls retain shorter cancellation deadlines.
- Max subscriptions with valid `active`/`trialing` access can start corrections, themes and quizzes at any hour. Free keeps the São Paulo 07:00–23:30 schedule. Frequency limits remain the same for both. `/api/assinatura/status` includes `userId` (null when anonymous) so availability refreshes can bind results to the verified user. Server handlers remain authoritative; client hints never grant access.
- Essay-claim and quiz-catalog/attempt cleanup, plus theme-generation and essay-correction analytics, finish through `after()` after the response. Theme cleanup stays before canonical selection and runs in parallel with runtime loading.
- Development screenshots live in `.local/screenshots/`, excluded from Git and deploys; generated dependencies/build artifacts and `supabase/.branches/` remain local.
- The TypeScript incremental cache lives at `.next/cache/typescript/tsconfig.tsbuildinfo`.
- Local Vercel CLI state/build output under `.vercel/` remains ignored by Git and ESLint.
- There is no external cron scheduler in the repo anymore. Atomic maintenance and highlights run on demand, with timestamps persisted in `configuracoes`.
- Maintenance timestamps use UTC ISO format; the RPC accepts legacy date/time separators and recovers from invalid stored dates without blocking cleanup permanently.
- Quiz POST responses include `attemptId`, `expiresAt` and only public question fields; PATCH accepts `{ attemptId, selectedAnswers }`. The UI preserves answers on failure while the database guarantees one canonical result.
- Essay theme POST returns `{ themeId, tema, textoApoio1, textoApoio2 }`; correction POST accepts a stable `submissionId` and either a generated theme ID or a manual title. Result pages load directly on the server.
- OCR photos up to 20 MB are compressed locally below the Vercel Function payload limit; the server validates their signature and routes once through `gemini-3.5-flash`, `gemini-2.5-flash` and `gemini-3.1-flash-lite` without persisting image bytes.
- Essay and quiz statistics are synchronized by database triggers, and unanswered quiz items are excluded from answered totals and accuracy.
- The Max plan is monthly-only at R$ 10,00, includes a one-time 7-day trial for eligible users, and is enforced server-side through `subscriptions` plus webhook-driven Stripe synchronization.
- The repository does not contain an active community/forum subsystem anymore.
- The refactor evidence and remaining remote checks are recorded in [docs/study-refactor-qa.md](docs/study-refactor-qa.md).
