-- A sparse GPS recording may contain a straight jump across kilometres of
-- unmapped ground. Keep its catalog record for repair, but do not guide with it.
with points as (
  select h.id, p.value as coord,
    lag(p.value) over (partition by h.id order by p.ordinality) as previous
  from public.hiking_routes h
  cross join lateral jsonb_array_elements(case when jsonb_typeof(h.raw_tags->'trace_points')='array'
    then h.raw_tags->'trace_points' else '[]'::jsonb end) with ordinality p(value,ordinality)
  where h.source<>'openstreetmap' and h.published
), broken as (
  select distinct id from points
  where previous is not null and
    ST_DistanceSphere(
      ST_MakePoint((previous->>1)::double precision,(previous->>0)::double precision),
      ST_MakePoint((coord->>1)::double precision,(coord->>0)::double precision)
    ) > 2000
)
update public.hiking_routes h set trace_available=false,published=false
from broken where h.id=broken.id;
