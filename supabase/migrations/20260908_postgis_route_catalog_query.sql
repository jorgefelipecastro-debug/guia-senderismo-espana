alter table public.hiking_routes
  add column if not exists location extensions.geography(Point,4326);

update public.hiking_routes
set location=extensions.st_setsrid(extensions.st_makepoint(longitude,latitude),4326)::extensions.geography
where location is null;

create or replace function public.sync_hiking_route_location()
returns trigger
language plpgsql
security invoker
set search_path=''
as $$
begin
  new.location:=extensions.st_setsrid(extensions.st_makepoint(new.longitude,new.latitude),4326)::extensions.geography;
  return new;
end
$$;

drop trigger if exists sync_hiking_route_location on public.hiking_routes;
create trigger sync_hiking_route_location
before insert or update of latitude,longitude on public.hiking_routes
for each row execute function public.sync_hiking_route_location();

alter table public.hiking_routes alter column location set not null;

create index if not exists hiking_routes_location_gist_idx
  on public.hiking_routes using gist(location)
  where published
    and distance_km is not null
    and ascent_m is not null
    and max_altitude_m is not null
    and min_altitude_m is not null
    and duration_minutes is not null;

create or replace function public.search_hiking_routes_postgis(
  p_lat double precision,
  p_lon double precision,
  p_radius_m integer default 20000,
  p_region_code text default null,
  p_offset integer default 0,
  p_limit integer default 50
)
returns table(route jsonb,distance_m double precision,total_count bigint)
language plpgsql
stable
security invoker
set search_path=''
as $$
declare
  v_origin extensions.geography:=extensions.st_setsrid(extensions.st_makepoint(p_lon,p_lat),4326)::extensions.geography;
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
    where h.published
      and h.distance_km is not null and h.ascent_m is not null
      and h.max_altitude_m is not null and h.min_altitude_m is not null
      and h.duration_minutes is not null
      and extensions.st_dwithin(h.location,v_origin,p_radius_m);

    return query
    select to_jsonb(h)-'raw_tags'-'location',extensions.st_distance(h.location,v_origin),v_total
    from public.hiking_routes h
    where h.published
      and h.distance_km is not null and h.ascent_m is not null
      and h.max_altitude_m is not null and h.min_altitude_m is not null
      and h.duration_minutes is not null
      and extensions.st_dwithin(h.location,v_origin,p_radius_m)
    order by h.location operator(extensions.<->) v_origin,h.normalized_name,h.id
    offset p_offset limit p_limit;
  else
    select count(*) into v_total
    from public.hiking_route_regions rr
    join public.hiking_routes h on h.id=rr.route_id
    where rr.region_code=p_region_code and rr.published and h.published
      and h.distance_km is not null and h.ascent_m is not null
      and h.max_altitude_m is not null and h.min_altitude_m is not null
      and h.duration_minutes is not null;

    return query
    select to_jsonb(h)-'raw_tags'-'location',extensions.st_distance(h.location,v_origin),v_total
    from public.hiking_route_regions rr
    join public.hiking_routes h on h.id=rr.route_id
    where rr.region_code=p_region_code and rr.published and h.published
      and h.distance_km is not null and h.ascent_m is not null
      and h.max_altitude_m is not null and h.min_altitude_m is not null
      and h.duration_minutes is not null
    order by h.location operator(extensions.<->) v_origin,h.normalized_name,h.id
    offset p_offset limit p_limit;
  end if;
end
$$;

revoke all on function public.sync_hiking_route_location() from public,anon,authenticated;
revoke all on function public.search_hiking_routes_postgis(double precision,double precision,integer,text,integer,integer) from public,anon,authenticated;
grant execute on function public.search_hiking_routes_postgis(double precision,double precision,integer,text,integer,integer) to service_role;
