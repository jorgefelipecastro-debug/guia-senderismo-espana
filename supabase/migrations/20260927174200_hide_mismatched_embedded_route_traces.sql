-- Hide non-OSM catalog routes whose embedded GPS trace disagrees
-- materially with the published route length (checked 2026-09-27).
-- Their source records and coordinates remain available for repair.
-- Other embedded tracks are navigable via lib/route-geometry.js.
with suspects(id) as (
  values
    ('fedamon-pr-a-420'), ('fedamon-pr-a-138'),
    ('fedamon-pr-a-276'), ('fedamon-pr-a-430'),
    ('fedamon-pr-a-494'), ('fedamon-pr-a-338'),
    ('fedamon-pr-a-52'),  ('fedamon-pr-a-168'),
    ('fedamon-pr-a-339'),
    ('fedme-sl-mu-27-sendero-de-la-contraparada-murcia')
), points as (
  select h.id,h.distance_km,p.ordinality n,
    (p.value->>0)::double precision lat,
    (p.value->>1)::double precision lon
  from public.hiking_routes h
  join suspects s on s.id=h.id
  cross join lateral jsonb_array_elements(
    case when jsonb_typeof(h.raw_tags->'trace_points')='array'
      then h.raw_tags->'trace_points' else '[]'::jsonb end
  ) with ordinality p(value,ordinality)
  where h.source in ('fedamon','fedme') and h.published
    and h.distance_km>0
), steps as (
  select *,lag(lat) over(partition by id order by n) prev_lat,
    lag(lon) over(partition by id order by n) prev_lon
  from points
), measures as (
  select id,max(distance_km)::double precision catalog_km,count(*) point_count,
    sum(case when prev_lat is null then 0 else
      ST_DistanceSphere(ST_MakePoint(prev_lon,prev_lat),
        ST_MakePoint(lon,lat))/1000 end) trace_km
  from steps group by id
)
update public.hiking_routes h
  set published=false,trace_available=false
from measures m
where h.id=m.id
  and m.point_count>=2
  and abs(m.trace_km/m.catalog_km-1)>0.50
  and not exists (
    select 1 from public.hiking_route_tracks t
    where t.route_id=h.id and t.status='ready'
      and t.continuity_checked
      and jsonb_array_length(t.segments)>0
  );
