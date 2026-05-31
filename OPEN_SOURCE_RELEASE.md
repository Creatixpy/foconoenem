# Open Source Release Checklist

This repository is intended to be public, but the release must be made from a clean source tree and a clean publication history.

## Required Before Publishing

1. Choose and add an OSI-approved `LICENSE` file.
2. Rotate any secrets that ever appeared in local files or Git history:
   - Supabase MCP access token from historical `.vscode/mcp.json`
   - Supabase service-role keys used locally
   - Stripe secret and webhook signing secrets used locally
   - Groq, Gemini, NVIDIA, NewsAPI, and Vercel tokens used locally
3. Enable Supabase Auth leaked-password protection in the Supabase dashboard.
4. Publish from a history that does not include the old `.vscode/mcp.json` token-bearing commits.

## Recommended Publication Path

The safest path is a fresh public repository or orphan branch created from the cleaned current tree after the license is added. This avoids exposing old private commits while preserving the cleaned source files.

If preserving history is required, rewrite history with a reviewed tool such as `git filter-repo` or BFG Repo-Cleaner, then run the release verifier and force-push only after confirming every collaborator understands the rewrite.

## Local Verification

Run:

```bash
npm run verify:open-source
npm run verify:history-clean
npm run lint
npm run build
```

The open-source verifier checks the current publishable tree for common secret formats and blocks release when required public-release files are missing.
The history verifier checks all local Git revisions for high-risk secret patterns. It is expected to fail on the current private history until the historical `.vscode/mcp.json` exposure is removed or a fresh public history is used.

After adding a license and rotating exposed secrets, create a fresh source tree with:

```bash
npm run release:public-tree
```

By default this writes to `../foconoenem-public-release`. Initialize a new Git repository there only after `npm run verify:open-source` passes.

## External Verification Performed

Current audit evidence:

- Supabase MCP: public app tables have RLS enabled and no direct table grants to `anon`, `authenticated`, or `public`.
- Supabase MCP: generated TypeScript types match `types/supabase.ts`.
- Supabase MCP: only security advisor warning found was leaked-password protection disabled.
- Vercel CLI: project is linked to `foconoenem`, production deployment is Ready, and environment variables are encrypted in Vercel.
- Stripe CLI: live product, price, and webhook endpoint metadata were checked without exporting customer/payment data.
