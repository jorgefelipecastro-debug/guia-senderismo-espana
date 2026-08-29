create table if not exists public.user_route_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contributor_name text not null check (char_length(contributor_name) between 2 and 60),
  name text not null check (char_length(name) between 3 and 180),
  description text not null check (char_length(description) between 40 and 2000),
  province text not null check (char_length(province) between 2 and 80),
  municipality text not null check (char_length(municipality) between 2 and 120),
  route_type text not null check (route_type in ('circular','ida_vuelta','lineal')),
  proposed_difficulty text not null check (proposed_difficulty in ('principiante','intermedio','experto')),
  signage text not null check (signage in ('senalizada','parcial','sin_senalizar','desconocida')),
  risks text not null check (char_length(risks) between 10 and 1200),
  gpx_path text not null,
  gpx_sha256 text not null unique check (char_length(gpx_sha256)=64),
  point_count integer not null check (point_count between 20 and 200000),
  distance_km numeric not null check (distance_km between 0.5 and 1000),
  ascent_m integer not null check (ascent_m between 0 and 30000),
  descent_m integer not null check (descent_m between 0 and 30000),
  min_altitude_m integer,
  max_altitude_m integer,
  start_lat numeric not null check (start_lat between -90 and 90),
  start_lon numeric not null check (start_lon between -180 and 180),
  end_lat numeric not null check (end_lat between -90 and 90),
  end_lon numeric not null check (end_lon between -180 and 180),
  source_declaration boolean not null check (source_declaration),
  safety_declaration boolean not null check (safety_declaration),
  status text not null default 'pending' check (status in ('pending','needs_changes','approved','rejected','duplicate','withdrawn')),
  reviewer_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  published_route_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_route_submissions_user_idx on public.user_route_submissions(user_id,created_at desc);
create index if not exists user_route_submissions_review_idx on public.user_route_submissions(status,created_at);
alter table public.user_route_submissions enable row level security;
revoke all on public.user_route_submissions from anon;
grant select,insert on public.user_route_submissions to authenticated;

create policy "contributors view own submissions" on public.user_route_submissions
for select to authenticated using (user_id=(select auth.uid()));
create policy "contributors submit own routes" on public.user_route_submissions
for insert to authenticated with check (user_id=(select auth.uid()) and status='pending');

alter table public.profiles add column if not exists approved_route_contributions integer not null default 0 check (approved_route_contributions>=0);
alter table public.profiles add column if not exists contributor_xp integer not null default 0 check (contributor_xp>=0);

create table if not exists public.route_contribution_rewards (
  submission_id uuid primary key references public.user_route_submissions(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  xp_awarded integer not null default 250 check (xp_awarded>0),
  awarded_at timestamptz not null default now()
);
alter table public.route_contribution_rewards enable row level security;
revoke all on public.route_contribution_rewards from anon;
grant select on public.route_contribution_rewards to authenticated;
create policy "contributors view own rewards" on public.route_contribution_rewards
for select to authenticated using (user_id=(select auth.uid()));

create or replace function public.award_approved_route_contribution() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if new.status='approved' and old.status is distinct from 'approved' then
    insert into public.route_contribution_rewards(submission_id,user_id,xp_awarded)
    values(new.id,new.user_id,250) on conflict(submission_id) do nothing;
    if found then
      update public.profiles set
        approved_route_contributions=approved_route_contributions+1,
        contributor_xp=contributor_xp+250,
        updated_at=now()
      where id=new.user_id;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists award_approved_route_contribution on public.user_route_submissions;
create trigger award_approved_route_contribution after update of status on public.user_route_submissions
for each row execute function public.award_approved_route_contribution();
revoke all on function public.award_approved_route_contribution() from public,anon,authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('route-submissions','route-submissions',false,10485760,array['application/gpx+xml','application/xml','text/xml','application/octet-stream'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "route_submission_files_insert_own" on storage.objects;
create policy "route_submission_files_insert_own" on storage.objects for insert to authenticated
with check(bucket_id='route-submissions' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "route_submission_files_select_own" on storage.objects;
create policy "route_submission_files_select_own" on storage.objects for select to authenticated
using(bucket_id='route-submissions' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "route_submission_files_delete_own" on storage.objects;
create policy "route_submission_files_delete_own" on storage.objects for delete to authenticated
using(bucket_id='route-submissions' and (storage.foldername(name))[1]=(select auth.uid())::text);
