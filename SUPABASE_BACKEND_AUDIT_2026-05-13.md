# Supabase Backend Audit - 2026-05-13

## 1. Executive summary

The Supabase/backend integration is generally sound after hardening: public app tables have RLS enabled, direct `anon` and `authenticated` table grants are revoked, and the app routes database access through server-side handlers with explicit auth/admin checks.

Three real integration/security issues were found and fixed:

- Profile bootstrap metadata mismatch.
- Client-trusted quiz result aggregates.
- Incomplete account-deletion cleanup.

Public news query bounds were also tightened. No destructive database change or production data deletion was applied.

## 2. What I inspected

- Supabase MCP: public/auth/storage schemas, RLS policies, grants, constraints, indexes, functions, triggers, migrations, Edge Functions, advisors, and logs.
- Website code: `app/api/**`, auth routes, `lib/db/**`, `lib/supabase/**`, `lib/server/**`, `lib/auth/**`, `types/supabase.ts`, migrations, environment-variable usage, and Stripe donation/subscription routes.
- Storage: no buckets and no active app storage usage found.
- Edge Functions: remote functions exist and have `verify_jwt=true`, but the repository does not reference them at runtime.

## 3. Database-to-code mapping

| Feature | Supabase tables / columns checked | Backend logic / access |
| --- | --- | --- |
| Auth/profile | `auth.users`, `user_profiles.user_id,nome_completo,objetivo`, `user_statistics.user_id` | Auth callback/session clients, `/api/perfil`, account pages, `handle_new_user()` trigger |
| Essay flow | `essay_results.user_id,nota,competencia1,competencia2,competencia3,competencia4,competencia5,feedback_geral,redacao_original,tema` | `/api/corrigir`, `/api/resultados/[id]`, account dashboard |
| Quiz flow | `generated_questions.*`, `quiz_results.user_id,total_questions,correct_answers,wrong_answers,unanswered_questions,score,disciplines,questions_data,answers_data` | `/api/questoes`, statistics recalculation |
| News/admin | `noticias.titulo,slug,resumo,conteudo,tags,destaque,status,search_vector`, `admin_audit_log.*`, `configuracoes.*` | Public news APIs plus admin import/moderation/highlights |
| Analytics/rate limit | `analytics_events.*`, `rate_limits.*` | Server analytics and DB-backed rate limiting |
| Donations | `donation_checkouts.*`, `stripe_webhook_events.*` | Stripe Checkout Sessions and signed webhook handler |
| Subscriptions | `subscriptions.*`, `subscription_events.*` | Max checkout, portal, webhook subscription sync |
| Theme cache | `cached_themes.tema,texto_apoio1,texto_apoio2,usado_count` | `/api/gerar-tema` |

Policy/grant result: all public app tables still grant table privileges only to `service_role`. User-owned RLS policies use `auth.uid()` ownership checks, but direct browser DB access is intentionally blocked at the grant layer.

## 4. Problems found

### 4.1 Profile bootstrap metadata mismatch

- Severity: Medium
- Location: database trigger / auth bootstrap
- What was wrong: `public.handle_new_user()` did not read the app's signup metadata keys consistently.
- Why it matters: new users could get profiles with email as name and missing objective.
- How it could break the app: profile/account data starts incomplete even though signup submitted the fields.
- Exact fix applied: updated the trigger to read `nome_completo`, `full_name`, `name`, and `objetivo`; locked `search_path`; revoked direct execute from `anon` and `authenticated`.

Files:

- `supabase/migrations/20260513224619_harden_auth_profile_and_quiz_integrity.sql`

### 4.2 Client-trusted quiz result aggregates

- Severity: High
- Location: API route and database constraints
- What was wrong: quiz result persistence trusted client-submitted aggregate counts and score.
- Why it matters: service-role inserts bypass RLS ownership protections, so server validation must be strict.
- How it could be exploited: a tampered request could inflate quiz statistics.
- Exact fix applied: `/api/questoes` now validates submitted questions and recomputes answers, counts, score, and disciplines server-side before insert. Database constraints were added for quiz count consistency, score range, and JSON array lengths.

Files:

- `app/api/questoes/route.ts`
- `supabase/migrations/20260513224619_harden_auth_profile_and_quiz_integrity.sql`

### 4.3 Incomplete account-deletion cleanup

- Severity: High
- Location: account deletion route
- What was wrong: account deletion removed the Supabase Auth user but left app-owned rows vulnerable to orphaning because some FKs use `ON DELETE SET NULL`.
- Why it matters: educational and analytics data could remain after account deletion.
- How it could break privacy expectations: dashboard records become detached from an owner instead of being removed by the app's account-deletion flow.
- Exact fix applied: `/api/conta/excluir` now deletes user-owned essays, quizzes, analytics, and best-effort rate-limit rows before deleting the Auth user.

Files:

- `app/api/conta/excluir/route.ts`

### 4.4 Public news API bounds

- Severity: Low
- Location: public news APIs
- What was wrong: malformed or very large `limit`/`offset` values were not consistently bounded.
- Why it matters: bad input could produce invalid ranges or excessive queries.
- How it could break the app: avoidable load or broken pagination/search behavior.
- Exact fix applied: added bounded parsers for list and search routes.

Files:

- `app/api/noticias/route.ts`
- `app/api/noticias/busca/route.ts`

### 4.5 Leaked password protection disabled

- Severity: Low / Remaining
- Location: Supabase Auth configuration
- What was wrong: Supabase security advisor reports leaked password protection is disabled.
- Why it matters: users can choose known-compromised passwords.
- Exact fix proposed: enable leaked password protection in Supabase Auth settings.
- Supabase remediation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## 5. Fixes applied

- Applied remote Supabase migration `20260513224619_harden_auth_profile_and_quiz_integrity`.
- Added local reproducible migration at `supabase/migrations/20260513224619_harden_auth_profile_and_quiz_integrity.sql`.
- Hardened quiz save logic in `app/api/questoes/route.ts`.
- Hardened account deletion cleanup in `app/api/conta/excluir/route.ts`.
- Bounded public news query parameters in `app/api/noticias/route.ts` and `app/api/noticias/busca/route.ts`.
- Updated `README.md`, `FRONTEND_INVENTORY.md`, and `AGENTS.md` to document the changed behavior.
- No destructive DB operation was performed.

## 6. Verification

- Supabase MCP confirmed migration `20260513224619` is present remotely.
- Supabase MCP confirmed all three new `quiz_results` constraints are validated.
- Supabase MCP confirmed `handle_new_user()` has `SECURITY DEFINER`, empty `search_path`, reads the expected metadata, and is executable only by `service_role`.
- Supabase MCP confirmed public table grants remain restricted to `service_role`.
- Supabase MCP confirmed RLS policies remain ownership-based for user data and service-only for admin/payment tables.
- Before adding constraints, existing quiz rows were checked for inconsistent counts, negative values, invalid JSON shape, and length mismatches.
- Stripe audit check: code uses server-side Checkout Sessions, the configured Stripe API version from local guidance, and webhook signature verification with `STRIPE_WEBHOOK_SECRET`.
- Local validation passed:
  - `npm run lint`
  - `npm run build`

## 7. Remaining risks

- Quiz anti-tamper is improved but not perfect: the client still submits question objects including answer keys. A stronger design would store server-generated quiz attempts and accept only an attempt ID plus selected answers.
- `essay_results`, `quiz_results`, and `analytics_events` still have nullable `user_id` and historical `ON DELETE SET NULL` behavior. The route now cleans up app-owned data, but direct Auth deletion outside the app could still orphan rows.
- Supabase Auth leaked password protection remains disabled and must be changed in the Supabase dashboard.
- Supabase performance advisor reports unused indexes. They were not dropped because that is a non-urgent, workload-dependent production decision.
- Payment/subscription event payload retention was not changed; retention policy should be decided separately for legal, audit, and privacy requirements.

## 8. Recommended next steps

1. Enable Supabase leaked password protection.
2. Add a server-side quiz attempt table/nonce flow so clients never submit trusted answer keys.
3. Plan a safe migration from `ON DELETE SET NULL` to explicit cascade/retention rules for user-owned educational data.
4. Review Stripe webhook payload retention and redaction policy.
5. Monitor unused-index advisor output after real traffic before removing any indexes.
