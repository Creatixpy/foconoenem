# Repository Guidelines

## Project Structure & Module Organization
- `app/`: App Router routes, layouts, public pages, authenticated areas, and Route Handlers under `app/api`.
- `lib/auth/`: authentication flows, profile client wrapper, session security, and validation helpers.
- `lib/ai/`: Groq integration plus the typed Gemini OCR adapter and model router.
- `lib/contracts/`: strict neutral Zod contracts shared across server and browser boundaries.
- `lib/server/ai/`, `lib/server/essay/`, `lib/server/quiz/`: bounded AI runtime and server-only orchestration for the canonical systems.
- `lib/db/`: server-side Supabase client, repositories, and neutral query helpers.
- `lib/server/`: server-only helpers for account data, cookie auth, analytics, news, operating hours, payments, and rate limiting.
- `lib/supabase/`: SSR/browser Supabase clients plus session refresh logic used by `proxy.ts`.
- `supabase/migrations/`: local schema history.
- `types/`: shared app types and generated Supabase types.
- `public/`: static assets, verification files, `robots.txt`, and the generated sitemap.

## Build, Test, and Development Commands
- `npm run dev`: starts the Next.js app with Turbopack.
- `npm run lint`: runs ESLint across the repository.
- `npm run test:systems`: runs the focused Vitest suite for essay, quiz and OCR contracts.
- `npm run build`: runs `next build` and then regenerates `public/sitemap.xml`.
- `npm run start`: serves the production build locally.

## Coding Style & Naming Conventions
- Current stack: TypeScript, React 19, and Next.js 16 App Router.
- Preserve the local style of the file you touch; the repository currently mixes single and double quotes.
- Prefer Tailwind and the shared tokens in `app/styles/`.
- The product is dark-only. Do not add theme providers, light-mode selectors, or a theme toggle.
- Use `AprovIALogo` for visible branding and the `--brand`, `--ai`, `--bg`, `--surface*`, `--text*`, and semantic tokens for product colors.
- Do not import server-only logic into client components.
- Optional telemetry must remain consent-aware: Vercel Analytics and Speed Insights should only mount after the user accepts metrics in the cookie preferences UI.
- Authenticated pages should validate with `requireServerUser()` server-side and pass the verified user into `AuthProviders` when the client needs `useAuth`, avoiding a second bootstrap `getUser()` call.
- For Supabase access:
  - `lib/supabase/*` for low-level SSR/browser client creation.
  - `lib/db/*` for repository-oriented access.
  - `lib/server/*` for route-level and server-page helpers.

## Testing Guidelines
- Keep `tests/systems/` small and specific to schemas, safe serialization, ENEM scores, idempotency and persistence mapping; do not add generic component tests without a demonstrated need.
- For non-trivial essay/quiz/OCR changes, the minimum expected validation is `npm run test:systems`, `npm run lint` and `npm run build`.
- Manual QA should follow the area changed, especially:
  - auth: `/login`, `/register`, `/forgot-password`, `/reset-password`
  - account: `/conta`, `/conta/editar`, account deletion
  - essay flow: `/redacao` and `/resultados/[id]`, including OCR upload/compression, theme ownership, stable `submissionId`, off-topic retries and account-deletion cleanup
  - quiz flow: `/questoes`, including POST attempt creation, no pre-submit answer leakage, PATCH canonical correction and answer-preserving retry
  - news admin: `/noticias/admin` when relevant
  - donations: `/doacao` and the webhook if Stripe is configured
  - subscriptions: `/conta`, `/api/assinatura/checkout`, `/api/assinatura/portal`, `/api/doacao/webhook`, including first-time 7-day trial eligibility

## Documentation Maintenance
- Always update `README.md`, `FRONTEND_INVENTORY.md`, and this `AGENTS.md` when changing:
  - routes, APIs, or product areas
  - environment variables actually read by the code
  - relevant operational architecture such as auth, cron, Edge Functions, or external integrations
- Do not document removed or experimental features as if they were active.

## Commit & Pull Request Guidelines
- Use short, imperative commit messages.
- Prefer PRs focused on one concern at a time.
- Record the validation commands you actually ran.
- Mention migrations under `supabase/migrations/` explicitly whenever schema changes are involved.
- Separate code changes from any remote operational follow-up still required.

## Security & Configuration Tips
- Never commit `.env.local` or secrets.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are essential for runtime.
- `SUPABASE_SERVICE_ROLE_KEY` is required for privileged server operations.
- Admin flows use `ADMIN_ALLOWED_EMAILS`. Maintenance and news highlights now run locally in the app and no longer depend on cron secrets.
- Stripe depends on `STRIPE_SECRET_KEY`; the webhook also requires `STRIPE_WEBHOOK_SECRET`.
- The Max subscription checkout requires `STRIPE_MAX_PRICE_ID`.
- Textual AI depends on `GROQ_API_KEY`; `GROQ_FALLBACK_API_KEY`, `GROQ_FALLBACK_MODEL`, and `GROQ_MAX_ATTEMPTS` control a maximum global budget of two attempts. Do not re-enable Groq SDK retries.
- OCR depends on `GEMINI_API_KEY` and the official `@google/genai` SDK. It routes once each through `gemini-3.5-flash`, `gemini-2.5-flash` and `gemini-3.1-flash-lite`; do not re-enable SDK retries or add preview models.
- News import uses `NEWSAPI_API_KEY` or `NEWSAPI_KEY`.
- The project uses RLS in Supabase, but application table access is routed through server handlers with `SUPABASE_SERVICE_ROLE_KEY`; direct public DB grants should stay minimal.
- Canonical quiz attempts and their questions are service-role-only; do not expose catalog correction or attempt mutation directly to browser clients.
- Free themes are shared, Max themes are private, and generated theme text must be resolved from the database by ID before correction. Never trust theme support text supplied by a browser.
- Reusable questions expire after 30 days when unreferenced; cached themes expire after 7 days. Historical `quiz_results` and `essay_results` are snapshots and must not be deleted by catalog maintenance.
- Schema and data changes must go through Supabase MCP migrations. Do not use migration repair, rewrite remote history, or reset the production database.
- Account deletion must remove quiz attempts and other app-owned user content before deleting the Supabase Auth user because some historical foreign keys use `ON DELETE SET NULL`.
