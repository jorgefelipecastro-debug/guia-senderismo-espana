-- Catálogo propio de refugios y alojamientos. Overpass se usa únicamente durante
-- importaciones administrativas; las consultas de usuarios se resuelven en Postgres.

create extension if not exists postgis with schema extensions;

create table if not exists public.accommodations (
  id text primary key,
  source text not null default 'openstreetmap',
  source_type text not null check (source_type in ('node','way','relation')),
  external_id bigint not null,
  name text not null check (char_length(name) between 1 and 180),
  accommodation_type text not null check (accommodation_type in (
    'alpine_hut','wilderness_hut','camp_site','hostel','guest_house','chalet','hotel'
  )),
  latitude double precision not null check (latitude between 35 and 44.5),
  longitude double precision not null check (longitude between -10 and 5),
  location extensions.geography(point,4326) not null,
  operator_name text,
  phone text,
  website text,
  opening_hours text,
  pets boolean not null default false,
  parking boolean not null default false,
  internet boolean not null default false,
  fee text,
  source_url text not null,
  raw_tags jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source,source_type,external_id)
);

create index if not exists accommodations_location_gix
  on public.accommodations using gist(location) where active;
create index if not exists accommodations_type_idx
  on public.accommodations(accommodation_type) where active;
create index if not exists accommodations_last_seen_idx
  on public.accommodations(last_seen_at);

create table if not exists public.accommodation_import_regions (
  region_code text primary key references public.route_import_regions(code) on delete cascade,
  status text not null default 'pending' check (status in ('pending','importing','ready','error')),
  accommodation_count integer not null default 0 check (accommodation_count >= 0),
  import_attempts integer not null default 0 check (import_attempts >= 0),
  last_started_at timestamptz,
  last_completed_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);

insert into public.accommodation_import_regions(region_code)
select code from public.route_import_regions
on conflict(region_code) do nothing;

alter table public.accommodations enable row level security;
alter table public.accommodation_import_regions enable row level security;
revoke all on public.accommodations from public,anon,authenticated;
revoke all on public.accommodation_import_regions from public,anon,authenticated;
grant all on public.accommodations to service_role;
grant all on public.accommodation_import_regions to service_role;

create or replace function public.nearby_accommodations(
  p_lat double precision,
  p_lon double precision,
  p_radius_m integer default 25000,
  p_limit integer default 250
)
returns table (
  id text,name text,accommodation_type text,latitude double precision,longitude double precision,
  distance_m double precision,operator_name text,phone text,website text,opening_hours text,
  pets boolean,parking boolean,internet boolean,fee text,source_url text,last_seen_at timestamptz
)
set search_path = ''
language sql
stable
as $$
  with origin as (
    select extensions.st_setsrid(extensions.st_makepoint(p_lon,p_lat),4326)::extensions.geography as point
  )
  select a.id,a.name,a.accommodation_type,a.latitude,a.longitude,
    extensions.st_distance(a.location,o.point) as distance_m,
    a.operator_name,a.phone,a.website,a.opening_hours,a.pets,a.parking,a.internet,a.fee,
    a.source_url,a.last_seen_at
  from public.accommodations a cross join origin o
  where a.active
    and extensions.st_dwithin(a.location,o.point,least(50000,greatest(5000,p_radius_m)))
  order by a.location operator(extensions.<->) o.point
  limit least(500,greatest(1,p_limit));
$$;

revoke all on function public.nearby_accommodations(double precision,double precision,integer,integer) from public,anon,authenticated;
grant execute on function public.nearby_accommodations(double precision,double precision,integer,integer) to service_role;

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
      and (a.status in ('pending','error') or a.last_completed_at < now()-interval '30 days')
    order by case a.status when 'pending' then 0 when 'error' then 1 else 2 end,
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

comment on table public.accommodations is 'Catálogo persistente de refugios y alojamientos importado de OpenStreetMap.';
comment on function public.nearby_accommodations(double precision,double precision,integer,integer) is 'Consulta espacial privada utilizada por la API de Encúmbrate.';
