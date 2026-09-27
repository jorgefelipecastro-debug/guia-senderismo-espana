-- A route relation can be incomplete even when an independent public authority
-- publishes a complete GPS line. Preserve the actual source of the saved line.
alter table public.hiking_route_tracks
  add column if not exists geometry_source text not null default 'OpenStreetMap',
  add column if not exists geometry_source_url text,
  add column if not exists official boolean not null default false;
