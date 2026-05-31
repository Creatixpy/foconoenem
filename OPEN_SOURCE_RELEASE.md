# Open Source Release Checklist

This repository is already public, but a fully clean open-source release still requires a clean source tree and a clean publication history.

## Required For A Fully Clean Public Release

1. Keep the OSI-approved `LICENSE` file in the public tree.
2. Rotate any secrets that ever appeared in local files or Git history:
   - Supabase MCP access token from historical `.vscode/mcp.json`
   - Supabase service-role keys used locally
   - Stripe secret and webhook signing secrets used locally
   - Groq, Gemini, NVIDIA, NewsAPI, and Vercel tokens used locally
3. Enable Supabase Auth leaked-password protection in the Supabase dashboard.
4. Publish from a history that does not include the old `.vscode/mcp.json` token-bearing commits.

## Recommended Remediation Path

The safest path is a fresh public repository or orphan branch created from the cleaned current tree after exposed secrets are rotated. This avoids exposing old private commits while preserving the cleaned source files.

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
The history verifier checks all local Git revisions for high-risk secret patterns. As of the current public `main` history, it still fails because historical commits include `.vscode/mcp.json`; a fresh public history or reviewed history rewrite is still required for a fully clean open-source release.

After rotating exposed secrets, create a fresh source tree with:

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
