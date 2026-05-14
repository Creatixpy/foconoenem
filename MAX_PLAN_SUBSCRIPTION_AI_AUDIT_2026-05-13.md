# Max Plan Subscription, Supabase, Stripe, Vercel, and AI Audit

Date: 2026-05-13  
Repository: `foconoenem`  
Scope: Max plan subscription state, Stripe billing/webhooks, Supabase entitlement data, Vercel deployment configuration, and NVIDIA Max AI routing.

This report intentionally excludes secrets, API keys, webhook secrets, private customer data, payment details, and user identifiers.

## 1. Executive Summary

The subscription and entitlement bridge had one production-relevant flaw: Max access could be treated as indefinitely active when a subscription row had an active/trialing status but no `current_period_end`. This was unsafe because it could either over-grant access or hide broken Stripe period synchronization. I applied a non-destructive Supabase migration to backfill missing period dates from already-synced Stripe metadata and patched the backend entitlement logic to require a valid future access end.

The requested Max model migration to `minimaxai/minimax-m2.7` is blocked. The model authenticates and answers a trivial smoke prompt, but real feature-shaped question-generation calls returned only `reasoning_content` and no final `message.content`, including at 10,000 completion tokens after more than four minutes. That would break Max question generation and likely essay correction in production. I did not deploy the MiniMax model change because doing so could cause paying Max users to lose working AI access.

The Stripe webhook path uses signature verification, the live Stripe webhook endpoint is configured for the required subscription events, and Supabase contains processed subscription events with no unprocessed subscription-event backlog. No destructive production data changes were made.

## 2. What I Inspected

Supabase MCP:
- Public table schemas, columns, constraints, indexes, RLS status, and foreign keys for subscription, payment, profile, essay, quiz, generated-question, analytics, rate-limit, and storage-related tables.
- RLS policies and direct grants for `subscriptions`, `subscription_events`, `donation_checkouts`, `stripe_webhook_events`, `essay_results`, `quiz_results`, `generated_questions`, `cached_themes`, `user_profiles`, and `user_statistics`.
- Functions, triggers, SECURITY DEFINER posture, `search_path`, and execution grants.
- Applied migrations list and post-fix subscription integrity SQL.
- Security and performance advisors.

Website code:
- `lib/server/subscriptions.ts`
- `lib/server/ai/nvidia.ts`
- `lib/server/ai/provider.ts`
- `app/api/assinatura/checkout/route.ts`
- `app/api/assinatura/portal/route.ts`
- `app/api/doacao/webhook/route.ts`
- `app/api/questoes/route.ts`
- `app/api/corrigir/route.ts`
- `app/api/gerar-tema/route.ts`
- Supabase client creation under `lib/db/*` and `lib/supabase/*`
- Auth/cookie resolution helpers
- Migrations and generated Supabase types
- Documentation files impacted by operational changes

Stripe CLI:
- Live and test product/price configuration for the Max subscription.
- Live webhook endpoint configuration and enabled event types.
- Live subscription, checkout-session, and event status summaries, sanitized to avoid exposing customer data.

Vercel CLI:
- Project link and deployment inspection.
- Production environment variable names and environment-run behavior.
- Production route availability and API response checks where safe.
- Local `npm run lint` and `npm run build`.

AI verification:
- Direct NVIDIA API smoke test for `minimaxai/minimax-m2.7`.
- App-runtime entitlement selection using production Supabase data and the temporary audit NVIDIA key.
- Feature-shaped Max question-generation test through the app runtime.
- Raw NVIDIA response-shape diagnostics for MiniMax.

## 3. Current Payment and Subscription Flow

The intended flow is:

1. Authenticated user requests `/api/assinatura/checkout`.
2. Backend uses the Supabase service-role client to read or prepare the user subscription state.
3. Backend creates a Stripe Checkout Session in subscription mode using the configured Max price.
4. Stripe redirects the user through Checkout.
5. Stripe sends signed webhook events to `/api/doacao/webhook`.
6. The webhook verifies the Stripe signature before processing.
7. Webhook handlers upsert `subscriptions` and insert `subscription_events`.
8. App routes call `getUserAiRuntime(userId)`.
9. `getUserAiRuntime` reads the user subscription from Supabase using the service-role client.
10. Valid Max entitlement selects the NVIDIA runtime; otherwise the standard Groq runtime is used.
11. `/api/questoes`, `/api/corrigir`, and `/api/gerar-tema` use the selected runtime.

## 4. Max Plan AI Model Change

Requested model: `minimaxai/minimax-m2.7`

Status: not deployed.

I temporarily changed the model locally and validated the exact lowercase model string. A trivial direct smoke test returned `returnedModel: "minimaxai/minimax-m2.7"`, but real Max feature-shaped tests failed because the model did not return final content for question generation. The safe production decision is to keep the existing Max model in committed code until the MiniMax endpoint can be made to return reliable final JSON within route time limits.

Evidence:
- Direct smoke prompt: authenticated and returned the requested model.
- App-runtime question-generation prompt: failed with `A NVIDIA não retornou conteúdo.`
- Raw response diagnostics for the feature-shaped prompt:
  - `returnedModel: "minimaxai/minimax-m2.7"`
  - `finishReason: "length"`
  - `messageKeys: ["role", "reasoning_content"]`
  - `contentLength: 0`
  - 2,200-token diagnostic: no final content.
  - 10,000-token diagnostic: no final content after about 264 seconds.

Conclusion: MiniMax is not currently production-safe for this app’s Max question-generation route through the tested NVIDIA chat-completions integration.

## 5. Database and Supabase Audit

Relevant subscription/payment tables:
- `subscriptions`: RLS enabled; owned-user SELECT policy for authenticated users; service-role all-access policy; unique Stripe customer and subscription IDs; status, provider, and plan constraints; indexes on status/plan/period and renewals.
- `subscription_events`: RLS enabled; service-only policy; unique `stripe_event_id`; FK links to subscriptions/users; processed event trail.
- `donation_checkouts`: RLS enabled; service-only policy; Stripe checkout/payment metadata.
- `stripe_webhook_events`: RLS enabled; service-only policy; unique Stripe event IDs.

Relevant user/content tables:
- `essay_results`, `quiz_results`: own-row RLS policies plus service-role access.
- `generated_questions`, `cached_themes`, `analytics_events`, `rate_limits`: direct public grants are minimized; server handlers perform privileged access.
- `user_profiles`, `user_statistics`: own-row RLS policies and service-role maintenance.

Functions/triggers:
- `handle_new_user` and `recalculate_user_statistics` use SECURITY DEFINER with hardened search-path posture and restricted execution.
- Timestamp update triggers exist for subscription/payment tables.

Post-fix Supabase integrity check:
- Active/trialing subscription rows: 1
- Active/trialing rows missing `current_period_end`: 0
- Active/trialing rows with expired `current_period_end`: 0
- Active/trialing rows missing `stripe_subscription_id` while having a Stripe customer: 0
- Checkout-pending rows: 5
- Subscription events: 3
- Unprocessed subscription events: 0

Supabase advisors:
- Security warning remains: leaked-password protection is disabled in Supabase Auth.
- Performance advisor reported unused indexes. I did not drop indexes because that is destructive-ish operational tuning and not required for this payment/entitlement fix.

## 6. Stripe Audit

Verified with Stripe CLI:
- The live Max recurring price exists with lookup key `max_monthly`, monthly BRL pricing, and active status.
- Test-mode Max product/price objects also exist.
- The live webhook endpoint is enabled and points to the production webhook URL.
- The webhook endpoint includes required subscription/payment events, including checkout completion/expiration, subscription create/update/delete, invoice paid/payment failed, and payment-intent failure events.
- Live checkout-session and subscription summaries match the expected Max subscription shape. Details were sanitized and no customer identifiers are included in this report.
- The relevant live checkout completion event had no pending webhook deliveries.

No real charges were created. No live Stripe subscription/payment records were modified.

## 7. Vercel Audit

Verified with Vercel CLI:
- Project link is present for the expected Vercel project.
- Production deployment inspection succeeded and API routes are present.
- Production environment variable names include the expected Supabase, Stripe, and NVIDIA entries.
- `vercel env run -e production` did not expose usable values for some production-only variables in the local CLI shell, but runtime verification showed the deployed webhook has access to `STRIPE_WEBHOOK_SECRET`: a request with an invalid Stripe signature returned Stripe signature-verification failure instead of a missing-secret error.

Production deployment of the MiniMax model was not performed because real feature testing failed before deployment.

## 8. Problems Found

### Problem 1

Severity: High  
Location: website/backend entitlement logic  
What is wrong: `hasMaxPlanAccess` treated an active/trialing Max subscription with missing `current_period_end` as active access.  
Why it matters: A broken or incomplete Stripe sync could produce indefinite Max access, and UI summaries could show incomplete renewal data.  
How it could break users or create a loophole: Users with stale active/trialing rows and no period end could retain Max indefinitely; conversely, period-sync bugs could be hidden until later.  
Exact fix applied: `hasMaxPlanAccess` now requires a valid future access end. It uses `current_period_end` first and falls back only to trusted `metadata.trial_ends_at` when present.

### Problem 2

Severity: High  
Location: Stripe-to-Supabase sync logic  
What is wrong: Stripe subscription period extraction only checked top-level `current_period_start` and `current_period_end`. Current Stripe subscription objects can expose these period fields on subscription items.  
Why it matters: Webhook sync could persist null periods even when Stripe supplied valid period dates.  
How it could break paying users: Paying users could have incomplete subscription periods, causing access checks and renewal UI to fail once missing periods were treated safely.  
Exact fix applied: `getStripeSubscriptionPeriodValue` now falls back to the first subscription item’s period fields.

### Problem 3

Severity: Critical  
Location: AI route/model migration  
What is wrong: `minimaxai/minimax-m2.7` authenticated through NVIDIA, but feature-shaped Max question-generation prompts returned only `reasoning_content` and no final `message.content`.  
Why it matters: The app expects final JSON in `message.content`. Empty content causes the Max runtime to throw and the user-facing AI feature to fail.  
How it could break paying users: Deploying this model would likely break Max question generation and could also break essay correction/theme generation if the model spends the completion budget on reasoning.  
Exact fix applied or proposed: The unsafe model change was not deployed. Proposed follow-up is to validate a MiniMax/NVIDIA-supported way to force final content within serverless limits, or choose another tested Max model. Do not migrate production until question generation and essay correction both return parseable final JSON through the real app runtime.

### Problem 4

Severity: Medium  
Location: Vercel environment verification  
What is wrong: Vercel CLI listed expected production variables, but `vercel env run -e production` did not expose usable values for some production-only variables in the local CLI shell.  
Why it matters: CLI-level validation of exact production secret values was incomplete.  
How it could break paying users: If `STRIPE_MAX_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, or `NVIDIA_API_KEY` are missing in the real runtime, checkout, webhook processing, or Max AI can fail.  
Exact fix applied or proposed: No environment mutation was made. Runtime webhook-secret availability was verified by production signature-check behavior. Recommended follow-up is a Vercel dashboard/manual secret review and a production Max route test with a safe paid test session before any model migration.

### Problem 5

Severity: Low  
Location: Supabase Auth configuration  
What is wrong: Supabase advisor reports leaked-password protection is disabled.  
Why it matters: Users can set known-compromised passwords.  
How it could be exploited: Credential-stuffing risk is higher for accounts reusing leaked passwords.  
Exact fix applied or proposed: Not changed by this audit because it is an Auth dashboard setting. Enable leaked-password protection in Supabase Auth.

## 9. Fixes Applied

Code:
- Updated `lib/server/subscriptions.ts` so Max access requires a valid future access end.
- Updated `lib/server/subscriptions.ts` to read Stripe subscription period dates from subscription items when top-level period fields are absent.
- Updated subscription summaries to use the same validated access-end fallback.

Database:
- Applied remote Supabase migration `20260513231721_harden_max_subscription_periods`.
- Added local migration file `supabase/migrations/20260513231721_harden_max_subscription_periods.sql`.
- The migration only backfills missing period fields from existing metadata. It does not drop tables, drop columns, delete rows, or overwrite payment data.

Documentation:
- Updated `README.md` to record the new migration.
- Added this audit report.

AI model:
- No production model change was committed or deployed. The MiniMax migration failed required feature testing and remains blocked.

Webhook:
- No webhook code change was required. Signature verification was reviewed and runtime behavior was verified.

## 10. Real Tests Performed

### Max Plan Question Generation

Objective: Verify `minimaxai/minimax-m2.7` can generate product-valid Max questions through the Max runtime.  
Method: Used the temporary audit NVIDIA key and production Supabase entitlement data. Called the app runtime with a feature-shaped ENEM question-generation prompt.  
Result: Failed. The app runtime threw `A NVIDIA não retornou conteúdo.`  
Evidence: Raw diagnostics showed the model returned `reasoning_content` only, with `contentLength: 0`, `finishReason: "length"`, and no parseable JSON even at 10,000 completion tokens.

### Max Plan Essay Correction

Objective: Verify `minimaxai/minimax-m2.7` can return product-valid ENEM essay correction JSON.  
Method: Planned after question-generation validation.  
Result: Not executed after the question-generation blocker, following the stop rule to avoid stacking tests on a failing migration.  
Evidence: The question-generation failure is sufficient to block deployment because it is a required Max feature.

### Free User Trying to Access Max-Only Runtime

Objective: Verify a non-entitled identity does not resolve to Max.  
Method: Called `getUserAiRuntime(randomUUID())` against production Supabase environment variables.  
Result: Passed.  
Evidence: Sanitized output showed `freeEntitled: false` and `freePlan: "free"`.

### Valid Max User Accessing Max Runtime

Objective: Verify a real current Max subscription resolves to Max access.  
Method: Queried a sanitized active/trialing Max subscription row from production Supabase, then called `getUserAiRuntime(user_id)`.  
Result: Passed.  
Evidence: Sanitized output showed `maxEntitled: true` and `maxPlan: "max"`.

### Stripe Checkout/Session Flow

Objective: Verify Stripe has the expected Max checkout/subscription objects.  
Method: Stripe CLI read-only inspection of live products, prices, subscriptions, checkout sessions, and events.  
Result: Passed with no live data mutations.  
Evidence: Live Max recurring price exists; live checkout/session data includes completed Max subscription flow; sanitized subscription state matches Supabase subscription state.

### Stripe Webhook Processing

Objective: Verify webhook signature verification and event processing posture.  
Method: Reviewed route code, Stripe CLI webhook endpoint configuration, live event delivery status, and production invalid-signature behavior.  
Result: Passed.  
Evidence: Invalid signed production webhook request returned a Stripe signature-verification failure; Supabase `subscription_events` has no unprocessed event backlog.

### Supabase Subscription Update

Objective: Verify missing subscription periods were corrected safely.  
Method: Applied non-destructive Supabase migration through MCP and ran post-migration SQL.  
Result: Passed.  
Evidence: Active/trialing rows missing `current_period_end`: 0; active/trialing rows with expired period end: 0.

### Website Entitlement Recognition

Objective: Verify backend recognizes valid and invalid entitlement states.  
Method: Production Supabase environment with `getUserAiRuntime`.  
Result: Passed.  
Evidence: Valid Max row resolved to Max; random/free identity resolved to free.

### AI Model Response After Requested Model Change

Objective: Verify `minimaxai/minimax-m2.7` supports the app’s Max AI use cases.  
Method: Direct NVIDIA smoke test, app-runtime question-generation test, raw response-shape diagnostics.  
Result: Failed for required feature use.  
Evidence: Smoke prompt returned the requested model, but feature prompts returned no final content and no JSON.

## 11. Verification

Completed:
- Supabase MCP schema/policy/function/index review.
- Supabase MCP migration confirmation.
- Supabase MCP post-fix subscription-health SQL.
- Stripe CLI read-only live/test object inspection.
- Stripe webhook signature behavior check against production endpoint.
- Vercel CLI project/deployment/env-name inspection.
- `npm run lint`: passed.
- `npm run build`: passed before the final report step.
- Direct NVIDIA smoke test for `minimaxai/minimax-m2.7`: passed.
- Real Max entitlement recognition against production Supabase: passed.
- Real MiniMax feature-shaped question-generation test: failed and blocked deployment.

Not completed:
- Production deployment of `minimaxai/minimax-m2.7`.
- Production confirmation that the deployed site uses `minimaxai/minimax-m2.7`.
- Max essay-correction test on MiniMax, because question generation already failed a required stop condition.

## 12. Remaining Risks

- MiniMax migration is not production-ready through the tested NVIDIA chat-completions path.
- Vercel CLI did not expose some production-only secret values through `env run`; dashboard confirmation is still recommended.
- Supabase leaked-password protection remains disabled.
- No real Stripe charges were created; payment testing remained read-only/live-inspection plus existing live events.
- A safe paid production test session is still needed before any future AI model migration.
- Production logs should be monitored after deploying the subscription-period hardening.

## 13. Recommended Next Steps

1. Do not deploy `minimaxai/minimax-m2.7` until it returns final JSON for question generation and essay correction within production route time limits.
2. Ask NVIDIA support or verify official MiniMax endpoint parameters for disabling reasoning or forcing final content in `message.content`.
3. Add an automated Max AI provider contract test that validates parseable JSON for questions, essay correction, and theme generation before deployment.
4. Manually confirm Vercel production values for `STRIPE_MAX_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, and `NVIDIA_API_KEY`.
5. Enable Supabase Auth leaked-password protection.
6. Add webhook replay/idempotency tests using Stripe CLI in test mode with a safe test user before future payment-flow changes.
7. Monitor subscription rows for `active` or `trialing` statuses with missing/expired `current_period_end`.
