-- Comarca de Ribagorza, PR-HU 28: Sendero La Saleta.
-- Ficha oficial: https://turismoribagorza.org/ruta/pr-hu-28-camino-de-la-saleta/
-- GPX oficial: https://turismoribagorza.org/wp-content/uploads/2025/06/10_pr_hu_28.gpx
-- SHA-256 del archivo original: 3dd224d8c2f1f53b6eef3483819c679e39ade3503a8d3be4010e1e7758871c16
-- Revisado el 2026-10-08: 205 puntos originales, un segmento continuo,
-- 2.069084 km, intervalo máximo 24.82 m.
-- Referencia, ubicación, extremos y puntos de paso contrastados con OSM.
-- Coordenadas originales conservadas sin remuestrear, unir ni cerrar trazados.
-- Distancia sobre el GPX; horarios y desniveles existentes se conservan.
-- La ficha incluye el regreso; el GPX solo contiene el tramo de ida.
do $curate$
declare
  v_coords jsonb := $coords$[[42.605364,0.525255],[42.605423,0.525343],[42.605512,0.52543],[42.605563,0.525484],[42.6056,0.525587],[42.605563,0.525694],[42.605496,0.525858],[42.605432,0.526014],[42.605367,0.526157],[42.60529,0.526356],[42.605237,0.526534],[42.605189,0.526703],[42.605149,0.526799],[42.605094,0.526899],[42.605059,0.527023],[42.605031,0.527152],[42.605005,0.527318],[42.605008,0.527415],[42.605034,0.527569],[42.605056,0.527655],[42.60517,0.527828],[42.605307,0.52801],[42.605345,0.528085],[42.605369,0.5282],[42.605377,0.528288],[42.605376,0.528377],[42.605361,0.528502],[42.605332,0.528612],[42.605296,0.52872],[42.605236,0.528805],[42.605145,0.529041],[42.605087,0.52921],[42.60507,0.529383],[42.605035,0.529477],[42.604976,0.529513],[42.604924,0.52965],[42.604898,0.529757],[42.604878,0.529875],[42.604892,0.530005],[42.604871,0.530098],[42.604793,0.530219],[42.604738,0.530345],[42.60468,0.530451],[42.604613,0.530552],[42.604526,0.530636],[42.604444,0.530698],[42.604345,0.530731],[42.604134,0.53083],[42.604044,0.53085],[42.603856,0.530863],[42.603792,0.53087],[42.603722,0.53092],[42.603624,0.530914],[42.603552,0.530902],[42.603483,0.530942],[42.603413,0.530976],[42.603316,0.530966],[42.60322,0.53094],[42.603158,0.530951],[42.603098,0.530989],[42.603009,0.531069],[42.602952,0.531136],[42.602857,0.531281],[42.602715,0.531409],[42.602572,0.531481],[42.602426,0.531545],[42.602323,0.531561],[42.602252,0.531574],[42.602118,0.531573],[42.602041,0.531528],[42.601911,0.531495],[42.601813,0.531476],[42.601715,0.53149],[42.601661,0.531518],[42.601599,0.531566],[42.601525,0.53166],[42.601445,0.531727],[42.601384,0.531731],[42.601327,0.531748],[42.601256,0.531792],[42.601154,0.531781],[42.601063,0.531732],[42.600968,0.531754],[42.600907,0.531783],[42.600842,0.531844],[42.600837,0.531951],[42.600888,0.532029],[42.600925,0.532108],[42.601002,0.532165],[42.600989,0.532262],[42.60093,0.532277],[42.60091,0.532387],[42.600856,0.532456],[42.600785,0.532528],[42.600679,0.532576],[42.600603,0.532581],[42.600542,0.532557],[42.600499,0.532496],[42.600419,0.532449],[42.600332,0.532427],[42.600273,0.532361],[42.600219,0.53234],[42.600117,0.532289],[42.60001,0.532232],[42.599919,0.532206],[42.599823,0.532193],[42.599743,0.532205],[42.599658,0.532201],[42.599559,0.532166],[42.599457,0.532095],[42.599382,0.531938],[42.599307,0.531808],[42.599258,0.53171],[42.599212,0.531639],[42.599149,0.531586],[42.599053,0.531649],[42.598977,0.531664],[42.598904,0.531668],[42.598874,0.531624],[42.598794,0.53157],[42.598717,0.531502],[42.598586,0.531518],[42.598487,0.531562],[42.598322,0.531587],[42.59818,0.531612],[42.598031,0.531682],[42.597901,0.531676],[42.597797,0.531531],[42.59773,0.531442],[42.597651,0.531401],[42.597528,0.531409],[42.597434,0.531487],[42.597326,0.531497],[42.597168,0.531486],[42.597187,0.531328],[42.597168,0.531486],[42.597326,0.531497],[42.597434,0.531487],[42.597528,0.531409],[42.597651,0.531401],[42.59773,0.531442],[42.597797,0.531531],[42.597901,0.531676],[42.598031,0.531682],[42.59818,0.531612],[42.598322,0.531587],[42.598487,0.531562],[42.598586,0.531518],[42.598717,0.531502],[42.598794,0.53157],[42.598874,0.531624],[42.598904,0.531668],[42.598914,0.531684],[42.598878,0.531613],[42.598878,0.531558],[42.598879,0.531524],[42.598882,0.531477],[42.598874,0.531459],[42.598853,0.531437],[42.598837,0.531406],[42.598827,0.531381],[42.59882,0.531361],[42.598825,0.531327],[42.598826,0.531299],[42.598821,0.531262],[42.598806,0.531234],[42.598781,0.53117],[42.598754,0.531125],[42.598737,0.531014],[42.598713,0.530951],[42.598709,0.530888],[42.598705,0.530839],[42.598663,0.530768],[42.598642,0.530772],[42.598582,0.530814],[42.598488,0.530813],[42.598432,0.530798],[42.598368,0.530695],[42.598307,0.530604],[42.598205,0.530547],[42.598117,0.530532],[42.59805,0.530473],[42.597969,0.530477],[42.59789,0.53044],[42.597808,0.53039],[42.597729,0.530354],[42.597655,0.530282],[42.59757,0.530228],[42.597484,0.530174],[42.59744,0.530105],[42.597358,0.529932],[42.597323,0.529819],[42.59728,0.52964],[42.597226,0.529545],[42.597197,0.529475],[42.597133,0.529393],[42.597062,0.529322],[42.59702,0.52927],[42.596995,0.529216],[42.596962,0.529208],[42.596922,0.529201],[42.596931,0.529151],[42.596949,0.529113],[42.596946,0.529066],[42.596944,0.529037]]$coords$::jsonb;
  v_landmarks jsonb := $landmarks$[[42.605364,0.525255]]$landmarks$::jsonb;
  v_route record;
  v_points jsonb;
  v_count integer;
  v_length_km double precision;
  v_max_gap_km double precision;
  v_center_gap_km double precision;
  v_invalid integer;
  v_start_gap_m double precision;
  v_end_gap_m double precision;
  v_closing_gap_m double precision;
  v_landmark_gap_m double precision;
begin
  select jsonb_agg(jsonb_build_object(
    'lat',(point->>0)::double precision,
    'lon',(point->>1)::double precision
  ) order by ordinality)
    into v_points
    from jsonb_array_elements(v_coords)
      with ordinality as p(point,ordinality);
  select h.id,h.latitude,h.longitude,h.published,h.trace_available,
      h.official_url,h.description,h.distance_km,h.route_type,
      h.duration_minutes,h.ascent_m,
      t.status,t.segments,t.geometry_source,t.geometry_source_url,
      t.official,t.continuity_checked,t.checked_at
    into v_route
    from public.hiking_routes h
    join public.hiking_route_tracks t on t.route_id=h.id
    where h.id='osm-relation-9709113'
      and h.source='openstreetmap' and h.source_type='relation'
      and h.external_id=9709113
      and h.name='Sendero La Saleta'
      and h.route_ref='PR-HU 28' and h.raw_tags->>'ref'='PR-HU 28'
      and h.source_url='https://www.openstreetmap.org/relation/9709113'
      and (h.official_url is not distinct from null
        or h.official_url='https://turismoribagorza.org/ruta/pr-hu-28-camino-de-la-saleta/')
      and h.region_code='huesca' and h.province='Huesca'
      and h.latitude=42.6011982 and h.longitude=0.5288796
      and exists (select 1 from public.hiking_route_regions r
        where r.route_id=h.id and r.region_code='huesca' and r.published)
    for update of h,t;
  if not found then
    raise exception 'PR-HU 28 route identity or published region changed';
  end if;
  if v_route.status='ready' then
    if v_route.geometry_source_url='https://turismoribagorza.org/wp-content/uploads/2025/06/10_pr_hu_28.gpx'
      and v_route.geometry_source='Comarca de Ribagorza - GPX oficial PR-HU 28'
      and v_route.segments=jsonb_build_array(v_points)
      and v_route.official and v_route.continuity_checked
      and v_route.checked_at is not null
      and v_route.published and v_route.trace_available
      and v_route.official_url='https://turismoribagorza.org/ruta/pr-hu-28-camino-de-la-saleta/'
      and v_route.distance_km=2.07
      and v_route.route_type='Lineal'
      and v_route.duration_minutes is null
      and v_route.ascent_m is null
      and v_route.description='PR-HU 28 desde Benasque por el camino de La Saleta y el mirador de Pichirillo hasta el enlace con el PR-HU 27. El GPX oficial contiene este tramo lineal de 2,07 km. Los 4,505 km, 1 h 50 min y 300 m de subida de la ficha incluyen el regreso a Benasque.' then
      return;
    end if;
    raise exception 'PR-HU 28 route has another ready trace or publication state';
  end if;
  if v_route.status is distinct from 'missing'
    or v_route.published is distinct from false
    or v_route.trace_available is distinct from false
    or v_route.segments is not null or v_route.geometry_source_url is not null
    or v_route.geometry_source is distinct from 'OpenStreetMap'
    or v_route.official is distinct from false
    or v_route.continuity_checked is distinct from true
    or v_route.official_url is distinct from null
    or v_route.description is distinct from 'Benasque - Mirador de El Pichirillo'
    or v_route.distance_km is distinct from 2.000
    or v_route.ascent_m is not null or v_route.duration_minutes is not null
    or v_route.route_type is distinct from null then
    raise exception 'PR-HU 28 hidden route state changed';
  end if;
  with points as (
    select ordinality idx,(point->>0)::double precision lat,
      (point->>1)::double precision lon
    from jsonb_array_elements(v_coords) with ordinality as p(point,ordinality)
  ), steps as (
    select *,lag(lat) over(order by idx) prev_lat,
      lag(lon) over(order by idx) prev_lon from points
  ), distances as (
    select case when prev_lat is null then 0 else
      ST_DistanceSphere(ST_MakePoint(lon,lat),
        ST_MakePoint(prev_lon,prev_lat))/1000 end step_km,
      ST_DistanceSphere(ST_MakePoint(lon,lat),
        ST_MakePoint(v_route.longitude,v_route.latitude))/1000 center_km,
      (lat between 42.59 and 42.61 and lon between 0.52 and 0.54) valid
    from steps
  )
  select count(*),coalesce(sum(step_km),0),coalesce(max(step_km),0),
    coalesce(min(center_km),999),count(*) filter(where not valid)
    into v_count,v_length_km,v_max_gap_km,v_center_gap_km,v_invalid
    from distances;
  select ST_DistanceSphere(
    ST_MakePoint((v_coords->0->>1)::double precision,(v_coords->0->>0)::double precision),
    ST_MakePoint(0.525255,42.605364)),
    ST_DistanceSphere(
    ST_MakePoint((v_coords->(v_count-1)->>1)::double precision,
      (v_coords->(v_count-1)->>0)::double precision),
    ST_MakePoint(0.529037,42.596944)),
    ST_DistanceSphere(
    ST_MakePoint((v_coords->0->>1)::double precision,(v_coords->0->>0)::double precision),
    ST_MakePoint((v_coords->(v_count-1)->>1)::double precision,
      (v_coords->(v_count-1)->>0)::double precision))
    into v_start_gap_m,v_end_gap_m,v_closing_gap_m;
  select max(nearest.gap_m) into v_landmark_gap_m
    from jsonb_array_elements(v_landmarks) as w(landmark)
    cross join lateral (
      select min(ST_DistanceSphere(
        ST_MakePoint((point->>1)::double precision,(point->>0)::double precision),
        ST_MakePoint((w.landmark->>1)::double precision,(w.landmark->>0)::double precision))) gap_m
      from jsonb_array_elements(v_coords) as p(point)
    ) nearest;
  if v_count<>205 or v_invalid>0
    or abs(v_length_km-2.069084)>0.015
    or v_max_gap_km>0.026 or v_center_gap_km>0.25
    or v_start_gap_m>2 or v_end_gap_m>2 or v_closing_gap_m<500
    or v_landmark_gap_m>10 then
    raise exception 'PR-HU 28 GPS validation failed: points %, length %, gap %, center %, start %, end %, closure %, landmarks %, invalid %',
      v_count,v_length_km,v_max_gap_km,v_center_gap_km,
      v_start_gap_m,v_end_gap_m,v_closing_gap_m,v_landmark_gap_m,v_invalid;
  end if;
  update public.hiking_route_tracks
    set status='ready',segments=jsonb_build_array(v_points),checked_at=now(),
      continuity_checked=true,geometry_source='Comarca de Ribagorza - GPX oficial PR-HU 28',
      geometry_source_url='https://turismoribagorza.org/wp-content/uploads/2025/06/10_pr_hu_28.gpx',official=true
    where route_id=v_route.id and status='missing';
  if not found then
    raise exception 'PR-HU 28 track state changed';
  end if;
  update public.hiking_routes
    set trace_available=true,published=true,
      distance_km=round(v_length_km::numeric,2),route_type='Lineal',
      official_url='https://turismoribagorza.org/ruta/pr-hu-28-camino-de-la-saleta/',description='PR-HU 28 desde Benasque por el camino de La Saleta y el mirador de Pichirillo hasta el enlace con el PR-HU 27. El GPX oficial contiene este tramo lineal de 2,07 km. Los 4,505 km, 1 h 50 min y 300 m de subida de la ficha incluyen el regreso a Benasque.'
    where id=v_route.id and not published and not trace_available;
  if not found then
    raise exception 'PR-HU 28 publication state changed';
  end if;
end
$curate$;
