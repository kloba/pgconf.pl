# @pgconf/api

Managed Azure Functions backend for the PGConf Poland 2026 site. Co-located with the Astro frontend under SWA, exposed at `/api/*`.

## Prerequisites

- Node.js 20 LTS (matches the Functions runtime).
- Azure Functions Core Tools v4:

  ```bash
  npm install -g azure-functions-core-tools@4 --unsafe-perm true
  # or via Homebrew on macOS:
  brew tap azure/functions
  brew install azure-functions-core-tools@4

  func --version   # expect 4.x
  ```

- Azurite (for local Table Storage emulator) — optional but recommended:

  ```bash
  npm install -g azurite
  azurite --silent --location ./.azurite
  ```

## Setup

1. Copy the env template:

   ```bash
   cp local.settings.json.example local.settings.json
   ```

   Then fill in real values for `TURNSTILE_SECRET`, `MAILER_API_KEY`, etc. The file is gitignored — never commit it.

2. Install workspace deps from the repo root:

   ```bash
   pnpm install
   ```

## Run locally

From the repo root:

```bash
pnpm dev:api          # build + func start, only the API
pnpm dev              # full SWA emulator (web + api together)
```

From this directory:

```bash
pnpm build            # tsc -> dist/
pnpm start            # prebuilds, then `func start`
pnpm watch            # tsc -w (rebuild on change)
pnpm typecheck        # tsc --noEmit
```

The `extensions.http.routePrefix` in `host.json` is set to empty so SWA's `/api/*` routes line up cleanly.

## Required environment variables

See `local.settings.json.example` for the full template.

| Name                       | Purpose                                                     |
| -------------------------- | ----------------------------------------------------------- |
| `FUNCTIONS_WORKER_RUNTIME` | Always `node`.                                              |
| `AzureWebJobsStorage`      | Functions runtime storage (Azurite locally).                |
| `TABLE_STORAGE_CONNECTION` | Table Storage connection string for submissions.            |
| `TURNSTILE_SECRET`         | Cloudflare Turnstile secret. Use `skip-in-dev` to bypass.   |
| `MAILER_API_KEY`           | Resend (or compatible) API key. Logs to console if unset.   |
| `MAILER_FROM`              | From address for all outgoing mail.                         |
| `PROGRAM_COMMITTEE_EMAIL`  | Recipient for CFP submission notifications.                 |
| `CONTACT_INBOX`            | Recipient for contact form messages.                        |
| `NEWSLETTER_LIST_ID`       | Audience / list id for the newsletter provider.             |

In production these come from SWA Application Settings.

## Endpoints

All endpoints are anonymous (CAPTCHA-protected) and accept `application/json`.

### `POST /api/cfp-submit`

Submit a Call-for-Papers proposal.

```bash
curl -X POST http://localhost:4280/api/cfp-submit \
  -H "Content-Type: application/json" \
  -d '{
    "speakerName": "Ada Lovelace",
    "speakerEmail": "ada@example.com",
    "speakerBio": "Mathematician and writer, chiefly known for her work on the Analytical Engine.",
    "speakerCountry": "United Kingdom",
    "talkTitle": "Notes on the Analytical Engine",
    "talkAbstract": "An exploration of how Babbage'\''s engine could be programmed for arbitrary symbolic manipulation, and what that means for modern PostgreSQL workloads.",
    "talkFormat": "talk-45",
    "talkLevel": "intermediate",
    "talkTopics": ["history", "internals"],
    "needsTravelSupport": false,
    "turnstileToken": "skip-in-dev"
  }'
```

### `POST /api/contact`

General contact form.

```bash
curl -X POST http://localhost:4280/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Hacker",
    "email": "jane@example.com",
    "category": "general",
    "subject": "Hello from Gdańsk",
    "message": "Looking forward to the conference — could you confirm the venue address?",
    "turnstileToken": "skip-in-dev"
  }'
```

### `POST /api/newsletter`

Subscribe an email to the announcements list.

```bash
curl -X POST http://localhost:4280/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{
    "email": "subscriber@example.com",
    "consent": true,
    "turnstileToken": "skip-in-dev"
  }'
```

All responses follow the shape `{ "ok": true, ... }` on success or `{ "ok": false, "error": "<code>" }` on failure (`validation`, `captcha`, `internal`, `invalid_json`).
