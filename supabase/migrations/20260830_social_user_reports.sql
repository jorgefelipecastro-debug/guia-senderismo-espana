create table if not exists public.social_user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  reporter_name text not null check(char_length(reporter_name) between 2 and 80),
  reporter_email text not null,
  reported_alias text not null,
  category text not null check(category in ('harassment','racism','xenophobia','threats','sexual','impersonation','spam','other')),
  description text not null check(char_length(description) between 20 and 1400),
  evidence_paths text[] not null default '{}',
  status text not null default 'pending' check(status in ('pending','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  check(reporter_id<>reported_user_id)
);
create index if not exists social_user_reports_reporter_idx on public.social_user_reports(reporter_id,created_at desc);
create index if not exists social_user_reports_pending_idx on public.social_user_reports(created_at) where status='pending';

alter table public.social_user_reports enable row level security;
revoke all on public.social_user_reports from anon,authenticated;
grant select on public.social_user_reports to authenticated;
create policy "reporters see own reports" on public.social_user_reports
for select to authenticated using(reporter_id=(select auth.uid()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('social-report-evidence','social-report-evidence',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

create policy "reporters upload private evidence" on storage.objects
for insert to authenticated with check(
  bucket_id='social-report-evidence'
  and (storage.foldername(name))[1]=(select auth.uid())::text
);

create or replace function public.submit_social_report(
  p_reported_user uuid,p_reporter_name text,p_reporter_email text,p_category text,p_description text
) returns uuid language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare
  mine uuid:=auth.uid();
  auth_email text;
  target_alias text;
  report_id uuid;
begin
  if mine is null then raise exception 'authentication_required'; end if;
  if mine=p_reported_user then raise exception 'self_report_forbidden'; end if;
  if exists(select 1 from public.social_suspensions where user_id=mine) then raise exception 'account_suspended'; end if;
  select email into auth_email from auth.users where id=mine;
  if lower(trim(coalesce(p_reporter_email,'')))<>lower(auth_email) then raise exception 'email_mismatch'; end if;
  select alias into target_alias from public.social_aliases where user_id=p_reported_user;
  if target_alias is null then raise exception 'reported_user_not_found'; end if;
  if trim(coalesce(p_reporter_name,''))='' or char_length(trim(p_reporter_name)) not between 2 and 80 then raise exception 'invalid_name'; end if;
  if p_category not in ('harassment','racism','xenophobia','threats','sexual','impersonation','spam','other') then raise exception 'invalid_category'; end if;
  if char_length(trim(coalesce(p_description,''))) not between 20 and 1400 then raise exception 'invalid_description'; end if;
  if array_length(regexp_split_to_array(trim(p_description),'\s+'),1)>200 then raise exception 'description_too_long'; end if;
  if exists(select 1 from public.social_user_reports where reporter_id=mine and reported_user_id=p_reported_user and created_at>now()-interval '1 hour') then raise exception 'duplicate_report'; end if;
  insert into public.social_user_reports(reporter_id,reported_user_id,reporter_name,reporter_email,reported_alias,category,description)
  values(mine,p_reported_user,trim(p_reporter_name),auth_email,target_alias,p_category,trim(p_description))
  returning id into report_id;
  return report_id;
end $$;

create or replace function public.attach_social_report_evidence(p_report_id uuid,p_paths text[])
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare mine uuid:=auth.uid(); item text;
begin
  if mine is null then raise exception 'authentication_required'; end if;
  if coalesce(array_length(p_paths,1),0)>5 then raise exception 'too_many_files'; end if;
  if not exists(select 1 from public.social_user_reports where id=p_report_id and reporter_id=mine) then raise exception 'report_not_found'; end if;
  foreach item in array coalesce(p_paths,'{}') loop
    if item not like mine::text||'/'||p_report_id::text||'/%' then raise exception 'invalid_evidence_path'; end if;
  end loop;
  update public.social_user_reports set evidence_paths=p_paths where id=p_report_id and reporter_id=mine;
end $$;

revoke all on function public.submit_social_report(uuid,text,text,text,text) from public,anon;
revoke all on function public.attach_social_report_evidence(uuid,text[]) from public,anon;
grant execute on function public.submit_social_report(uuid,text,text,text,text) to authenticated;
grant execute on function public.attach_social_report_evidence(uuid,text[]) to authenticated;
