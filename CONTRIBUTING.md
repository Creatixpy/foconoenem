# Contributing

## Local Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill only the services needed for the area you are testing.
3. Run `npm run dev` for local development.

## Validation

Before opening a pull request, run:

```bash
npm run lint
npm run test:security
npm run build
npm run verify:open-source
npm run verify:history-clean
```

Schema changes must be added under `supabase/migrations/` and mentioned in the pull request.

## Publication

Use [README.md](README.md) for release commands. `npm run verify:open-source`
checks the working tree and the exact staged blobs, including files absent from
the working tree. It does not establish clean Git history. A
`npm run verify:history-clean` failure blocks publication of that history.
Do not suppress the check. Rewriting public history is exceptional remediation
for an explicitly authorized incident, with private backups, scoped refs and
explicit remote SHA leases; never use it as a routine way to pass checks.

Local agent instructions, editor/MCP settings, environment files and private
diagnostics are excluded from publication and deploys. Keep incident evidence
outside the repository, restrict access, and never print credential values in
checks, issues or pull requests. Public documentation describes the protection,
not private incident details.

`npm run release:public-tree` exports only approved tracked blobs from the Git
index to a new destination outside the repository. It excludes untracked files
and unstaged changes and refuses to overwrite an existing directory. Preparing
the tree does not publish it, remove remote caches or invalidate credentials;
follow [SECURITY.md](SECURITY.md) for remediation.

## Security

Do not include secrets, local environment files, downloaded deployment env files, logs, or private agent/editor configuration in commits.
