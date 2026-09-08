-- Base table required before the historical pet_files index migration.
-- This migration is intentionally schema-only: it copies no production data.
create table if not exists public.pet_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('photo','document')),
  storage_path text not null unique,
  original_name text not null check (char_length(original_name) between 1 and 255),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','application/pdf')),
  file_size bigint not null check (file_size > 0 and file_size <= 15728640),
  created_at timestamptz not null default now()
);

alter table public.pet_files enable row level security;
revoke all on public.pet_files from public, anon, authenticated;
grant select, insert, delete on public.pet_files to authenticated;

create policy "users read own pet files" on public.pet_files
for select to authenticated using ((select auth.uid()) = user_id);

create policy "users add own pet files" on public.pet_files
for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "users delete own pet files" on public.pet_files
for delete to authenticated using ((select auth.uid()) = user_id);
