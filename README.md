# MeetTilavat.com — Blog, Portfolio, Resume

Live site: https://meettilavat.com/

This repo powers my personal website. It’s split into a read-only public app and a private admin app for writing/publishing posts, both backed by a single Supabase project.

## Apps
- `apps/public` — public site (no auth UI/routes; reads `published` posts only).
- `apps/admin` — admin/editor/dashboard (Supabase auth, publishing, image uploads).

## Tech stack
- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Supabase (Postgres, Auth, Storage)
- Tiptap editor

## Features
- Per-post cover images + inline images (Supabase Storage).
- Rich-text posts with tables and links.
- Optional post description (“excerpt”) shown on the homepage + used for previews.
- Resume page styled to match the site.

## Local development
1) Install:
```bash
npm install
```

2) Create `.env.local` in the repo root:
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

3) Run:
```bash
# Public app
npm run dev:public

# Admin app
npm run dev
```

Notes:
- The post listing is cached and revalidates periodically, so newly published posts may appear after a short delay.

## Supabase setup

### Posts table + RLS
Run in the Supabase SQL editor:
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

### Storage (images)
Create a bucket named `blog-images` with public read, and allow authenticated uploads:
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

## Security notes
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is a publishable key, but your **Supabase service role key must never be committed or used in the client**.
- Keep RLS enabled; the public app relies on it to read only `published` posts.
- Treat the admin app as private (deploy behind access controls).
