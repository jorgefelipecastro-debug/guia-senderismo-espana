create table if not exists public.route_meetups (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references auth.users(id) on delete cascade,
  organizer_name text not null check (char_length(organizer_name) between 2 and 60),
  external_route_key text not null,
  route_name text not null check (char_length(route_name) between 2 and 240),
  province text,
  municipality text,
  starts_at timestamptz not null,
  meeting_point_name text not null check (char_length(meeting_point_name) between 3 and 160),
  capacity smallint not null default 8 check (capacity between 2 and 30),
  participant_count smallint not null default 1 check (participant_count between 0 and 30),
  pace text not null default 'normal' check (pace in ('tranquilo','normal','rapido')),
  required_level text not null default 'principiante' check (required_level in ('principiante','intermedio','experto')),
  description text check (description is null or char_length(description) <= 1000),
  status text not null default 'scheduled' check (status in ('scheduled','cancelled','completed')),
  adults_only boolean not null default true check (adults_only),
  safety_acknowledged boolean not null check (safety_acknowledged),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at > created_at)
);

create table if not exists public.route_meetup_members (
  meetup_id uuid not null references public.route_meetups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_name text not null check (char_length(member_name) between 2 and 60),
  role text not null default 'member' check (role in ('organizer','member')),
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (meetup_id,user_id)
);

create index if not exists route_meetups_upcoming_idx on public.route_meetups(status,starts_at);
create index if not exists route_meetups_organizer_idx on public.route_meetups(organizer_id,starts_at desc);
create index if not exists route_meetup_members_user_idx on public.route_meetup_members(user_id,status);

alter table public.route_meetups enable row level security;
alter table public.route_meetup_members enable row level security;

revoke all on public.route_meetups from anon;
revoke all on public.route_meetup_members from anon;
grant select,insert,update on public.route_meetups to authenticated;
grant select on public.route_meetup_members to authenticated;

create policy "authenticated users view meetups" on public.route_meetups
for select to authenticated using (true);
create policy "users create their meetups" on public.route_meetups
for insert to authenticated with check (organizer_id = (select auth.uid()));
create policy "organizers update their meetups" on public.route_meetups
for update to authenticated using (organizer_id = (select auth.uid()))
with check (organizer_id = (select auth.uid()));
create policy "members see own requests" on public.route_meetup_members
for select to authenticated using (
  user_id = (select auth.uid()) or exists (
    select 1 from public.route_meetups m where m.id=meetup_id and m.organizer_id=(select auth.uid())
  )
);

create or replace function public.meetup_after_create() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  insert into public.route_meetup_members(meetup_id,user_id,member_name,role,status)
  values(new.id,new.organizer_id,new.organizer_name,'organizer','approved');
  return new;
end $$;
drop trigger if exists route_meetup_after_create on public.route_meetups;
create trigger route_meetup_after_create after insert on public.route_meetups
for each row execute function public.meetup_after_create();

create or replace function public.request_meetup_place(p_meetup_id uuid,p_member_name text)
returns void language plpgsql security definer set search_path=public as $$
declare m public.route_meetups;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select * into m from public.route_meetups where id=p_meetup_id for update;
  if m.id is null or m.status<>'scheduled' or m.starts_at<=now() then raise exception 'meetup unavailable'; end if;
  if m.organizer_id=auth.uid() then return; end if;
  if m.participant_count>=m.capacity then raise exception 'meetup full'; end if;
  insert into public.route_meetup_members(meetup_id,user_id,member_name,role,status)
  values(p_meetup_id,auth.uid(),left(trim(p_member_name),60),'member','pending')
  on conflict(meetup_id,user_id) do update set status='pending',member_name=excluded.member_name,updated_at=now();
end $$;

create or replace function public.review_meetup_request(p_meetup_id uuid,p_user_id uuid,p_status text)
returns void language plpgsql security definer set search_path=public as $$
declare m public.route_meetups; old_status text;
begin
  if p_status not in ('approved','rejected') then raise exception 'invalid status'; end if;
  select * into m from public.route_meetups where id=p_meetup_id and organizer_id=auth.uid() for update;
  if m.id is null then raise exception 'not organizer'; end if;
  select status into old_status from public.route_meetup_members where meetup_id=p_meetup_id and user_id=p_user_id and role='member' for update;
  if old_status is null then raise exception 'request not found'; end if;
  if p_status='approved' and old_status<>'approved' and m.participant_count>=m.capacity then raise exception 'meetup full'; end if;
  update public.route_meetup_members set status=p_status,updated_at=now() where meetup_id=p_meetup_id and user_id=p_user_id;
  update public.route_meetups set participant_count=participant_count + case when old_status<>'approved' and p_status='approved' then 1 when old_status='approved' and p_status<>'approved' then -1 else 0 end,updated_at=now() where id=p_meetup_id;
end $$;

create or replace function public.cancel_my_meetup_request(p_meetup_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare old_status text;
begin
  select status into old_status from public.route_meetup_members where meetup_id=p_meetup_id and user_id=auth.uid() and role='member' for update;
  if old_status is null then return; end if;
  update public.route_meetup_members set status='cancelled',updated_at=now() where meetup_id=p_meetup_id and user_id=auth.uid();
  if old_status='approved' then update public.route_meetups set participant_count=greatest(1,participant_count-1),updated_at=now() where id=p_meetup_id; end if;
end $$;

revoke all on function public.request_meetup_place(uuid,text) from public,anon;
revoke all on function public.review_meetup_request(uuid,uuid,text) from public,anon;
revoke all on function public.cancel_my_meetup_request(uuid) from public,anon;
grant execute on function public.request_meetup_place(uuid,text) to authenticated;
grant execute on function public.review_meetup_request(uuid,uuid,text) to authenticated;
grant execute on function public.cancel_my_meetup_request(uuid) to authenticated;

