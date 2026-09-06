create table if not exists public.moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  media_type text not null check (media_type in ('photo','video')),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime','video/3gpp')),
  file_size bigint not null check (file_size > 0 and file_size <= 104857600),
  route_activity_id uuid references public.route_activities(id) on delete set null,
  route_name text check (route_name is null or char_length(route_name) between 1 and 180),
  caption text not null default '' check (char_length(caption) <= 280),
  favorite boolean not null default false,
  visibility text not null default 'private' check (visibility in ('private','community')),
  captured_at timestamptz not null default now(),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  check ((media_type = 'photo' and file_size <= 15728640) or media_type = 'video'),
  check ((visibility = 'community' and published_at is not null) or visibility = 'private')
);
create index if not exists moments_user_album_idx on public.moments(user_id,route_name,captured_at desc);
create index if not exists moments_community_feed_idx on public.moments(published_at desc) where visibility = 'community';
alter table public.moments enable row level security;
revoke all on public.moments from anon, authenticated;
grant select, insert, update, delete on public.moments to authenticated;
drop policy if exists "moments_read_own_or_community" on public.moments;
create policy "moments_read_own_or_community" on public.moments for select to authenticated using ((select auth.uid()) = user_id or visibility = 'community');
drop policy if exists "moments_insert_own" on public.moments;
create policy "moments_insert_own" on public.moments for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "moments_update_own" on public.moments;
create policy "moments_update_own" on public.moments for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "moments_delete_own" on public.moments;
create policy "moments_delete_own" on public.moments for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('moments','moments',false,104857600,array['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime','video/3gpp']) on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "moments_storage_read" on storage.objects;
create policy "moments_storage_read" on storage.objects for select to authenticated using (bucket_id='moments' and ((storage.foldername(name))[1]=(select auth.uid()::text) or exists(select 1 from public.moments m where m.storage_path=name and m.visibility='community')));
drop policy if exists "moments_storage_insert" on storage.objects;
create policy "moments_storage_insert" on storage.objects for insert to authenticated with check (bucket_id='moments' and (storage.foldername(name))[1]=(select auth.uid()::text));
drop policy if exists "moments_storage_delete" on storage.objects;
create policy "moments_storage_delete" on storage.objects for delete to authenticated using (bucket_id='moments' and (storage.foldername(name))[1]=(select auth.uid()::text));
