# Security Policy

## Reporting a Vulnerability

Do not open a public issue for vulnerabilities or exposed credentials.

Send reports to `contato@foconoenem.com` with:

- affected route, API, or component
- steps to reproduce
- expected impact
- any safe proof of concept that does not expose user data

## Secret Handling

Never commit `.env.local`, Vercel pulls, Supabase access tokens, Stripe keys, AI provider keys, webhook secrets, or service-role keys.

If any secret is exposed, rotate it in the provider dashboard before making the repository public and verify the replacement is only stored in the deployment platform or local ignored files.

## Preventing Publication of Private Data

- Keep local agent instructions, editor/MCP configurations, diagnostic reports,
  downloaded environment files and private keys outside version control and
  deploy artifacts. Use placeholders in `.env.example`, including admin lists.
- Store runtime credentials only in private environment files or the deployment
  platform's secret store. Restrict local credential files to their owner.
- Run `npm run test:security`, `npm run verify:open-source` and
  `npm run verify:history-clean`. The tree check inspects staged blobs as well as
  files on disk; history checks cover reachable content and metadata. Reports
  disclose rule names and locations only, never matched values.
- Public release export uses only approved tracked blobs from the index and
  rejects private paths and symbolic links. Keep GitHub secret scanning and
  push protection enabled where available.

## Responding to an Exposure

Invalidate exposed credentials at the provider first. Deleting a file or
rewriting commits does not invalidate copies already downloaded. Keep evidence
and remediation plans private; never publish secret values in reports, issues,
comments, diffs or command arguments.

History cleanup requires explicit authorization, preservation of local work,
an isolated clone and a verified remote reference snapshot. Push only the
intended branches/tags with explicit SHA leases and re-audit a fresh clone.
Do not push backup refs or merge the previous contaminated history back in.

Pull-request refs, cached views and forks can retain old objects after a branch
rewrite. Request private GitHub Support assistance when those copies need
removal, and coordinate new clones with collaborators. Keep any inaccessible
surface or provider revocation without evidence explicitly unverified.
