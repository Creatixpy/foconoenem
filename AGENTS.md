# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages, layouts and active route handlers under `app/api`.
- `lib/auth/`: auth state, profile/statistics services, community helpers and validation.
- `lib/ai/`: Groq and Gemini integrations.
- `lib/db/`: repository layer and server/browser database helpers.
- `lib/server/`: server-only helpers for account data, news, analytics, operating hours and rate limiting.
- `lib/supabase/`: SSR/browser Supabase clients plus session refresh logic used by `proxy.ts`.
- `supabase/migrations/`: local schema history.
- `supabase/functions/`: legacy documentation only; current runtime does not deploy local Edge Functions from this repo.
- `types/`: shared app types plus generated Supabase types.
- `public/`: static assets, verification files, `robots.txt` and generated sitemap.

## Build, Test, and Development Commands
- `npm run dev`: starts the Next.js dev server with Turbopack.
- `npm run lint`: runs ESLint across the repository.
- `npm run build`: runs `next build` and then regenerates `public/sitemap.xml`.
- `npm run start`: serves the production build locally.

## Coding Style & Naming Conventions
- Language: TypeScript + React 19 on Next.js 16 App Router.
- Preserve the local style of the file you touch; the repo currently mixes single and double quotes.
- Prefer Tailwind classes and shared CSS tokens from `app/styles/`.
- Keep server-only logic out of client components.
- When adding Supabase access, choose the right layer:
  - `lib/supabase/*` for raw SSR/browser client creation.
  - `lib/db/*` for repository-oriented access.
  - `lib/server/*` for route-level server helpers.

## Testing Guidelines
- There is no automated test suite in the repository today.
- Minimum validation for non-trivial changes is `npm run lint` and `npm run build`.
- Manual QA should follow the area touched, especially:
  - auth flows (`/login`, `/register`, `/forgot-password`)
  - essay flow (`/redacao` and `/resultados/[id]`)
  - quiz flow (`/questoes`)
  - community feed (`/comunidade`)
  - news admin flows (`/noticias/admin`) when relevant
  - donation flow if Stripe credentials are configured

## Commit & Pull Request Guidelines
- Use concise imperative commit messages.
- Keep PRs focused on one concern when possible.
- Include validation notes with the commands you actually ran.
- Mention schema changes under `supabase/migrations/` explicitly in the PR body.
- Mention remote/operational follow-up separately when a change does not fully apply infrastructure changes by itself.

## Security & Configuration Tips
- Never commit `.env.local` or secrets.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are foundational for the app.
- `SUPABASE_SERVICE_ROLE_KEY` is required for privileged server operations.
- Admin routes rely on `ADMIN_ALLOWED_EMAILS` and optionally `ADMIN_CRON_SECRET` / `CRON_SECRET`.
- Stripe routes require `STRIPE_SECRET_KEY`, and the webhook also requires `STRIPE_WEBHOOK_SECRET`.
- OCR requires `GEMINI_API_KEY`.
- News import requires `NEWSAPI_API_KEY` or `NEWSAPI_KEY`.
- RLS is enabled in Supabase; prefer server routes for privileged writes.
