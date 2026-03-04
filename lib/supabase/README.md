# Supabase Boundary Governance

This package owns Supabase bootstrap, request-context adapters, and boundary error contracts.

## Canonical Modules
- `bootstrap/env.ts`: canonical environment loading (`loadSupabaseEnv`) and `SupabaseBootstrapError`
- `contracts/request-boundary.ts`: shared boundary contracts for env and cookie-store interfaces consumed by production + tests
- `clients/server-client-factory.ts`: runtime-agnostic request-client construction and cookie-policy handling
- `clients/next-request-client.ts`: Next.js request-context adapter (`cookies()` integration)
- `clients/public-client.ts`: stateless/public client construction
- `errors/error-mapping.ts`: shared boundary failure classification to `DataResult`/HTTP/action messages

## Boundary Rules
- Environment bootstrap ownership stays in `env.ts`; sibling modules must not duplicate `process.env` reads for Supabase URL/key.
- Next runtime wiring belongs only in `next-request-client.ts`; shared factory modules must remain framework-agnostic.
- Do not add top-level shim re-exports under `lib/supabase/*` for request-client modules; callers must import from `clients/*` directly.
- Request cookie behavior must be expressed through explicit policy options, not boolean flag overloads.
- Result-based error contracts are preferred for infrastructure boundaries; throw-based paths must be explicit (`*OrThrow`).
- When dual surfaces exist, canonical layering is `*Result` (DataResult) plus optional `*OrThrow` adapters; avoid unlabelled mixed-style helpers.

## Contract Test Matrix
| Contract Surface | Required Cases | Test Suite |
| --- | --- | --- |
| Supabase env bootstrap contract | Missing URL, missing anon key, and stable bootstrap error shape invariants | `lib/supabase/bootstrap/env.contract.test.ts` |
| Supabase bootstrap/auth path | Missing env classification, strict cookie-context enforcement, explicit optional-mode fallback, cookie access failure classification | `lib/supabase/clients/next-request-client.test.ts` + `lib/supabase/clients/server-client-factory.contract.test.ts` |
| Next adapter contract matrix | Access-mode mapping, cookie-context mapping, cookie-provider failure and missing-context branches | `lib/supabase/clients/next-request-client.contract.test.ts` |
| Request-client compatibility guard | Canonical `clients/next-request-client.ts` entrypoint remains active with no legacy shim path reintroduced | `lib/supabase/compatibility.contract.test.ts` |
| Shared boundary error mapping | Bootstrap/auth failures map to stable `DataResult`/HTTP/action contracts | `lib/supabase/error-mapping.test.ts` + `lib/auth/current-user-error.test.ts` |

## Required Validation
- `lib/supabase/client.test.ts`
- `lib/supabase/bootstrap/env.contract.test.ts`
- `lib/supabase/contracts/request-boundary.test.ts`
- `lib/supabase/clients/server-client-factory.test.ts`
- `lib/supabase/clients/server-client-factory.contract.test.ts`
- `lib/supabase/clients/next-request-client.test.ts`
- `lib/supabase/clients/next-request-client.contract.test.ts`
- `lib/supabase/clients/public-client.test.ts`
- `lib/supabase/compatibility.contract.test.ts`
- `lib/supabase/error-mapping.test.ts`
- `lib/auth/current-user.test.ts`
- `lib/auth/current-user-error.test.ts`
- `npm run test:governance`

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
