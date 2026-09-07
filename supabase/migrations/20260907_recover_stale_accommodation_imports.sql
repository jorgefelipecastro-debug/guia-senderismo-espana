-- Recupera regiones cuyo proceso terminó abruptamente antes de actualizar su estado.

create or replace function public.claim_next_accommodation_import_region()
returns table(region_code text,province text,osm_area_id bigint)
set search_path = ''
language plpgsql
security definer
as $$
begin
  return query
  with candidate as (
    select a.region_code
    from public.accommodation_import_regions a
    join public.route_import_regions r on r.code=a.region_code
    where r.osm_area_id is not null
      and (
        a.status in ('pending','error')
        or (a.status='importing' and a.last_started_at < now()-interval '6 minutes')
        or a.last_completed_at < now()-interval '30 days'
      )
    order by
      case a.status when 'pending' then 0 when 'error' then 1 when 'importing' then 2 else 3 end,
      a.last_completed_at nulls first,r.sort_order
    for update of a skip locked
    limit 1
  ), updated as (
    update public.accommodation_import_regions a
    set status='importing',import_attempts=import_attempts+1,last_started_at=now(),last_error=null,updated_at=now()
    from candidate c where a.region_code=c.region_code
    returning a.region_code
  )
  select u.region_code,r.province,r.osm_area_id
  from updated u join public.route_import_regions r on r.code=u.region_code;
end;
$$;

revoke all on function public.claim_next_accommodation_import_region() from public,anon,authenticated;
grant execute on function public.claim_next_accommodation_import_region() to service_role;
