-- The first continuity pass checked original member ways before sampling.
-- Queue saved routes whose reduced line gained a >2 km straight jump so the
-- importer can retain the real intermediate OSM vertices on the next pass.
with points as (
  select t.route_id,p.value as point,
    lag(p.value) over (partition by t.route_id order by p.ordinality) as previous
  from public.hiking_route_tracks t
  cross join lateral jsonb_array_elements(t.segments->0) with ordinality p(value,ordinality)
  where t.status='ready' and t.continuity_checked
), broken as (
  select distinct route_id from points
  where previous is not null and ST_DistanceSphere(
    ST_MakePoint((previous->>'lon')::double precision,(previous->>'lat')::double precision),
    ST_MakePoint((point->>'lon')::double precision,(point->>'lat')::double precision)
  ) > 2000
), hidden as (
  update public.hiking_routes h set trace_available=false,published=false
  from broken where h.id=broken.route_id returning h.id
)
update public.hiking_route_tracks t set status='checking',segments=null,
  continuity_checked=false,checked_at=now()-interval '11 minutes'
from hidden where t.route_id=hidden.id;
