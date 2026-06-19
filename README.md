# Car4You — Backend

Headless CMS / API for Car4You, built with **Strapi 5.33.3** (TypeScript) on
**PostgreSQL**.

## Tech stack

- **Strapi 5.33.3** (TypeScript, CommonJS)
- **PostgreSQL** (database `main_car4youpanama`)
- **pino** logging via `strapi.log`
- **Vitest** for unit tests
- **pnpm** as the package manager

## Prerequisites

- Node.js `>=20 <=24`
- pnpm `10.x`
- A reachable PostgreSQL instance

## Environment

Create a `.env` from `.env.example` and fill in the secrets and database
connection. Strapi will not boot without the auth/session secrets:

```bash
HOST=0.0.0.0
PORT=1337
APP_KEYS=...
API_TOKEN_SALT=...
ADMIN_JWT_SECRET=...        # required by the SessionManager
TRANSFER_TOKEN_SALT=...
JWT_SECRET=...
ENCRYPTION_KEY=...
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=main_car4youpanama
DATABASE_USERNAME=...
DATABASE_PASSWORD=...
```

> If you see `Missing admin.auth.secret configuration`, your `.env` is missing
> `ADMIN_JWT_SECRET`.

## Getting started

```bash
pnpm install
pnpm develop      # http://localhost:1337 (admin at /admin)
```

## Available scripts

| Script                         | Description                        |
| ------------------------------ | ---------------------------------- |
| `pnpm develop`                 | Start Strapi with auto-reload      |
| `pnpm start`                   | Start Strapi without auto-reload   |
| `pnpm build`                   | Build the admin panel              |
| `pnpm lint`                    | Run ESLint over `src/`             |
| `pnpm format` / `format:check` | Apply / verify Prettier formatting |
| `pnpm typecheck`               | `tsc --noEmit`                     |
| `pnpm test`                    | Run the Vitest suite               |

## Permissions

REST permissions for new content-types are **disabled by default** in Strapi.
Rather than toggling them by hand in the admin UI, they are granted
idempotently on bootstrap so they survive a fresh database. See
`src/extensions/permissions/authenticated-access.ts` and its use in
`src/index.ts`.

## Code quality & conventions

- **Prettier** owns formatting; **ESLint** (flat config, typescript-eslint)
  owns linting.
- **Husky** runs `lint-staged` on `pre-commit` and **commitlint** on
  `commit-msg`.
- Commit messages must follow **Conventional Commits**, e.g.
  `fix(permissions): grant service catalog access`.
- `tsconfig` compiles with `removeComments`, so production output ships without
  comments.

## Logging

Use `strapi.log` (pino) instead of `console.*`. It is structured and its level
is controlled by the environment.

## Maintenance

A propose-only database/content-type cleanup analysis lives in
[`docs/CLEANUP-REPORT.md`](docs/CLEANUP-REPORT.md).
