# MeetTilavat.com — Split Public/Admin Blog & Portfolio

Read‑only public site (blog, projects, resume) plus a private admin/editor, both running on Next.js and sharing a single Supabase backend.

## Apps
- `apps/public` — read-only portfolio/blog/resume (no auth, fetches published posts).
- `apps/admin` — private admin/editor/dashboard with Supabase auth and uploads.

## Commands
```bash
npm install

# Public (read-only) app
npm run dev:public      # dev server for apps/public
npm run build:public
npm run start:public

# Admin app
npm run dev             # starts apps/admin
npm run build
npm run start
```

## Env (shared Supabase)
Create `.env.local` in the repo root with:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
Both apps share the same anon key; only the admin app exposes auth routes.

## Supabase schema (posts)
Run in SQL editor:
```sql
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
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

### Storage
Create a bucket named `blog-images` with public read, and grant authenticated users insert/update/delete:
```sql
insert into storage.buckets (id, name, public) values ('blog-images', 'blog-images', true) on conflict do nothing;

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

## Notes
- Public app is read-only (no auth UI/routes). Admin app remains gated via Supabase auth.
- Both apps pull from the same `blog-images` bucket; public images load via anon access.

## Local dev (both apps)
- Public: `npm run dev:public`
- Admin: `npm run dev`
Run them in separate terminals; each serves on its own port.

## CI/CD & Deployment
This repo includes a root `Dockerfile` and `Jenkinsfile` to build and deploy the public/admin apps as separate containers. Detailed AWS/CloudFront deployment notes are kept privately and are intentionally not part of the public GitHub repository.
