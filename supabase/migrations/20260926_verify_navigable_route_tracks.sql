-- A catalog record is visible only after its complete, downloadable line has
-- been saved. Records without a GPS line remain internal for future recovery.
create table if not exists public.hiking_route_tracks (
  route_id text primary key references public.hiking_routes(id) on delete cascade,
  status text not null check (status in ('checking','ready','missing')),
  segments jsonb,
  checked_at timestamptz not null default now(),
  check (status <> 'ready' or (jsonb_typeof(segments) = 'array' and jsonb_array_length(segments) > 0))
);
alter table public.hiking_route_tracks enable row level security;
revoke all on public.hiking_route_tracks from public, anon, authenticated;
grant select, insert, update, delete on public.hiking_route_tracks to service_role;

alter table public.hiking_routes alter column trace_available set default false;

-- The old OSM marker was set before any geometry was fetched.
update public.hiking_routes set trace_available = false, published = false
where source = 'openstreetmap';

-- Restore official tracks already held in the database; 2 distinct coordinate
-- pairs are the minimum for an actual line. Untraced records stay hidden.
update public.hiking_routes h set
  trace_available = exists (
    select 1 from jsonb_array_elements(case when jsonb_typeof(h.raw_tags->'trace_points')='array' then h.raw_tags->'trace_points' else '[]'::jsonb end) p
    where jsonb_typeof(p.value)='array' and jsonb_array_length(p.value)>=2
    having count(distinct p.value)>=2
  ),
  published = exists (
    select 1 from jsonb_array_elements(case when jsonb_typeof(h.raw_tags->'trace_points')='array' then h.raw_tags->'trace_points' else '[]'::jsonb end) p
    where jsonb_typeof(p.value)='array' and jsonb_array_length(p.value)>=2
    having count(distinct p.value)>=2
  )
where h.source <> 'openstreetmap';

-- Eight federation routes have independently mapped OSM relations. They go
-- through the same geometry verifier; routes with no line stay hidden.
with fallbacks(id,relation_id) as (values
  ('fedamon-pr-a-77',12010082),('fedamon-pr-a-151',12088516),
  ('fedamon-pr-a-178',12008794),('fedamon-pr-a-226',6345906),
  ('fedamon-pr-a-241',12049904),('fedamon-pr-a-308',13088384),
  ('fedamon-pr-a-394',12018722),('fedamon-pr-a-447',15530482)
)
update public.hiking_routes h set raw_tags=jsonb_set(h.raw_tags,'{osm_relation_id}',to_jsonb(f.relation_id))
from fallbacks f where h.id=f.id and not h.trace_available;

-- Official routes are searchable by province as well as near the user's GPS.
insert into public.hiking_route_regions(route_id,region_code,published,last_seen_at)
select h.id,r.code,true,now() from public.hiking_routes h
join public.route_import_regions r on lower(r.province)=lower(h.province)
where h.source <> 'openstreetmap' and h.trace_available
on conflict (route_id,region_code) do update set published=true,last_seen_at=excluded.last_seen_at;

create or replace function public.keep_unverified_routes_hidden()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if new.source='openstreetmap' then
    if tg_op='UPDATE' then
      if old.trace_available and exists(
        select 1 from public.hiking_route_tracks t where t.route_id=old.id and t.status='ready'
      ) then
        new.trace_available:=true;
        new.published:=old.published;
      else
        new.trace_available:=false;
        new.published:=false;
      end if;
    else
      new.trace_available:=false;
      new.published:=false;
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists keep_unverified_routes_hidden on public.hiking_routes;
create trigger keep_unverified_routes_hidden before insert or update of source,external_id,raw_tags on public.hiking_routes
for each row execute function public.keep_unverified_routes_hidden();
revoke all on function public.keep_unverified_routes_hidden() from public,anon,authenticated;

create or replace function public.claim_route_geometry_batch(p_limit integer default 12)
returns table(route_id text,relation_id bigint)
language sql security definer set search_path='' as $$
  with candidates as (
    select h.id,case when h.source='openstreetmap' then h.external_id else (h.raw_tags->>'osm_relation_id')::bigint end as external_id from public.hiking_routes h
    left join public.hiking_route_tracks t on t.route_id=h.id
    where (h.source='openstreetmap' or h.raw_tags ? 'osm_relation_id')
      and (h.external_id is not null or h.raw_tags ? 'osm_relation_id')
      and (h.source<>'openstreetmap' or exists(select 1 from public.hiking_route_regions m where m.route_id=h.id and m.published))
      and (t.route_id is null
        or (t.status='checking' and t.checked_at<now()-interval '10 minutes')
        or (t.status='missing' and t.checked_at<now()-interval '28 days'))
    order by h.id limit greatest(1,least(p_limit,12)) for update of h skip locked
  ), claimed as (
    insert into public.hiking_route_tracks as t(route_id,status,segments,checked_at)
    select c.id,'checking',null,now() from candidates c
    on conflict (route_id) do update set status='checking',segments=null,checked_at=now()
    where (t.status='checking' and t.checked_at<now()-interval '10 minutes')
       or (t.status='missing' and t.checked_at<now()-interval '28 days')
    returning route_id
  )
  select c.id,c.external_id from candidates c join claimed on claimed.route_id=c.id;
$$;
revoke all on function public.claim_route_geometry_batch(integer) from public,anon,authenticated;
grant execute on function public.claim_route_geometry_batch(integer) to service_role;

create or replace function public.finish_route_geometry_check(p_route_id text,p_segments jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare v_ready boolean;
begin
  perform 1 from public.hiking_route_tracks where route_id=p_route_id and status='checking' for update;
  if not found then raise exception 'Unclaimed route geometry'; end if;
  v_ready:=jsonb_typeof(p_segments)='array' and jsonb_array_length(p_segments)>0;
  update public.hiking_route_tracks set status=case when v_ready then 'ready' else 'missing' end,
    segments=case when v_ready then p_segments else null end,checked_at=now() where route_id=p_route_id;
  update public.hiking_routes h set trace_available=v_ready,
    published=v_ready and (h.source<>'openstreetmap' or exists(select 1 from public.hiking_route_regions m where m.route_id=h.id and m.published))
  where h.id=p_route_id;
  if v_ready then
    insert into public.hiking_route_regions(route_id,region_code,published,last_seen_at)
    select h.id,r.code,true,now() from public.hiking_routes h
    join public.route_import_regions r on lower(r.province)=lower(h.province)
    where h.id=p_route_id and h.source<>'openstreetmap'
    on conflict (route_id,region_code) do update set published=true,last_seen_at=excluded.last_seen_at;
  end if;
end; $$;
revoke all on function public.finish_route_geometry_check(text,jsonb) from public,anon,authenticated;
grant execute on function public.finish_route_geometry_check(text,jsonb) to service_role;

-- Import refreshes must not undo verification or remove official routes.
create or replace function public.complete_route_import_region(
  p_region_code text,p_run_id bigint,p_started_at timestamptz,
  p_source_count integer,p_upserted_count integer
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_count integer; v_incomplete integer; v_previous_count integer;
begin
  select coalesce((select rr.upserted_count from public.route_import_runs rr
    where rr.region_code=p_region_code and rr.status='completed'
    order by rr.completed_at desc limit 1),r.route_count) into v_previous_count
  from public.route_import_regions r where r.code=p_region_code for update;
  if v_previous_count>0 and
    (p_upserted_count=0 or (v_previous_count>=10 and p_upserted_count<v_previous_count/2.0)) then
    raise exception 'Importación anómala: % rutas frente a % anteriores en %',
      p_upserted_count,v_previous_count,p_region_code;
  end if;
  update public.hiking_route_regions m set published=false
  where m.region_code=p_region_code and m.last_seen_at<p_started_at
    and exists(select 1 from public.hiking_routes h where h.id=m.route_id and h.source='openstreetmap');
  update public.hiking_routes h set published=h.trace_available and exists(
    select 1 from public.hiking_route_regions m where m.route_id=h.id and m.published
  ) where h.source='openstreetmap' and (h.region_code=p_region_code
     or exists(select 1 from public.hiking_route_regions m where m.route_id=h.id and m.region_code=p_region_code));
  select count(*),count(*) filter(where cardinality(h.incomplete_fields)>0)
    into v_count,v_incomplete from public.hiking_route_regions m
    join public.hiking_routes h on h.id=m.route_id
    where m.region_code=p_region_code and m.published and h.published;
  update public.route_import_regions set status='ready',route_count=v_count,
    incomplete_count=v_incomplete,last_completed_at=now(),last_error=null where code=p_region_code;
  update public.route_import_runs set status='completed',source_count=p_source_count,
    upserted_count=p_upserted_count,incomplete_count=v_incomplete,completed_at=now() where id=p_run_id;
  return jsonb_build_object('route_count',v_count,'incomplete_count',v_incomplete);
end; $$;
revoke all on function public.complete_route_import_region(text,bigint,timestamptz,integer,integer) from public,anon,authenticated;
grant execute on function public.complete_route_import_region(text,bigint,timestamptz,integer,integer) to service_role;

do $$ begin
  -- The staging database has no production import job or production URL.
  if exists(select 1 from cron.job where jobname='encumbrate-national-route-import') then
    perform cron.schedule('encumbrate-route-geometry-verification','* * * * *',$job$
      select net.http_post(
        url:='https://www.encumbrate.es/api/admin/routes/verify-tracks',
        headers:=jsonb_build_object('Content-Type','application/json',
          'x-encumbrate-import-key',(select import_key from public.route_import_control where id=true)),
        body:='{}'::jsonb,timeout_milliseconds:=180000
      ) where exists(select 1 from public.hiking_routes h
        left join public.hiking_route_tracks t on t.route_id=h.id
        where (h.source='openstreetmap' or h.raw_tags ? 'osm_relation_id')
          and (t.route_id is null or (t.status='checking' and t.checked_at<now()-interval '10 minutes')));
    $job$);
  end if;
end $$;
