-- A fresh OSM import may omit metrics that were calculated from a verified
-- route geometry. Keep those existing values when the new source has no value.
create or replace function public.preserve_hiking_route_metrics()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if old.source = 'openstreetmap' and new.source = 'openstreetmap' then
    new.distance_km := coalesce(new.distance_km, old.distance_km);
    new.ascent_m := coalesce(new.ascent_m, old.ascent_m);
    new.max_altitude_m := coalesce(new.max_altitude_m, old.max_altitude_m);
    new.min_altitude_m := coalesce(new.min_altitude_m, old.min_altitude_m);
    new.duration_minutes := coalesce(new.duration_minutes, old.duration_minutes);
    if new.image_url is null and old.image_verified then
      new.image_url := old.image_url;
      new.image_source_url := old.image_source_url;
      new.image_credit := old.image_credit;
      new.image_license := old.image_license;
      new.image_verified := old.image_verified;
    end if;
    new.incomplete_fields := array_remove(array[
      case when new.name like 'Ruta pública OSM %' then 'name' end,
      case when new.distance_km is null then 'distance_km' end,
      case when new.ascent_m is null then 'ascent_m' end,
      case when new.max_altitude_m is null then 'max_altitude_m' end,
      case when new.duration_minutes is null then 'duration_minutes' end,
      case when new.image_url is null then 'image_url' end
    ], null);
    new.enrichment_status := case when cardinality(new.incomplete_fields) = 0
      and new.min_altitude_m is not null then 'complete' else 'partial' end;
  end if;
  return new;
end;
$$;

drop trigger if exists preserve_hiking_route_metrics on public.hiking_routes;
create trigger preserve_hiking_route_metrics
before update of distance_km,ascent_m,max_altitude_m,min_altitude_m,duration_minutes
on public.hiking_routes
for each row execute function public.preserve_hiking_route_metrics();

revoke all on function public.preserve_hiking_route_metrics() from public,anon,authenticated;

-- An HTTP client can stop waiting for an import. If the worker also stops,
-- the province must become claimable again without losing its last snapshot.
create or replace function public.claim_next_route_import_region()
returns setof public.route_import_regions
language plpgsql security definer set search_path = '' as $$
declare v_region public.route_import_regions;
begin
  select * into v_region
  from public.route_import_regions
  where status = 'pending'
     or (status = 'error' and last_started_at < now() - interval '20 minutes')
     or (status = 'importing' and last_started_at < now() - interval '30 minutes')
     or (status = 'ready' and last_completed_at < now() - interval '28 days')
  order by case status when 'pending' then 0 when 'importing' then 1 when 'error' then 2 else 3 end,
           last_completed_at nulls first, import_attempts, sort_order
  for update skip locked limit 1;
  if not found then return; end if;

  if v_region.status = 'importing' then
    update public.route_import_runs set status = 'error', completed_at = now(),
      error_message = 'La importación se interrumpió; reintentando automáticamente.'
    where region_code = v_region.code and status = 'running'
      and started_at < now() - interval '30 minutes';
  end if;

  update public.route_import_regions set
    status = 'importing', import_attempts = import_attempts + 1,
    last_started_at = now(), last_error = null
  where code = v_region.code returning * into v_region;
  return next v_region;
end;
$$;

revoke all on function public.claim_next_route_import_region() from public,anon,authenticated;
grant execute on function public.claim_next_route_import_region() to service_role;

-- GiST coverage for published routes whether or not their source has metrics.
create index if not exists hiking_routes_published_location_gist_idx
  on public.hiking_routes using gist(location) where published;

create or replace function public.search_hiking_routes_postgis(
  p_lat double precision,
  p_lon double precision,
  p_radius_m integer default 20000,
  p_region_code text default null,
  p_offset integer default 0,
  p_limit integer default 50
)
returns table(route jsonb, distance_m double precision, total_count bigint)
language plpgsql stable security invoker set search_path = '' as $$
declare
  v_origin extensions.geography := extensions.st_setsrid(extensions.st_makepoint(p_lon,p_lat),4326)::extensions.geography;
  v_total bigint;
begin
  if p_lat not between -90 and 90 or p_lon not between -180 and 180 then
    raise exception 'invalid_coordinates';
  end if;
  if p_radius_m not between 10000 and 50000 or p_offset not between 0 and 100000 or p_limit not between 3 and 200 then
    raise exception 'invalid_pagination';
  end if;

  if p_region_code is null then
    select count(*) into v_total
    from public.hiking_routes h
    where h.published and extensions.st_dwithin(h.location,v_origin,p_radius_m);

    return query
    select to_jsonb(h)-'raw_tags'-'location',extensions.st_distance(h.location,v_origin),v_total
    from public.hiking_routes h
    where h.published and extensions.st_dwithin(h.location,v_origin,p_radius_m)
    order by h.location operator(extensions.<->) v_origin,h.normalized_name,h.id
    offset p_offset limit p_limit;
  else
    select count(*) into v_total
    from public.hiking_route_regions rr
    join public.hiking_routes h on h.id=rr.route_id
    where rr.region_code=p_region_code and rr.published and h.published;

    return query
    select to_jsonb(h)-'raw_tags'-'location',extensions.st_distance(h.location,v_origin),v_total
    from public.hiking_route_regions rr
    join public.hiking_routes h on h.id=rr.route_id
    where rr.region_code=p_region_code and rr.published and h.published
    order by h.location operator(extensions.<->) v_origin,h.normalized_name,h.id
    offset p_offset limit p_limit;
  end if;
end;
$$;

revoke all on function public.search_hiking_routes_postgis(double precision,double precision,integer,text,integer,integer) from public,anon,authenticated;
grant execute on function public.search_hiking_routes_postgis(double precision,double precision,integer,text,integer,integer) to service_role;

-- Leave staging without a production cron; update the already installed job.
do $$
declare v_job_id bigint;
begin
  select jobid into v_job_id from cron.job where jobname = 'encumbrate-national-route-import';
  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
    perform cron.schedule(
      'encumbrate-national-route-import',
      '*/5 * * * *',
      $job$
        select net.http_post(
          url:='https://www.encumbrate.es/api/admin/routes/import',
          headers:=jsonb_build_object(
            'Content-Type','application/json',
            'x-encumbrate-import-key',(select import_key from public.route_import_control where id=true)
          ),
          body:='{}'::jsonb,
          timeout_milliseconds:=180000
        )
        where exists(
          select 1 from public.route_import_regions
          where status='pending'
             or (status='error' and last_started_at<now()-interval '20 minutes')
             or (status='importing' and last_started_at<now()-interval '30 minutes')
             or (status='ready' and last_completed_at<now()-interval '28 days')
        );
      $job$
    );
  end if;
end $$;
