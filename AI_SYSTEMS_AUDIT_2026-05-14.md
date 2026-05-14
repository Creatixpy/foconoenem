# AI Systems Audit

Date: 2026-05-14  
Repository: `foconoenem`  
Scope: standard AI, Max AI, NVIDIA/OpenAI-compatible integration, Groq fallback, Gemini OCR helper, server-side entitlement routing, output contracts, and production reliability.

This report intentionally excludes secrets, API keys, private user identifiers, payment details, and raw Supabase records.

## 1. Executive Summary

The website AI system is safer after this audit because Max users now attempt the requested NVIDIA model `minimaxai/minimax-m2.7` first, but are no longer left without AI functionality when that model fails to return usable output. A server-side fallback to the existing Groq runtime was added for Max users after a real NVIDIA failure.

`minimaxai/minimax-m2.7` is not production-safe as the only Max model. It can return valid content for small JSON prompts when reasoning is explicitly reduced, but realistic ENEM question generation, essay correction, long prompts, and the user-provided empty prompt either timed out or failed to return final app-compatible content in direct NVIDIA tests. The production-safe posture is therefore MiniMax-first with bounded timeout and fallback, not MiniMax-only.

## 2. AI Systems Inspected

Providers and models:
- Groq standard runtime: `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_FALLBACK_API_KEY`, `GROQ_FALLBACK_MODEL`, `GROQ_MAX_ATTEMPTS`.
- NVIDIA Max runtime: `NVIDIA_API_KEY`, primary model `minimaxai/minimax-m2.7`, optional `NVIDIA_MAX_TIMEOUT_MS`.
- Gemini OCR: `GEMINI_API_KEY`, model `gemini-2.5-flash`.

Routes and helpers:
- `app/api/questoes/route.ts`
- `app/api/corrigir/route.ts`
- `app/api/gerar-tema/route.ts`
- `app/api/ocr/route.ts`
- `app/api/noticias/gpt-busca/route.ts`
- `app/api/noticias/admin/moderar/route.ts`
- `lib/server/ai/provider.ts`
- `lib/server/ai/nvidia.ts`
- `lib/ai/groq.ts`
- `lib/ai/retry.ts`
- `lib/ai/gemini.ts`
- `lib/ai/parse-json.ts`
- `lib/server/subscriptions.ts`

## 3. Current AI Architecture

The app resolves AI provider selection server-side:

1. Route authenticates the user from Supabase cookies.
2. `getUserAiRuntime(userId)` reads subscription state using the server-side Supabase service-role client.
3. A valid Max subscription selects the Max runtime.
4. The Max runtime attempts NVIDIA `minimaxai/minimax-m2.7` first.
5. If NVIDIA fails, times out, or returns no final content, the server logs a sanitized warning and falls back to Groq.
6. Free/non-Max users always use the standard Groq runtime.

The client cannot select the privileged Max model through request parameters. Entitlement is derived from Supabase subscription state, not from client input.

## 4. NVIDIA Max Model Investigation

Direct NVIDIA tests were run against `https://integrate.api.nvidia.com/v1` with `minimaxai/minimax-m2.7`.

Important findings:
- Recommended sampling parameters timed out even for simple text and simple JSON prompts within the bounded test timeout.
- `detailed thinking off` and `chat_template_kwargs.enable_thinking=false` can produce valid `message.content` for small JSON prompts.
- Realistic ENEM question-generation prompts timed out.
- Realistic essay-correction prompts timed out.
- Long prompt behavior timed out.
- The user-provided empty-message test timed out.
- Streaming can return valid content for a small JSON prompt, but this does not solve realistic app prompts.
- Earlier diagnostics showed realistic prompts can consume the full completion budget in `reasoning_content` without returning final `message.content`.

The code now:
- Uses `minimaxai/minimax-m2.7` exactly as the primary NVIDIA model.
- Adds a MiniMax-specific system instruction requesting final output in `message.content`.
- Sends `chat_template_kwargs.enable_thinking=false`.
- Applies a short primary NVIDIA timeout through `NVIDIA_MAX_TIMEOUT_MS` or the default 8 seconds.
- Falls back server-side to Groq if NVIDIA does not produce usable output.

## 5. Problems Found

### Problem 1

Severity: Critical  
Location: NVIDIA Max provider behavior  
What failed: `minimaxai/minimax-m2.7` timed out or returned reasoning-only behavior for realistic app prompts.  
Why it matters: Max question generation and essay correction require parseable final JSON in `message.content`.  
Affects: Max users.  
Fix applied: Added a bounded MiniMax-first adapter and server-side Groq fallback. MiniMax is not used as the only production path.

### Problem 2

Severity: High  
Location: Max runtime availability  
What failed: Before this change, a failing NVIDIA Max attempt could fail the whole Max request.  
Why it matters: Paying users must not lose AI access because the preferred model is slow, empty, malformed, or unavailable.  
Affects: Max users.  
Fix applied: `createMaxRuntime` now catches NVIDIA failures, logs a sanitized warning, and returns a Groq fallback result while preserving Max entitlement state.

### Problem 3

Severity: Medium  
Location: Provider timeout behavior  
What failed: Direct MiniMax tests exceeded practical route timing for product-shaped prompts.  
Why it matters: Serverless route handlers should not wait indefinitely for a model that may never produce final content.  
Affects: Max users.  
Fix applied: Added `NVIDIA_MAX_TIMEOUT_MS`, defaulting to 8 seconds for the primary NVIDIA attempt.

### Problem 4

Severity: Medium  
Location: OCR validation  
What failed: Synthetic printed/italic text images were rejected by the Gemini OCR helper as no readable handwritten text.  
Why it matters: The OCR prompt is explicitly tuned for handwritten Portuguese text, so synthetic printed text is not a full success test.  
Affects: OCR users.  
Fix applied: No code change. The helper failed closed with the expected user-facing error. A real handwritten-photo fixture is still needed.

## 6. Fixes Applied

Code changes:
- `lib/server/ai/nvidia.ts`
  - Changed primary model to exactly `minimaxai/minimax-m2.7`.
  - Added MiniMax prompt adapter requesting final `message.content`.
  - Added `chat_template_kwargs.enable_thinking=false`.
  - Added configurable timeout via `NVIDIA_MAX_TIMEOUT_MS`.
  - Added explicit detection of reasoning-only responses.
- `lib/server/ai/provider.ts`
  - Added Max-runtime fallback to Groq after NVIDIA failure.
  - Preserves server-side Max entitlement while marking provider as `nvidia-fallback:<provider>`.

Documentation changes:
- `README.md`
- `FRONTEND_INVENTORY.md`
- `AGENTS.md`
- `IMPLEMENTACAO_PLANO_MAX.md`
- `app/privacidade/page.tsx`

Audit artifact:
- `AI_SYSTEMS_AUDIT_2026-05-14.md`

## 7. Test Results

| Test | User Type | Provider/Model | Expected | Actual | Result | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Direct simple text recommended params | N/A | NVIDIA `minimaxai/minimax-m2.7` | `message.content` with `OK` | Timed out | Fail | Direct local NVIDIA test |
| Direct simple JSON recommended params | N/A | NVIDIA `minimaxai/minimax-m2.7` | Valid JSON | Timed out | Fail | Direct local NVIDIA test |
| Direct strict JSON low temperature | N/A | NVIDIA `minimaxai/minimax-m2.7` | Valid JSON | Timed out | Fail | Direct local NVIDIA test |
| Direct JSON with `detailed thinking off` | N/A | NVIDIA `minimaxai/minimax-m2.7` | Valid JSON | Valid JSON | Pass | Direct local NVIDIA test |
| Direct JSON with `enable_thinking=false` | N/A | NVIDIA `minimaxai/minimax-m2.7` | Valid JSON | Valid JSON | Pass | Direct local NVIDIA test |
| Direct ENEM question, app-shaped | N/A | NVIDIA `minimaxai/minimax-m2.7` | Valid questions JSON | Timed out | Fail | Direct local NVIDIA test |
| Direct ENEM question, recommended params | N/A | NVIDIA `minimaxai/minimax-m2.7` | Valid questions JSON | Timed out | Fail | Direct local NVIDIA test |
| Direct essay correction | N/A | NVIDIA `minimaxai/minimax-m2.7` | Valid correction JSON | Timed out | Fail | Direct local NVIDIA test |
| Direct long prompt | N/A | NVIDIA `minimaxai/minimax-m2.7` | Valid JSON | Timed out | Fail | Direct local NVIDIA test |
| Direct streaming small JSON | N/A | NVIDIA `minimaxai/minimax-m2.7` | Valid streamed JSON | Valid JSON | Pass | Direct local NVIDIA test |
| User-provided empty prompt | N/A | NVIDIA `minimaxai/minimax-m2.7` | Useful final content | Timed out | Fail | Direct local NVIDIA test |
| Standard question runtime | Free/non-Max | Groq `openai/gpt-oss-120b` | Valid question JSON | 1 question, 4 alternatives, 1 correct | Pass | App runtime using production env |
| Standard essay runtime | Free/non-Max | Groq `openai/gpt-oss-120b` | Valid essay JSON | 5 competencies + feedback | Pass | App runtime using production env |
| Max entitlement selection | Max | Supabase + app runtime | Max access true | Max access true | Pass | Production Supabase state |
| Free entitlement selection | Free/non-Max | Supabase + app runtime | Max access false | Max access false | Pass | App runtime random UUID |
| Max question runtime | Max | MiniMax first, Groq fallback | Valid question JSON | Valid JSON via `nvidia-fallback:primary` | Pass | App runtime using production env |
| Max essay runtime | Max | MiniMax first, Groq fallback | Valid essay JSON | Valid JSON via `nvidia-fallback:primary` | Pass | App runtime using production env |
| Max theme runtime | Max | MiniMax first, Groq fallback | Valid theme JSON | Valid JSON via `nvidia-fallback:primary` | Pass | App runtime using production env |
| Invalid NVIDIA key fallback | Max | Invalid NVIDIA then Groq | Valid fallback JSON | Valid JSON via fallback | Pass | App runtime using production env |
| OCR synthetic image | Auth-helper direct | Gemini `gemini-2.5-flash` | Extract text from image | Rejected as unreadable handwritten text | Limited / fail-closed | Direct helper test |

## 8. Max Plan Final Verdict

`minimaxai/minimax-m2.7` is not production-ready as the only Max plan model.

The Max AI system is production-safer with the new fallback: MiniMax is attempted first, but valid Max users still receive app-compatible AI output when MiniMax times out or fails. The final production posture is:

`minimaxai/minimax-m2.7` works only with limitations; fallback is required.

## 9. Verification

Completed before commit:
- Direct NVIDIA model tests.
- App-runtime Max and free entitlement tests.
- App-runtime Max question generation, essay correction, and theme generation tests.
- App-runtime standard/free question and essay tests.
- Invalid NVIDIA API key fallback test.
- Supabase MCP entitlement health check:
  - currently entitled Max rows: 1
  - unsafe/expired active rows: 0
  - total Max rows: 6
- Synthetic OCR helper fail-closed test.
- Secret scan for the temporary NVIDIA key in repository files.

Completed before commit:
- `npm run lint`: passed.
- `npm run build`: passed.

Production deployment verification after push:
- Vercel production deployment for commit `ae86748` reached `READY` and was aliased to `foconoenem.vercel.app`.
- `GET /`: 200.
- `GET /api/questoes?disciplines=Matem%C3%A1tica&model=minimaxai%2Fminimax-m2.7` without auth: 401 `not_authenticated`.
- `POST /api/corrigir` without auth: 401 `not_authenticated`.
- `POST /api/ocr` without auth: 401 `not_authenticated`.
- `POST /api/doacao/webhook` with an invalid Stripe signature: 400 signature-verification failure.
- `GET /privacidade`: contains `minimaxai/minimax-m2.7` and fallback disclosure.
- `vercel env ls production`: expected AI/payment/Supabase environment variable names present as encrypted values.
- `vercel logs --environment production --level error --since 15m`: no logs found.

## 10. Files Changed

- `lib/server/ai/nvidia.ts`: MiniMax primary model, reasoning-off adapter, timeout, empty/reasoning-only response handling.
- `lib/server/ai/provider.ts`: Max fallback to Groq after NVIDIA failure.
- `README.md`: documented MiniMax-first with server-side fallback and `NVIDIA_MAX_TIMEOUT_MS`.
- `FRONTEND_INVENTORY.md`: documented Max AI provider and timeout env var.
- `AGENTS.md`: documented operational Max AI behavior.
- `IMPLEMENTACAO_PLANO_MAX.md`: documented primary MiniMax and fallback.
- `app/privacidade/page.tsx`: updated privacy text for NVIDIA MiniMax and Groq fallback.
- `AI_SYSTEMS_AUDIT_2026-05-14.md`: this report.

## 11. Remaining Risks

- MiniMax may add latency before fallback. The default 8-second timeout limits but does not eliminate that cost.
- MiniMax small JSON works under specific controls, but realistic app prompts still do not reliably finish.
- Streaming helped small JSON only; route handlers currently use non-streaming completions.
- OCR still needs a real handwritten fixture test; synthetic generated images were rejected as unreadable.
- Production should be monitored for fallback frequency. If fallback is constant, MiniMax should be disabled or replaced.

## 12. Recommended Next Steps

1. Monitor logs for `[Max AI] NVIDIA primary model failed; using standard fallback.`
2. If fallback frequency is high, temporarily route Max directly to Groq or another reliable premium model.
3. Ask NVIDIA for the supported MiniMax parameter or endpoint mode that forces final `message.content` for long JSON tasks.
4. Add automated contract tests for question, essay, and theme JSON before future model migrations.
5. Add a real handwritten OCR fixture and test the `/api/ocr` route with authenticated test cookies.
6. Consider a shorter `NVIDIA_MAX_TIMEOUT_MS` if production latency is too high.

## 13. Security Cleanup

- The temporary NVIDIA key was not committed.
- The temporary NVIDIA key was not written to this report.
- The temporary NVIDIA key was not written to documentation.
- The temporary NVIDIA key was not included in the Git diff.
- Temporary test files were created only under `/tmp`.
- Repository scan for the temporary key returned no matches.
- The temporary key should be revoked/deleted after this audit.
