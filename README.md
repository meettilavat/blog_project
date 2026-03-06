# MeetTilavat.com - Blog, Portfolio, Resume

Live public site: https://www.meettilavat.com/

## Status
- Deployment is live and healthy (updated after post-merge rollout on February 10, 2026).
- Public app is internet-facing.
- Admin app is intended to stay private behind access controls.

## Overview
This repo powers a dual-app Next.js setup backed by one Supabase project:
- `apps/public`: read-only public website for published posts and resume.
- `apps/admin`: private editor/dashboard for writing, publishing, and managing posts.

## Tech Stack
- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Supabase (Postgres, Auth, Storage)
- Tiptap editor

## Repository Layout
- `apps/public/app/*` - public routes (`/`, `/posts/[slug]`, `/resume`, `sitemap`, `robots`)
- `apps/public/components/*` - public-specific UI (header)
- `apps/admin/app/*` - admin routes (`/dashboard`, `/editor/*`, `/login`)
- `apps/admin/proxy.ts` - admin access gate for private routes
- `components/*` - shared UI/components used by both apps
- `lib/*` - shared data access, actions, Supabase clients, utilities
- `styles/globals.css` - global styles/tokens

## Architecture Contracts
This root README is an index only. Canonical governance policy is owned by package-level docs next to the modules they govern.

- Supabase boundary policy: [`lib/supabase/README.md`](lib/supabase/README.md)
- Post contracts policy: [`lib/posts/contracts/README.md`](lib/posts/contracts/README.md)
- Contract-sensitive path/test gate: [`scripts/check-contract-governance.mjs`](scripts/check-contract-governance.mjs)

## Features
- Rich text authoring with headings, links, lists, quotes, tables, and images.
- Cover image + inline image support with Supabase Storage uploads.
- Draft/published workflow from admin dashboard.
- Public SSG/ISR post pages with sitemap + robots support.
- Resume page shared across public and admin apps.

## Local Development
### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Create `.env.local` at repo root:
```bash
NEXT_PUBLIC_SITE_URL=https://www.meettilavat.com
SITE_URL=https://www.meettilavat.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
`NEXT_PUBLIC_SITE_URL` and `SITE_URL` keep sitemap, canonical, Open Graph, and robots metadata aligned on the production `www` host. Supabase env values are required for data access; server-side Supabase client factories validate this boundary through a typed `loadSupabaseEnv()` step before constructing clients.

### 3. Run apps
```bash
# Admin app
npm run dev

# Public app
npm run dev:public
```

## Validation Commands
```bash
npm run lint
npm test
npm run build
npm run build:public
```

## CI Quality Gates
- Jenkins blocks image build/push/deploy unless both `npm run lint` and `npm test` pass.
- Jenkins also runs `npm run test:governance` to enforce contract-test updates when contract-sensitive modules change.
- Contract-sensitive boundaries expose explicit scope/version artifacts that compatibility tests assert (for example posts + Supabase client boundaries).
- This gate is intended to protect critical data/auth contracts from shipping regressions.

## Supabase Setup
- Canonical Supabase schema, storage policy, and boundary governance docs are co-located in [`lib/supabase/README.md`](lib/supabase/README.md).
- Post-domain contract governance is co-located in [`lib/posts/contracts/README.md`](lib/posts/contracts/README.md).

## Auth and Access Behavior
- Admin access gate (`apps/admin/proxy.ts`) allows public paths (`/login`, `/signup`) and protects everything else.
- `/signup` currently redirects to `/login`.
- Server action `signUpAction` is disabled and returns an access error message.
- `/api/uploads/images` requires an authenticated user with `admin` or `editor` role metadata.

## Deployment Notes
- Docker builds support both apps via `APP=admin|public` build arg.
- Jenkins pipeline handles linting, test execution, image build/push, and EC2 deploy.
- Production compose setup uses:
  - `docker-compose.ec2.yml`
  - Cloudflare tunnel (`cloudflared`) for public ingress.

## Security Notes
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is a publishable key.
- Never commit or expose Supabase service role keys.
- Keep RLS enabled; public read access relies on `status = 'published'` policy.
- Keep admin app behind access controls in production.
