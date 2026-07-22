# biologicalcontrol.org

Community folklore archive for everyone who was part of the IITA Biological Control Programme / PHMD world — staff, families, and friends.

## Monorepo

| Path | App |
| --- | --- |
| `web/` | Next.js site (Vercel root directory) |
| `studio/` | Sanity Studio |
| `packages/api` | Hono API (`/api/v1/*`) |
| `packages/db` | Drizzle schema + Neon client |
| `packages/shared` | Shared Zod types |
| `docs/` | Research + [backend architecture](docs/backend-architecture.md) |

## Local

From the repo root (npm workspaces):

```bash
npm install
cp web/.env.example web/.env.local
# Set AUTH_DEV_BYPASS=true until Clerk keys arrive
# Set DATABASE_URL when you have Neon

npm run dev
```

Studio (pnpm, separate):

```bash
cd studio && pnpm install && pnpm dev
```

### App API (no Clerk yet)

- Health: `GET /api/v1/health`
- With `AUTH_DEV_BYPASS=true`, protected routes act as a fixed community user
- Clerk password + SMS: wire keys into `.env.local` tomorrow, then drop the bypass

```bash
# Push schema to Neon once DATABASE_URL is set
npm run db:push
```

(`db:push` script alias — see package.json / `packages/db`)

## Vercel

- Import this GitHub repo
- **Root Directory:** `web`
- Framework: Next.js
- Env: Sanity public vars + optional `DATABASE_URL`, `AUTH_DEV_BYPASS`, Clerk keys
- Domain: `biologicalcontrol.org`
