# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages (`app/page.tsx`, feature directories like `app/redacao`, API routes under `app/api`).
- `lib/`: Shared utilities for Supabase access, auth helpers, scheduling, caching, analytics, and rate limiting.
- `supabase/functions/`: Edge Functions (`correct-essay`, `generate-theme`, `quiz-handler`, etc.) deployed via Supabase.
- `types/`: Shared TypeScript definitions consumed across components and functions.
- `public/`: Static assets (favicons, images).
- Configuration roots: `next.config.ts`, `tailwind.config.js`, `tsconfig.json`, `vercel.json`, and `README.md`.

## Build, Test, and Development Commands
- `npm run dev`: Starts the Next.js dev server (Turbopack) on `http://localhost:3000`.
- `npm run build`: Compiles the Next app and runs `next-sitemap` to refresh `public/sitemap*.xml`.
- `npm run start`: Serves the production build locally.
- `npm run lint`: Executes ESLint with the Next.js config; run before every PR to catch style and import issues.

## Coding Style & Naming Conventions
- Language: TypeScript + React 19 using Next.js 15 App Router.
- Formatting: 2-space indentation, single quotes in client files, and Tailwind utility classes for styling (`bg-page-gradient`, `btn btn-primary`, etc.).
- Components: PascalCase filenames (`QuestionCard.tsx`), hooks/contexts in camelCase (`useAuth`, `AuthContext`).
- Keep server-only helpers in `lib/`, edge-safe code in `supabase/functions/`, and avoid importing server modules into client components.

## Testing Guidelines
- No automated tests live in the repo yet; prefer Playwright or Vitest for future coverage.
- When adding tests, mirror the `app/<feature>` layout under `__tests__` and use descriptive filenames (e.g., `redacao.spec.ts`).
- Manual QA: verify essay submission (`/redacao` → `/resultados/[id]`) and quiz flow (`/questoes`) before merging.

## Commit & Pull Request Guidelines
- Follow concise, imperative commit messages (`Add quiz result caching`, `Fix Supabase auth callback`).
- Each PR should include: purpose summary, testing notes (`npm run lint`, manual flows tested), and any screenshots for UI tweaks.
- Reference Supabase branch migrations or Edge Function changes directly in the PR body when relevant.

## Security & Configuration Tips
- Local env requires `.env.local` with Supabase anon key, Groq API key, Stripe secret, and optional admin cron secret; never commit these.
- RLS is enforced on Supabase tables—exercise care when inserting data from clients and prefer server-side routes for privileged writes.
- Stripe API version is pinned in `app/api/doacao/checkout/route.ts`; confirm compatibility after dependency upgrades.
