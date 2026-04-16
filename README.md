# PGConf Poland 2026

Official website for PGConf Poland 2026 — the PostgreSQL community conference.

- **Date**: 24 November 2026
- **Venue**: Gdańsk, Poland

## Stack

- **Frontend**: [Astro 5](https://astro.build/) (static output) + [Tailwind CSS v4](https://tailwindcss.com/) (CSS-first `@theme`)
- **Backend**: Managed [Azure Functions](https://learn.microsoft.com/azure/azure-functions/) (Node.js 20, Functions v4 programming model, TypeScript)
- **Hosting**: [Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/) (Standard tier — custom domain, PR preview environments)
- **Shared contracts**: Zod schemas in `packages/contracts`, consumed by both `web` and `api`
- **Tooling**: pnpm workspaces, Biome (lint + format), TypeScript strict

## Repo layout

```
pgconf.pl/
├── web/                    # Astro app (SWA app_location)
├── api/                    # Managed Azure Functions (SWA api_location)
├── packages/
│   └── contracts/          # Shared Zod schemas + TS types
├── .github/workflows/      # CI + Azure SWA deploy pipelines
├── staticwebapp.config.json
├── swa-cli.config.json
└── pnpm-workspace.yaml
```

## Local development

### Prerequisites

- [Node.js 20](https://nodejs.org/) (LTS)
- [pnpm 9](https://pnpm.io/installation)
- [Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local) — required to run the API locally
- [Static Web Apps CLI](https://azure.github.io/static-web-apps-cli/) (`npm i -g @azure/static-web-apps-cli`) — emulates the SWA routing + auth layer locally

### Install

```bash
pnpm install
```

### Run

```bash
# Full stack: SWA emulator with both web + api wired together
pnpm dev

# Or run each side in isolation:
pnpm dev:web   # Astro on http://localhost:4321
pnpm dev:api   # Functions host on http://localhost:7071
```

## Deployment

- Pushes to `main` trigger a production deploy via the `Azure Static Web Apps CI/CD` GitHub Action.
- Pull requests against `main` get an isolated **preview environment** (SWA Standard feature). The environment is torn down automatically when the PR is closed.

### Required GitHub secrets

| Secret                              | Purpose                                |
|-------------------------------------|----------------------------------------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN`   | Deployment token from the SWA resource |

### Required SWA Application Settings

Configure these as **Application Settings** on the Static Web App resource (Azure portal → Configuration). They are surfaced as environment variables to the Functions runtime.

| Setting                       | Description                                                  |
|-------------------------------|--------------------------------------------------------------|
| `TURNSTILE_SECRET`            | Cloudflare Turnstile secret key (server-side verification)   |
| `MAILER_API_KEY`              | API key for the transactional email provider (Resend/SendGrid) |
| `MAILER_FROM`                 | Verified sender address (e.g. `noreply@pgconf.pl`)           |
| `PROGRAM_COMMITTEE_EMAIL`     | Inbox that receives CFP submission notifications             |
| `CONTACT_INBOX`               | Inbox for the public contact form                            |
| `NEWSLETTER_LIST_ID`          | Mailing-list ID used by the newsletter endpoint              |
| `TABLE_STORAGE_CONNECTION`    | Azure Storage connection string for Table Storage submissions |

## License

MIT — copyright PostgreSQL Europe. (License choice to be confirmed against PostgreSQL Europe convention; MIT is the working default.)
