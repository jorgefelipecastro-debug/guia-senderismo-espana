-- Espacio privado para documentación y fotografías de mascotas.
create schema if not exists private;

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

create index if not exists pet_files_user_created_idx on public.pet_files(user_id,created_at desc);

alter table public.pet_files enable row level security;
grant select, insert, delete on public.pet_files to authenticated;
revoke update on public.pet_files from authenticated;

drop policy if exists "users read own pet files" on public.pet_files;
create policy "users read own pet files" on public.pet_files
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "users add own pet files" on public.pet_files;
create policy "users add own pet files" on public.pet_files
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "users delete own pet files" on public.pet_files;
create policy "users delete own pet files" on public.pet_files
for delete to authenticated
using ((select auth.uid()) = user_id);

create or replace function private.enforce_pet_photo_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.kind = 'photo' and (
    select count(*) from public.pet_files
    where user_id = new.user_id and kind = 'photo'
  ) >= 5 then
    raise exception 'maximum of five pet photos';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_pet_photo_limit() from public, anon, authenticated;
drop trigger if exists pet_photo_limit on public.pet_files;
create trigger pet_photo_limit
before insert on public.pet_files
for each row execute function private.enforce_pet_photo_limit();

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('pet-files','pet-files',false,15728640,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "pet_files_select_own" on storage.objects;
create policy "pet_files_select_own" on storage.objects
for select to authenticated
using (
  bucket_id = 'pet-files'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "pet_files_insert_own" on storage.objects;
create policy "pet_files_insert_own" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'pet-files'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "pet_files_delete_own" on storage.objects;
create policy "pet_files_delete_own" on storage.objects
for delete to authenticated
using (
  bucket_id = 'pet-files'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
