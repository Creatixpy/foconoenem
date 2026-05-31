# Security Policy

## Reporting a Vulnerability

Do not open a public issue for vulnerabilities or exposed credentials.

Send reports to `creatixpy@gmail.com` with:

- affected route, API, or component
- steps to reproduce
- expected impact
- any safe proof of concept that does not expose user data

## Secret Handling

Never commit `.env.local`, Vercel pulls, Supabase access tokens, Stripe keys, AI provider keys, webhook secrets, or service-role keys.

If any secret is exposed, rotate it in the provider dashboard before making the repository public and verify the replacement is only stored in the deployment platform or local ignored files.
