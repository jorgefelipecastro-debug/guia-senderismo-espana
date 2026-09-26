-- A downloadable line must be continuous before it is shown in the catalog.
-- Existing OSM relation pieces are retained for a fast local recheck.
alter table public.hiking_route_tracks
  add column if not exists continuity_checked boolean not null default false;

update public.hiking_route_tracks set continuity_checked=false where status='ready';
update public.hiking_routes h set trace_available=false,published=false
from public.hiking_route_tracks t where t.route_id=h.id and t.status='ready';

create or replace function public.reconcile_ready_route_geometry(p_route_id text,p_segments jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare v_ready boolean;
begin
  perform 1 from public.hiking_route_tracks
  where route_id=p_route_id and status='ready' and not continuity_checked for update;
  if not found then return; end if;
  v_ready:=coalesce(jsonb_typeof(p_segments)='array' and jsonb_array_length(p_segments)=1
    and jsonb_typeof(p_segments->0)='array' and jsonb_array_length(p_segments->0)>1,false);
  update public.hiking_route_tracks set status=case when v_ready then 'ready' else 'missing' end,
    segments=case when v_ready then p_segments else null end,
    continuity_checked=true,checked_at=now() where route_id=p_route_id;
  update public.hiking_routes h set trace_available=v_ready,
    published=v_ready and (h.source<>'openstreetmap' or exists(
      select 1 from public.hiking_route_regions m where m.route_id=h.id and m.published))
  where h.id=p_route_id;
end; $$;
revoke all on function public.reconcile_ready_route_geometry(text,jsonb) from public,anon,authenticated;
grant execute on function public.reconcile_ready_route_geometry(text,jsonb) to service_role;

create or replace function public.finish_route_geometry_check(p_route_id text,p_segments jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare v_ready boolean;
begin
  perform 1 from public.hiking_route_tracks where route_id=p_route_id and status='checking' for update;
  if not found then raise exception 'Unclaimed route geometry'; end if;
  -- One ordered line is the contract established by navigableSegments().
  v_ready:=coalesce(jsonb_typeof(p_segments)='array' and jsonb_array_length(p_segments)=1
    and jsonb_typeof(p_segments->0)='array' and jsonb_array_length(p_segments->0)>1,false);
  update public.hiking_route_tracks set status=case when v_ready then 'ready' else 'missing' end,
    segments=case when v_ready then p_segments else null end,
    continuity_checked=true,checked_at=now() where route_id=p_route_id;
  update public.hiking_routes h set trace_available=v_ready,
    published=v_ready and (h.source<>'openstreetmap' or exists(
      select 1 from public.hiking_route_regions m where m.route_id=h.id and m.published))
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
