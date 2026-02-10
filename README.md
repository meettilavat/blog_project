# MeetTilavat.com - Blog, Portfolio, Resume

Live public site: https://meettilavat.com/

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
- `apps/admin/middleware.ts` - admin route gating middleware
- `components/*` - shared UI/components used by both apps
- `lib/*` - shared data access, actions, Supabase clients, utilities
- `styles/globals.css` - global styles/tokens

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
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

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
npm run build
npm run build:public
```

## Supabase Setup
### Posts table + RLS
Run in Supabase SQL editor:
```sql
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content jsonb,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft','published')),
  author_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_timestamp
before update on public.posts
for each row execute procedure public.handle_updated_at();

alter table public.posts enable row level security;

create policy "published posts are readable"
  on public.posts for select
  using (status = 'published');

create policy "authors read own drafts"
  on public.posts for select
  using (auth.uid() = author_id);

create policy "authors manage own posts"
  on public.posts
  for insert with check (auth.uid() = author_id)
  for update using (auth.uid() = author_id)
  for delete using (auth.uid() = author_id);
```

### Legacy schema note
If your `posts` table was created before `excerpt` existed, run:
```sql
alter table public.posts add column if not exists excerpt text;
```

### Storage (images)
Create a bucket named `blog-images` with public read and authenticated write permissions:
```sql
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict do nothing;

create policy "authenticated users can upload images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'blog-images');

create policy "owners can update their uploads"
  on storage.objects for update to authenticated
  using (bucket_id = 'blog-images' and auth.uid() = owner);

create policy "owners can delete their uploads"
  on storage.objects for delete to authenticated
  using (bucket_id = 'blog-images' and auth.uid() = owner);
```

## Auth and Access Behavior
- Admin middleware allows public paths (`/login`, `/signup`) and protects everything else.
- `/signup` currently redirects to `/login`.
- Server action `signUpAction` is disabled and returns an access error message.

## Deployment Notes
- Docker builds support both apps via `APP=admin|public` build arg.
- Jenkins pipeline handles linting, image build/push, and EC2 deploy.
- Production compose setup uses:
  - `docker-compose.ec2.yml`
  - Cloudflare tunnel (`cloudflared`) for public ingress.

## Security Notes
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is a publishable key.
- Never commit or expose Supabase service role keys.
- Keep RLS enabled; public read access relies on `status = 'published'` policy.
- Keep admin app behind access controls in production.
