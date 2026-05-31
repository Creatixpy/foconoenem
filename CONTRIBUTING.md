# Contributing

## Local Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill only the services needed for the area you are testing.
3. Run `npm run dev` for local development.

## Validation

Before opening a pull request, run:

```bash
npm run lint
npm run build
npm run verify:open-source
npm run verify:history-clean
```

Schema changes must be added under `supabase/migrations/` and mentioned in the pull request.

## Security

Do not include secrets, local environment files, downloaded deployment env files, logs, or private agent/editor configuration in commits.
