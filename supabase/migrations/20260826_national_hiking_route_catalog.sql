-- Catálogo nacional persistente de senderos públicos de Encúmbrate.
-- Las rutas se importan por provincia para evitar límites silenciosos del proveedor.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

create table if not exists public.route_import_regions (
  code text primary key,
  community text not null,
  province text not null,
  search_name text not null,
  sort_order smallint not null unique,
  osm_area_id bigint,
  status text not null default 'pending'
    check (status in ('pending','importing','ready','error')),
  route_count integer not null default 0 check (route_count >= 0),
  incomplete_count integer not null default 0 check (incomplete_count >= 0),
  import_attempts integer not null default 0 check (import_attempts >= 0),
  last_started_at timestamptz,
  last_completed_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);

create table if not exists public.hiking_routes (
  id text primary key,
  source text not null default 'openstreetmap',
  source_type text not null default 'relation',
  external_id bigint not null,
  region_code text not null references public.route_import_regions(code),
  community text not null,
  province text not null,
  municipality text,
  name text not null,
  route_ref text,
  normalized_name text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  level text not null default 'principiante'
    check (level in ('principiante','intermedio','experto')),
  distance_km numeric(9,3) check (distance_km is null or distance_km > 0),
  ascent_m integer check (ascent_m is null or ascent_m >= 0),
  max_altitude_m integer,
  min_altitude_m integer,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  route_type text,
  network text,
  operator_name text,
  description text,
  official_url text,
  source_url text not null,
  wikipedia text,
  wikidata text,
  commons_category text,
  image_url text,
  image_source_url text,
  image_credit text,
  image_license text,
  image_verified boolean not null default false,
  trace_available boolean not null default true,
  enrichment_status text not null default 'pending'
    check (enrichment_status in ('pending','partial','complete','error')),
  incomplete_fields text[] not null default '{}',
  raw_tags jsonb not null default '{}',
  published boolean not null default true,
  source_updated_at timestamptz,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_type, external_id)
);

create table if not exists public.route_import_runs (
  id bigint generated always as identity primary key,
  region_code text references public.route_import_regions(code),
  status text not null check (status in ('running','completed','error')),
  source_count integer not null default 0,
  upserted_count integer not null default 0,
  incomplete_count integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error_message text
);

create table if not exists public.hiking_route_regions (
  route_id text not null references public.hiking_routes(id) on delete cascade,
  region_code text not null references public.route_import_regions(code) on delete cascade,
  published boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (route_id,region_code)
);

create table if not exists public.route_import_control (
  id boolean primary key default true check (id),
  import_key text not null default encode(gen_random_bytes(32),'hex'),
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.route_import_control(id) values(true) on conflict(id) do nothing;

create index if not exists hiking_routes_region_name_idx
  on public.hiking_routes(region_code, normalized_name, id) where published;
create index if not exists hiking_routes_community_province_idx
  on public.hiking_routes(community, province) where published;
create index if not exists hiking_routes_location_idx
  on public.hiking_routes(latitude, longitude) where published;
create index if not exists hiking_routes_level_idx
  on public.hiking_routes(level, region_code) where published;
create index if not exists hiking_routes_incomplete_idx
  on public.hiking_routes(region_code, enrichment_status)
  where published and enrichment_status <> 'complete';
create index if not exists hiking_routes_last_seen_idx
  on public.hiking_routes(region_code, last_seen_at);
create index if not exists route_import_runs_region_started_idx
  on public.route_import_runs(region_code, started_at desc);
create index if not exists hiking_route_regions_region_idx
  on public.hiking_route_regions(region_code,route_id) where published;

alter table public.route_import_regions enable row level security;
alter table public.hiking_routes enable row level security;
alter table public.route_import_runs enable row level security;
alter table public.hiking_route_regions enable row level security;
alter table public.route_import_control enable row level security;

revoke all on public.route_import_regions from public, anon, authenticated;
revoke all on public.hiking_routes from public, anon, authenticated;
revoke all on public.route_import_runs from public, anon, authenticated;
revoke all on public.hiking_route_regions from public, anon, authenticated;
revoke all on public.route_import_control from public, anon, authenticated;

create or replace function public.touch_national_route_catalog_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_hiking_routes_updated_at on public.hiking_routes;
create trigger touch_hiking_routes_updated_at before update on public.hiking_routes
for each row execute function public.touch_national_route_catalog_updated_at();

drop trigger if exists touch_route_import_regions_updated_at on public.route_import_regions;
create trigger touch_route_import_regions_updated_at before update on public.route_import_regions
for each row execute function public.touch_national_route_catalog_updated_at();

create or replace function public.claim_next_route_import_region()
returns setof public.route_import_regions
language plpgsql security definer set search_path=''
as $$
declare v_region public.route_import_regions;
begin
  select * into v_region
  from public.route_import_regions
  where status='pending'
     or (status='error' and last_started_at < now()-interval '20 minutes')
     or (status='ready' and last_completed_at < now()-interval '30 days')
  order by case status when 'pending' then 0 when 'error' then 1 else 2 end,
           import_attempts,sort_order
  for update skip locked limit 1;
  if not found then return; end if;
  update public.route_import_regions set
    status='importing',import_attempts=import_attempts+1,
    last_started_at=now(),last_error=null
  where code=v_region.code returning * into v_region;
  return next v_region;
end;
$$;

revoke all on function public.claim_next_route_import_region() from public,anon,authenticated;
grant execute on function public.claim_next_route_import_region() to service_role;

create or replace function public.complete_route_import_region(
  p_region_code text,
  p_run_id bigint,
  p_started_at timestamptz,
  p_source_count integer,
  p_upserted_count integer
)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_count integer; v_incomplete integer;
begin
  update public.hiking_route_regions
     set published=false
   where region_code=p_region_code and last_seen_at<p_started_at;

  update public.hiking_routes h set published=exists(
    select 1 from public.hiking_route_regions m
    where m.route_id=h.id and m.published
  ) where h.region_code=p_region_code
     or exists(select 1 from public.hiking_route_regions m where m.route_id=h.id and m.region_code=p_region_code);

  select count(*),count(*) filter(where cardinality(h.incomplete_fields)>0)
    into v_count,v_incomplete
  from public.hiking_route_regions m
  join public.hiking_routes h on h.id=m.route_id
  where m.region_code=p_region_code and m.published and h.published;

  update public.route_import_regions set status='ready',route_count=v_count,
    incomplete_count=v_incomplete,last_completed_at=now(),last_error=null
  where code=p_region_code;

  update public.route_import_runs set status='completed',source_count=p_source_count,
    upserted_count=p_upserted_count,incomplete_count=v_incomplete,completed_at=now()
  where id=p_run_id;

  if not exists(
    select 1 from public.route_import_regions
    where status in ('pending','importing','error')
  ) then
    perform cron.unschedule('encumbrate-national-route-import');
  end if;

  return jsonb_build_object('route_count',v_count,'incomplete_count',v_incomplete);
end;
$$;

revoke all on function public.complete_route_import_region(text,bigint,timestamptz,integer,integer) from public,anon,authenticated;
grant execute on function public.complete_route_import_region(text,bigint,timestamptz,integer,integer) to service_role;

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
returns void language plpgsql security definer set search_path=''
as $$
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
      case when duration_minutes is null then 'duration_minutes' end,
      case when image_url is null then 'image_url' end
    ],null),
    enrichment_status=case when name not like 'Ruta pública OSM %'
      and distance_km is not null and ascent_m is not null and max_altitude_m is not null
      and duration_minutes is not null and image_url is not null then 'complete' else 'partial' end
  where id=p_route_id;
end;
$$;

revoke all on function public.merge_hiking_route_enrichment(text,numeric,integer,integer,integer,integer,text,text,text,text) from public,anon,authenticated;
grant execute on function public.merge_hiking_route_enrichment(text,numeric,integer,integer,integer,integer,text,text,text,text) to service_role;

insert into public.route_import_regions(code,community,province,search_name,sort_order) values
('almeria','Andalucía','Almería','provincia de Almería, España',1),
('cadiz','Andalucía','Cádiz','provincia de Cádiz, España',2),
('cordoba','Andalucía','Córdoba','provincia de Córdoba, España',3),
('granada','Andalucía','Granada','provincia de Granada, España',4),
('huelva','Andalucía','Huelva','provincia de Huelva, España',5),
('jaen','Andalucía','Jaén','provincia de Jaén, España',6),
('malaga','Andalucía','Málaga','provincia de Málaga, España',7),
('sevilla','Andalucía','Sevilla','provincia de Sevilla, España',8),
('huesca','Aragón','Huesca','provincia de Huesca, España',9),
('teruel','Aragón','Teruel','provincia de Teruel, España',10),
('zaragoza','Aragón','Zaragoza','provincia de Zaragoza, España',11),
('asturias','Principado de Asturias','Asturias','Asturias, España',12),
('illes-balears','Illes Balears','Illes Balears','Illes Balears, España',13),
('las-palmas','Canarias','Las Palmas','provincia de Las Palmas, España',14),
('santa-cruz-tenerife','Canarias','Santa Cruz de Tenerife','provincia de Santa Cruz de Tenerife, España',15),
('cantabria','Cantabria','Cantabria','Cantabria, España',16),
('albacete','Castilla-La Mancha','Albacete','provincia de Albacete, España',17),
('ciudad-real','Castilla-La Mancha','Ciudad Real','provincia de Ciudad Real, España',18),
('cuenca','Castilla-La Mancha','Cuenca','provincia de Cuenca, España',19),
('guadalajara','Castilla-La Mancha','Guadalajara','provincia de Guadalajara, España',20),
('toledo','Castilla-La Mancha','Toledo','provincia de Toledo, España',21),
('avila','Castilla y León','Ávila','provincia de Ávila, España',22),
('burgos','Castilla y León','Burgos','provincia de Burgos, España',23),
('leon','Castilla y León','León','provincia de León, España',24),
('palencia','Castilla y León','Palencia','provincia de Palencia, España',25),
('salamanca','Castilla y León','Salamanca','provincia de Salamanca, España',26),
('segovia','Castilla y León','Segovia','provincia de Segovia, España',27),
('soria','Castilla y León','Soria','provincia de Soria, España',28),
('valladolid','Castilla y León','Valladolid','provincia de Valladolid, España',29),
('zamora','Castilla y León','Zamora','provincia de Zamora, España',30),
('barcelona','Cataluña','Barcelona','provincia de Barcelona, España',31),
('girona','Cataluña','Girona','provincia de Girona, España',32),
('lleida','Cataluña','Lleida','provincia de Lleida, España',33),
('tarragona','Cataluña','Tarragona','provincia de Tarragona, España',34),
('alicante','Comunidad Valenciana','Alicante','provincia de Alicante, España',35),
('castellon','Comunidad Valenciana','Castellón','provincia de Castellón, España',36),
('valencia','Comunidad Valenciana','Valencia','provincia de Valencia, España',37),
('badajoz','Extremadura','Badajoz','provincia de Badajoz, España',38),
('caceres','Extremadura','Cáceres','provincia de Cáceres, España',39),
('a-coruna','Galicia','A Coruña','provincia de A Coruña, España',40),
('lugo','Galicia','Lugo','provincia de Lugo, España',41),
('ourense','Galicia','Ourense','provincia de Ourense, España',42),
('pontevedra','Galicia','Pontevedra','provincia de Pontevedra, España',43),
('la-rioja','La Rioja','La Rioja','La Rioja, España',44),
('madrid','Comunidad de Madrid','Madrid','Comunidad de Madrid, España',45),
('murcia','Región de Murcia','Murcia','Región de Murcia, España',46),
('navarra','Comunidad Foral de Navarra','Navarra','Navarra, España',47),
('alava','País Vasco','Álava','Álava, España',48),
('bizkaia','País Vasco','Bizkaia','Bizkaia, España',49),
('gipuzkoa','País Vasco','Gipuzkoa','Gipuzkoa, España',50),
('ceuta','Ceuta','Ceuta','Ceuta, España',51),
('melilla','Melilla','Melilla','Melilla, España',52)
on conflict (code) do update set
  community=excluded.community,
  province=excluded.province,
  search_name=excluded.search_name,
  sort_order=excluded.sort_order;

create or replace view public.route_catalog_province_counts
with (security_invoker=true) as
select r.code, r.community, r.province, r.status,
       count(m.route_id)::integer as route_count,
       count(m.route_id) filter (where cardinality(h.incomplete_fields)>0)::integer as incomplete_count,
       max(r.last_completed_at) as last_completed_at
from public.route_import_regions r
left join public.hiking_route_regions m on m.region_code=r.code and m.published
left join public.hiking_routes h on h.id=m.route_id and h.published
group by r.code,r.community,r.province,r.status,r.last_completed_at,r.sort_order
order by r.sort_order;

revoke all on public.route_catalog_province_counts from public,anon,authenticated;

comment on table public.hiking_routes is
  'Catálogo nacional persistente de rutas públicas. Las ausencias se registran en incomplete_fields; no se inventan métricas.';
comment on table public.route_import_regions is
  'Estado auditable de importación para las 50 provincias, Ceuta y Melilla.';

do $$
declare v_job_id bigint;
begin
  select jobid into v_job_id from cron.job where jobname='encumbrate-national-route-import';
  if v_job_id is not null then perform cron.unschedule(v_job_id); end if;
  perform cron.schedule(
    'encumbrate-national-route-import',
    '*/2 * * * *',
    $job$
      select net.http_post(
        url:='https://www.encumbrate.es/api/admin/routes/import',
        headers:=jsonb_build_object(
          'Content-Type','application/json',
          'x-encumbrate-import-key',(select import_key from public.route_import_control where id=true)
        ),
        body:='{}'::jsonb,
        timeout_milliseconds:=60000
      )
      where exists(
        select 1 from public.route_import_regions
        where status='pending'
           or (status='error' and last_started_at<now()-interval '20 minutes')
           or (status='ready' and last_completed_at<now()-interval '30 days')
      );
    $job$
  );
end $$;
