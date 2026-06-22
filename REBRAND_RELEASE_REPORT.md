# AprovIA Rebrand Release Report

Date: 2026-06-22 (America/Sao_Paulo)

All commands below were executed from the linked repository. Output streams were combined with `2>&1`; exit codes are recorded explicitly.

## Initial Vercel inspection

### `vercel project ls`

Exit code: `0`

```text
Fetching projects in gabriel-pereira-rorigues-projects
> Projects found under gabriel-pereira-rorigues-projects [2s]

  Project Name   Latest Production URL             Updated   Node Version
  sreetguilda    https://streetguilda.vercel.app   10d       24.x
  foconoenem     https://foconoenem.vercel.app     22d       22.x
  cinemasync     https://cinemasyncbr.vercel.app   26d       24.x
  nitrados       https://nitrados.vercel.app       27d       22.x
  himiproject    https://himiproject.vercel.app    30d       24.x
  saonopolis     https://saonopolis.vercel.app     33d       22.x
  sgpnoticias    https://sgpnoticias.vercel.app    33d       22.x
```

### `vercel alias ls`

Exit code: `0`

```text
Fetching aliases under gabriel-pereira-rorigues-projects
> aliases found under gabriel-pereira-rorigues-projects [2s]
  source                                                                url                                                                           age
  sreetguilda-i2rfmv9hu-gabriel-pereira-rorigues-projects.vercel.app    streetesports.vercel.app                                                      23h
  sreetguilda-f4nbd3oac-gabriel-pereira-rorigues-projects.vercel.app    sreetguilda-creatixpy-1391-gabriel-pereira-rorigues-projects.vercel.app       10d
  foconoenem-12kycip99-gabriel-pereira-rorigues-projects.vercel.app     foconoenem-git-open-so-f7e777-gabriel-pereira-rorigues-projects.vercel.app    22d
  cinemasync-3gddid2wt-gabriel-pereira-rorigues-projects.vercel.app     cinemasyncbr.vercel.app                                                       28d
  cinemasync-3gddid2wt-gabriel-pereira-rorigues-projects.vercel.app     cinemasync-gabriel-pereira-rorigues-projects.vercel.app                       28d
  cinemasync-3gddid2wt-gabriel-pereira-rorigues-projects.vercel.app     cinemasync-creatixpy-1391-gabriel-pereira-rorigues-projects.vercel.app        28d
  saonopolis-kqk59dion-gabriel-pereira-rorigues-projects.vercel.app     saonopolis-creatixpy-1391-gabriel-pereira-rorigues-projects.vercel.app        54d
  foconoenem-p895y8s20-gabriel-pereira-rorigues-projects.vercel.app     foconoenem-creatixpy-1391-gabriel-pereira-rorigues-projects.vercel.app        60d
  himiproject-obayfhg4t-gabriel-pereira-rorigues-projects.vercel.app    himiproject.vercel.app                                                        68d
  himiproject-obayfhg4t-gabriel-pereira-rorigues-projects.vercel.app    himiproject-gabriel-pereira-rorigues-projects.vercel.app                      68d
  himiproject-obayfhg4t-gabriel-pereira-rorigues-projects.vercel.app    himiproject-git-main-gabriel-pereira-rorigues-projects.vercel.app             68d
  foconoenem-oglv14r9k-gabriel-pereira-rorigues-projects.vercel.app     foconoenem-git-fix-ocr-8835e0-gabriel-pereira-rorigues-projects.vercel.app    72d
  –                                                                     foconoenem-git-empty-p-b4c9ca-gabriel-pereira-rorigues-projects.vercel.app    72d
  –                                                                     foconoenem-git-feat-ph-4a0016-gabriel-pereira-rorigues-projects.vercel.app    72d
  –                                                                     foconoenem-git-feat-ad-a12783-gabriel-pereira-rorigues-projects.vercel.app    72d
  foconoenem-d28td1zec-gabriel-pereira-rorigues-projects.vercel.app     foconoenem-git-fix-qui-f45422-gabriel-pereira-rorigues-projects.vercel.app    72d
  –                                                                     foconoenem-git-fix-vis-8658ae-gabriel-pereira-rorigues-projects.vercel.app    72d
  –                                                                     foconoenem-git-fix-mis-0f39bf-gabriel-pereira-rorigues-projects.vercel.app    72d
  –                                                                     foconoenem-git-fix-dat-3472c4-gabriel-pereira-rorigues-projects.vercel.app    72d
  –                                                                     foconoenem-git-fix-bac-42eb73-gabriel-pereira-rorigues-projects.vercel.app    72d

> To display the next page run `vercel alias ls --next 1775910782128`
```

### `vercel domains ls`

Exit code: `0`

```text
Fetching Domains under gabriel-pereira-rorigues-projects
> 0 Domains found under gabriel-pereira-rorigues-projects [244ms]
```

## Project rename and production inspection

### `vercel project rename foconoenem aprovia`

Exit code: `0`

```text
> Success! Project foconoenem renamed to aprovia [270ms]
```

### `vercel inspect aprovia.vercel.app`

Exit code: `1`

```text
Fetching deployment "aprovia.vercel.app" in gabriel-pereira-rorigues-projects
Error: Can't find the deployment "aprovia.vercel.app" under the context "gabriel-pereira-rorigues-projects"
```

### `vercel project inspect aprovia && vercel project ls`

Exit code: `0`

```text
> Found Project gabriel-pereira-rorigues-projects/aprovia [872ms]

  General

    ID                          prj_JXUvfgzk66BZrGEbZ8RXZ1X2Xrnb
    Name                        aprovia
    Owner                       Gabriel pereira rorigues' projects
    Created At                  17 May 2025 13:12:39 [401d ago]
    Root Directory              .
    Node.js Version             22.x

  Framework Settings

    Framework Preset            Next.js
    Build Command               `npm run build` or `next build`
    Output Directory            Next.js default
    Install Command             `yarn install`, `pnpm install`, `npm install`, or `bun install`

Fetching projects in gabriel-pereira-rorigues-projects
> Projects found under gabriel-pereira-rorigues-projects [2s]

  Project Name   Latest Production URL             Updated   Node Version
  aprovia        https://foconoenem.vercel.app     17s       22.x
  sreetguilda    https://streetguilda.vercel.app   10d       24.x
  cinemasync     https://cinemasyncbr.vercel.app   26d       24.x
  nitrados       https://nitrados.vercel.app       27d       22.x
  himiproject    https://himiproject.vercel.app    30d       24.x
  saonopolis     https://saonopolis.vercel.app     33d       22.x
  sgpnoticias    https://sgpnoticias.vercel.app    33d       22.x
```

### `vercel inspect foconoenem.vercel.app`

Exit code: `0`

```text
Fetching deployment "foconoenem.vercel.app" in gabriel-pereira-rorigues-projects
> Fetched deployment "foconoenem-hfgs5zaln-gabriel-pereira-rorigues-projects.vercel.app" in gabriel-pereira-rorigues-projects [550ms]

  General

    id          dpl_94t5vjgrFJHYJuZSTaA2Kzeq5L51
    name        foconoenem
    target      production
    status      ● Ready
    url         https://foconoenem-hfgs5zaln-gabriel-pereira-rorigues-projects.vercel.app
    created     Sun May 31 2026 14:48:13 GMT-0300 (Brasilia Standard Time) [22d ago]

  Aliases

    ╶ https://foconoenem.vercel.app
    ╶ https://foconoenem-gabriel-pereira-rorigues-projects.vercel.app
    ╶ https://foconoenem-git-main-gabriel-pereira-rorigues-projects.vercel.app

  Builds

    ┌ .        [0ms]
    ├── λ _global-error (2.28MB) [gru1]
    ├── λ _global-error.rsc (2.28MB) [gru1]
    ├── λ _global-error.segments/__PAGE__.segment.rsc (2.28MB) [gru1]
    ├── λ _global-error.segments/_full.segment.rsc (2.28MB) [gru1]
    ├── λ _global-error.segments/_head.segment.rsc (2.28MB) [gru1]
    └── 194 output items hidden
```

### `vercel alias set foconoenem-hfgs5zaln-gabriel-pereira-rorigues-projects.vercel.app aprovia.vercel.app`

Exit code: `1`

```text
> Assigning alias aprovia.vercel.app to deployment foconoenem-hfgs5zaln-gabriel-pereira-rorigues-projects.vercel.app
Creating alias
Error: The chosen alias "aprovia.vercel.app" is already in use.
```

## Domain operations

### `vercel domains add aprovia.com.br aprovia`

Exit code: `1`

```text
Retrieving project…
{
  "status": "action_required",
  "reason": "missing_arguments",
  "action": "missing_arguments",
  "message": "Linked project is \"aprovia\". Run: vercel domains add <domain>",
  "next": [
    {
      "command": "vercel domains add <domain>",
      "when": "to add a domain to the linked project (single argument)"
    }
  ],
  "hint": "Run one of the commands in next[] to complete without prompting."
}
```

### `vercel domains add aprovia.vercel.app aprovia`

Exit code: `1`

```text
Retrieving project…
{
  "status": "action_required",
  "reason": "missing_arguments",
  "action": "missing_arguments",
  "message": "Linked project is \"aprovia\". Run: vercel domains add <domain>",
  "next": [
    {
      "command": "vercel domains add <domain>",
      "when": "to add a domain to the linked project (single argument)"
    }
  ],
  "hint": "Run one of the commands in next[] to complete without prompting."
}
```

The installed CLI requires the linked-project single-argument syntax, so the commands were retried accordingly.

### `vercel domains add aprovia.com.br`

Exit code: `0`

```text
Retrieving project…
Adding domain aprovia.com.br to project aprovia
> Success! Domain aprovia.com.br added to project aprovia. [426ms]
Fetching domain aprovia.com.br under gabriel-pereira-rorigues-projects
WARNING! This domain is not configured properly. To configure it you should either:
  a) Set the following record on your DNS provider to continue: `A aprovia.com.br 76.76.21.21` [recommended]
  b) Change your Domains's nameservers to the intended set
     Intended Nameservers    Current Nameservers
     ns1.vercel-dns.com      a.auto.dns.br          ✘
     ns2.vercel-dns.com      b.auto.dns.br          ✘

  We will run a verification for you and you will receive an email upon completion.
  Read more: https://vercel.link/domain-configuration
```

### `vercel domains add aprovia.vercel.app`

Exit code: `1`

```text
Retrieving project…
Adding domain aprovia.vercel.app to project aprovia
{
  "status": "error",
  "reason": "forbidden",
  "message": "The chosen alias \"aprovia.vercel.app\" is already in use. (403)",
  "next": [
    {
      "command": "vercel domains inspect aprovia.vercel.app",
      "when": "to inspect domain configuration and ownership"
    },
    {
      "command": "vercel domains buy aprovia.vercel.app",
      "when": "user must run interactively in a terminal—agents must not purchase; purchase also available in dashboard"
    },
    {
      "command": "vercel domains transfer-in",
      "when": "to transfer a domain you already own from another registrar into Vercel"
    },
    {
      "command": "xdg-open 'https://vercel.com/dashboard/domains'",
      "when": "to open the Domains dashboard in your browser"
    },
    {
      "command": "vercel domains add aprovia.vercel.app --force",
      "when": "to force move from another project (only if API returns project id—otherwise remove domain from the other project first)"
    }
  ]
}
```

### `vercel domains inspect aprovia.vercel.app`

Exit code: `1`

```text
Fetching Domain aprovia.vercel.app under gabriel-pereira-rorigues-projects
Error: You don't have access to the domain aprovia.vercel.app under gabriel-pereira-rorigues-projects.
> Run `vercel domains ls` to see your domains.
```

## Final Vercel inspection

### `vercel project ls`

Exit code: `0`

```text
Fetching projects in gabriel-pereira-rorigues-projects
> Projects found under gabriel-pereira-rorigues-projects [2s]

  Project Name   Latest Production URL             Updated   Node Version
  aprovia        https://foconoenem.vercel.app     15m       22.x
  sreetguilda    https://streetguilda.vercel.app   10d       24.x
  cinemasync     https://cinemasyncbr.vercel.app   26d       24.x
  nitrados       https://nitrados.vercel.app       27d       22.x
  himiproject    https://himiproject.vercel.app    30d       24.x
  saonopolis     https://saonopolis.vercel.app     33d       22.x
  sgpnoticias    https://sgpnoticias.vercel.app    33d       22.x
```

### `vercel alias ls`

Exit code: `0`

```text
Fetching aliases under gabriel-pereira-rorigues-projects
> aliases found under gabriel-pereira-rorigues-projects [1s]
  source                                                                url                                                                           age
  foconoenem-hfgs5zaln-gabriel-pereira-rorigues-projects.vercel.app     aprovia.com.br                                                                14m
  sreetguilda-i2rfmv9hu-gabriel-pereira-rorigues-projects.vercel.app    streetesports.vercel.app                                                      24h
  sreetguilda-f4nbd3oac-gabriel-pereira-rorigues-projects.vercel.app    sreetguilda-creatixpy-1391-gabriel-pereira-rorigues-projects.vercel.app       10d
  foconoenem-12kycip99-gabriel-pereira-rorigues-projects.vercel.app     foconoenem-git-open-so-f7e777-gabriel-pereira-rorigues-projects.vercel.app    22d
  cinemasync-3gddid2wt-gabriel-pereira-rorigues-projects.vercel.app     cinemasyncbr.vercel.app                                                       28d
  cinemasync-3gddid2wt-gabriel-pereira-rorigues-projects.vercel.app     cinemasync-gabriel-pereira-rorigues-projects.vercel.app                       28d
  cinemasync-3gddid2wt-gabriel-pereira-rorigues-projects.vercel.app     cinemasync-creatixpy-1391-gabriel-pereira-rorigues-projects.vercel.app        28d
  saonopolis-kqk59dion-gabriel-pereira-rorigues-projects.vercel.app     saonopolis-creatixpy-1391-gabriel-pereira-rorigues-projects.vercel.app        54d
  foconoenem-p895y8s20-gabriel-pereira-rorigues-projects.vercel.app     foconoenem-creatixpy-1391-gabriel-pereira-rorigues-projects.vercel.app        60d
  himiproject-obayfhg4t-gabriel-pereira-rorigues-projects.vercel.app    himiproject.vercel.app                                                        68d
  himiproject-obayfhg4t-gabriel-pereira-rorigues-projects.vercel.app    himiproject-gabriel-pereira-rorigues-projects.vercel.app                      68d
  himiproject-obayfhg4t-gabriel-pereira-rorigues-projects.vercel.app    himiproject-git-main-gabriel-pereira-rorigues-projects.vercel.app             68d
  foconoenem-oglv14r9k-gabriel-pereira-rorigues-projects.vercel.app     foconoenem-git-fix-ocr-8835e0-gabriel-pereira-rorigues-projects.vercel.app    72d
  –                                                                     foconoenem-git-empty-p-b4c9ca-gabriel-pereira-rorigues-projects.vercel.app    72d
  –                                                                     foconoenem-git-feat-ph-4a0016-gabriel-pereira-rorigues-projects.vercel.app    72d
  –                                                                     foconoenem-git-feat-ad-a12783-gabriel-pereira-rorigues-projects.vercel.app    72d
  foconoenem-d28td1zec-gabriel-pereira-rorigues-projects.vercel.app     foconoenem-git-fix-qui-f45422-gabriel-pereira-rorigues-projects.vercel.app    72d
  –                                                                     foconoenem-git-fix-vis-8658ae-gabriel-pereira-rorigues-projects.vercel.app    72d
  –                                                                     foconoenem-git-fix-mis-0f39bf-gabriel-pereira-rorigues-projects.vercel.app    72d
  –                                                                     foconoenem-git-fix-dat-3472c4-gabriel-pereira-rorigues-projects.vercel.app    72d

> To display the next page run `vercel alias ls --next 1775914412845`
```

### `vercel domains ls`

Exit code: `0`

```text
Fetching Domains under gabriel-pereira-rorigues-projects
> 1 Domain found under gabriel-pereira-rorigues-projects [254ms]

  Domain             Registrar           Nameservers         Expiration Date    Creator             Age
  aprovia.com.br     Third Party         Third Party         -                  creatixpy-1391      14m
```

### `vercel project inspect aprovia`

Exit code: `0`

```text
> Found Project gabriel-pereira-rorigues-projects/aprovia [1s]

  General

    ID                          prj_JXUvfgzk66BZrGEbZ8RXZ1X2Xrnb
    Name                        aprovia
    Owner                       Gabriel pereira rorigues' projects
    Created At                  17 May 2025 13:12:39 [401d ago]
    Root Directory              .
    Node.js Version             22.x

  Framework Settings

    Framework Preset            Next.js
    Build Command               `npm run build` or `next build`
    Output Directory            Next.js default
    Install Command             `yarn install`, `pnpm install`, `npm install`, or `bun install`
```

## Manual follow-up

- Use `https://aproviaedu.vercel.app` as the canonical public URL. The alias is active on the production deployment.
- Update `NEXT_PUBLIC_SITE_URL` and `SITE_URL` in local/Vercel environments to `https://aproviaedu.vercel.app`; the local `.env.local` still supplied the previous URL during an unoverridden build.
- Generate and install favicon ICO and Apple Touch PNG variants from `public/favicon.svg`.
- Update Stripe Dashboard product, statement descriptor, checkout branding and customer-facing emails.
- Update Supabase Auth email templates, site URL and allowed redirect URLs.
- Rename/update the GitHub repository and its social preview when ready.
- Create official social handles before restoring X or Instagram links; the UI currently exposes only GitHub `Creatixpy` and email.
- Replace the existing YouTube video, which still presents the previous visual identity; the home cover now discloses this transition.

## Subsequent domain cleanup

- `aproviaedu.vercel.app` was assigned successfully to the production deployment and verified as `Ready`.
- `aproviaedu.com.br` and `aprovia.com.br` were subsequently removed with `vercel domains rm <domain> --yes`.
- Final `vercel domains ls` output: `0 Domains found`.
- The `.com.br` aliases were removed with their domains; `aproviaedu.vercel.app` remains active.
