# biologicalcontrol.org

Community folklore archive for everyone who was part of the IITA Biological Control Programme / PHMD world — staff, families, and friends.

## Monorepo

| Path | App |
| --- | --- |
| `web/` | Next.js site (deploy this to Vercel) |
| `studio/` | Sanity Studio |
| `docs/` | Research notes + [backend architecture](docs/backend-architecture.md) |

## Local

```bash
# Site
cd web && npm install && npm run dev

# Studio
cd studio && pnpm install && pnpm dev
```

Copy `web/.env.example` → `web/.env.local`.

## Vercel

- Import this GitHub repo
- **Root Directory:** `web`
- Framework: Next.js
- Env vars: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`
- Domain: `biologicalcontrol.org`
