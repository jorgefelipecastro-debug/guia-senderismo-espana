-- The former importer converted null to 0 with Number(null). A missing
-- elevation or climb is unknown, and must never imply an easy route.
alter table public.hiking_routes drop constraint if exists hiking_routes_level_check;
alter table public.hiking_routes add constraint hiking_routes_level_check
  check (level in ('sin_clasificar','principiante','intermedio','experto'));
alter table public.hiking_routes alter column level set default 'sin_clasificar';

drop trigger if exists preserve_hiking_route_metrics on public.hiking_routes;

-- A zero with no corresponding OSM tag was fabricated by the previous
-- normalizer. Keep explicit source measurements, including a genuine zero.
update public.hiking_routes h set
  ascent_m = case when h.ascent_m=0 and not(h.raw_tags ?| array['ascent','ascent:total','ele:gain','incline:up'])
    then null else h.ascent_m end,
  max_altitude_m = case when h.max_altitude_m=0 and not(h.raw_tags ?| array['maxele','ele:max','max_altitude','ele'])
    then null else h.max_altitude_m end,
  min_altitude_m = case when h.min_altitude_m=0 and not(h.raw_tags ?| array['minele','ele:min','min_altitude'])
    then null else h.min_altitude_m end
where h.source='openstreetmap' and (
  (h.ascent_m=0 and not(h.raw_tags ?| array['ascent','ascent:total','ele:gain','incline:up']))
  or (h.max_altitude_m=0 and not(h.raw_tags ?| array['maxele','ele:max','max_altitude','ele']))
  or (h.min_altitude_m=0 and not(h.raw_tags ?| array['minele','ele:min','min_altitude']))
);

update public.hiking_routes h set
  incomplete_fields = array_remove(array[
    case when h.name like 'Ruta pública OSM %' then 'name' end,
    case when h.distance_km is null then 'distance_km' end,
    case when h.ascent_m is null then 'ascent_m' end,
    case when h.max_altitude_m is null then 'max_altitude_m' end,
    case when h.min_altitude_m is null then 'min_altitude_m' end,
    case when h.duration_minutes is null then 'duration_minutes' end,
    case when h.image_url is null then 'image_url' end
  ],null),
  enrichment_status = case when h.name not like 'Ruta pública OSM %'
    and h.distance_km is not null and h.ascent_m is not null
    and h.max_altitude_m is not null and h.min_altitude_m is not null
    and h.duration_minutes is not null and h.image_url is not null
    then 'complete' else 'partial' end,
  level = case
    when h.distance_km is null or h.ascent_m is null then 'sin_clasificar'
    when h.distance_km>=20 or h.ascent_m>=1000 then 'experto'
    when h.distance_km<=10 and h.ascent_m<=400 then 'principiante'
    else 'intermedio' end
where h.source='openstreetmap';

update public.route_import_regions r set incomplete_count=s.incomplete_count
from (
  select rr.region_code,
    count(*) filter (where cardinality(h.incomplete_fields)>0)::integer as incomplete_count
  from public.hiking_route_regions rr
  join public.hiking_routes h on h.id=rr.route_id
  where rr.published and h.published
  group by rr.region_code
) s
where r.code=s.region_code;

-- Keep the same rules on subsequent imports and profile enrichment.
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
      case when new.min_altitude_m is null then 'min_altitude_m' end,
      case when new.duration_minutes is null then 'duration_minutes' end,
      case when new.image_url is null then 'image_url' end
    ], null);
    new.enrichment_status := case when cardinality(new.incomplete_fields)=0 then 'complete' else 'partial' end;
    new.level := case
      when new.distance_km is null or new.ascent_m is null then 'sin_clasificar'
      when new.distance_km>=20 or new.ascent_m>=1000 then 'experto'
      when new.distance_km<=10 and new.ascent_m<=400 then 'principiante'
      else 'intermedio' end;
  end if;
  return new;
end;
$$;

create trigger preserve_hiking_route_metrics
before update of distance_km,ascent_m,max_altitude_m,min_altitude_m,duration_minutes
on public.hiking_routes
for each row execute function public.preserve_hiking_route_metrics();
revoke all on function public.preserve_hiking_route_metrics() from public,anon,authenticated;

create or replace function public.merge_hiking_route_enrichment(
  p_route_id text,
  p_distance_km numeric default null,
  p_ascent_m integer default null,
  p_max_altitude_m integer default null,
  p_min_altitude_m integer default null,
  p_duration_minutes integer default null,
  p_image_url text default null,
  p_image_source_url text default null,
  p_image_credit text default null,
  p_image_license text default null
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.hiking_routes set
    distance_km=coalesce(p_distance_km,distance_km),
    ascent_m=coalesce(p_ascent_m,ascent_m),
    max_altitude_m=coalesce(p_max_altitude_m,max_altitude_m),
    min_altitude_m=coalesce(p_min_altitude_m,min_altitude_m),
    duration_minutes=coalesce(p_duration_minutes,duration_minutes),
    image_url=coalesce(p_image_url,image_url),
    image_source_url=coalesce(p_image_source_url,image_source_url),
    image_credit=coalesce(p_image_credit,image_credit),
    image_license=coalesce(p_image_license,image_license),
    image_verified=case when p_image_url is not null then true else image_verified end
  where id=p_route_id;

  update public.hiking_routes set
    incomplete_fields=array_remove(array[
      case when name like 'Ruta pública OSM %' then 'name' end,
      case when distance_km is null then 'distance_km' end,
      case when ascent_m is null then 'ascent_m' end,
      case when max_altitude_m is null then 'max_altitude_m' end,
      case when min_altitude_m is null then 'min_altitude_m' end,
      case when duration_minutes is null then 'duration_minutes' end,
      case when image_url is null then 'image_url' end
    ],null),
    enrichment_status=case when name not like 'Ruta pública OSM %'
      and distance_km is not null and ascent_m is not null
      and max_altitude_m is not null and min_altitude_m is not null
      and duration_minutes is not null and image_url is not null
      then 'complete' else 'partial' end,
    level=case
      when distance_km is null or ascent_m is null then 'sin_clasificar'
      when distance_km>=20 or ascent_m>=1000 then 'experto'
      when distance_km<=10 and ascent_m<=400 then 'principiante'
      else 'intermedio' end
  where id=p_route_id and source='openstreetmap';
end;
$$;

revoke all on function public.merge_hiking_route_enrichment(text,numeric,integer,integer,integer,integer,text,text,text,text) from public,anon,authenticated;
grant execute on function public.merge_hiking_route_enrichment(text,numeric,integer,integer,integer,integer,text,text,text,text) to service_role;
