-- FEDME, PR-TE 97: Ruta de las Lastras de San José.
-- Ficha oficial: https://misendafedme.es/buscador-de-senderos/etapa/pr-te-97-ruta-de-las-lastras-de-san-jose
-- GPX oficial: https://misendafedme.es/buscador-de-senderos/inc/downloadGpx.php?etapa=117430
-- SHA-256 del archivo original: 0e8dcbd9e617e58ac4bfc908ad88e222aaa5d5516b6aea24e8836ac848807645
-- Revisado el 2026-10-09: 193 puntos originales, un segmento continuo,
-- 1.910547 km, intervalo máximo 37.54 m.
-- Referencia, ubicación, extremos y recorrido contrastados con OSM.
-- El 100 % de los puntos de ambas fuentes queda a menos de 100 m del otro trazado.
-- Coordenadas originales conservadas sin remuestrear, unir ni cerrar trazados.
-- La navegación existente descarta solo 18 duplicados consecutivos exactos.
-- Distancia sobre el GPX; horarios y desniveles existentes se conservan.
do $curate$
declare
  v_coords jsonb := $coords$[[41.116954,-0.504552],[41.116954,-0.504552],[41.116954,-0.504407],[41.116976,-0.504337],[41.117124,-0.504243],[41.117233,-0.504198],[41.117291,-0.504135],[41.117392,-0.504006],[41.117418,-0.503961],[41.117418,-0.503961],[41.117485,-0.503847],[41.117731,-0.50354],[41.117834,-0.503401],[41.1179,-0.503261],[41.117934,-0.503148],[41.117948,-0.503081],[41.11795,-0.503075],[41.117964,-0.503013],[41.117999,-0.50293],[41.11802,-0.502907],[41.11802,-0.502907],[41.118087,-0.502835],[41.118129,-0.502798],[41.118129,-0.502798],[41.118174,-0.502758],[41.11823,-0.502687],[41.118279,-0.502609],[41.118337,-0.502464],[41.118359,-0.502402],[41.118382,-0.502332],[41.118447,-0.502297],[41.118504,-0.502279],[41.11856,-0.502277],[41.118687,-0.502176],[41.118783,-0.501996],[41.118861,-0.501864],[41.118974,-0.50163],[41.119057,-0.501487],[41.119113,-0.501388],[41.11917,-0.501297],[41.11921,-0.501267],[41.119259,-0.501192],[41.11929,-0.501119],[41.11934,-0.50097],[41.119352,-0.500875],[41.1194,-0.500781],[41.119449,-0.500713],[41.119533,-0.500349],[41.119547,-0.500302],[41.119628,-0.500118],[41.119741,-0.499989],[41.119839,-0.49982],[41.119905,-0.499731],[41.119938,-0.499658],[41.120077,-0.499348],[41.120112,-0.499247],[41.120142,-0.499149],[41.120152,-0.499067],[41.120166,-0.49898],[41.120168,-0.498743],[41.12016,-0.498519],[41.120155,-0.49838],[41.120163,-0.498158],[41.12019,-0.498068],[41.120219,-0.497988],[41.120275,-0.497828],[41.120282,-0.497703],[41.120274,-0.497494],[41.120265,-0.497354],[41.120265,-0.497354],[41.120274,-0.497494],[41.120282,-0.497703],[41.120275,-0.497828],[41.120219,-0.497988],[41.12019,-0.498068],[41.120163,-0.498158],[41.120161,-0.498155],[41.120116,-0.498292],[41.120083,-0.498443],[41.120018,-0.498578],[41.119934,-0.498681],[41.119799,-0.498775],[41.119686,-0.498879],[41.11956,-0.499041],[41.119415,-0.499251],[41.119347,-0.499362],[41.119264,-0.499212],[41.119344,-0.499372],[41.119309,-0.49941],[41.119306,-0.499642],[41.119295,-0.499749],[41.119283,-0.499851],[41.119263,-0.499974],[41.119248,-0.500082],[41.119176,-0.50038],[41.119165,-0.500495],[41.119175,-0.500632],[41.119238,-0.500775],[41.119335,-0.500982],[41.11934,-0.50097],[41.11929,-0.501119],[41.119259,-0.501192],[41.11921,-0.501267],[41.11917,-0.501297],[41.119113,-0.501388],[41.119057,-0.501487],[41.118974,-0.50163],[41.118861,-0.501864],[41.118783,-0.501996],[41.118687,-0.502176],[41.11856,-0.502277],[41.118504,-0.502279],[41.118447,-0.502297],[41.118382,-0.502332],[41.118359,-0.502402],[41.118337,-0.502464],[41.118279,-0.502609],[41.11823,-0.502687],[41.118174,-0.502758],[41.118129,-0.502798],[41.118129,-0.502798],[41.118087,-0.502835],[41.11802,-0.502907],[41.11802,-0.502907],[41.117999,-0.50293],[41.117964,-0.503013],[41.11795,-0.503075],[41.117948,-0.503081],[41.117934,-0.503041],[41.117934,-0.503041],[41.117852,-0.503018],[41.117797,-0.503056],[41.117729,-0.503105],[41.117693,-0.503058],[41.117683,-0.502931],[41.117666,-0.502796],[41.11764,-0.502734],[41.117582,-0.502708],[41.117582,-0.502708],[41.117538,-0.50273],[41.11746,-0.502755],[41.11746,-0.502755],[41.117416,-0.50277],[41.117397,-0.502799],[41.117368,-0.502813],[41.11732,-0.502695],[41.11732,-0.502695],[41.117196,-0.50261],[41.117156,-0.502599],[41.117019,-0.50262],[41.116795,-0.502661],[41.116717,-0.502682],[41.11666,-0.50275],[41.11666,-0.50275],[41.116717,-0.502682],[41.116795,-0.502661],[41.117019,-0.50262],[41.117156,-0.502599],[41.117196,-0.50261],[41.11732,-0.502695],[41.11732,-0.502695],[41.117368,-0.502813],[41.117397,-0.502799],[41.117416,-0.50277],[41.11746,-0.502755],[41.11746,-0.502755],[41.117538,-0.50273],[41.117582,-0.502708],[41.117582,-0.502708],[41.11764,-0.502734],[41.117666,-0.502796],[41.117683,-0.502931],[41.117693,-0.503058],[41.117729,-0.503105],[41.117797,-0.503056],[41.117852,-0.503018],[41.117934,-0.503041],[41.117934,-0.503041],[41.117948,-0.503081],[41.117948,-0.503081],[41.117934,-0.503148],[41.1179,-0.503261],[41.117834,-0.503401],[41.117731,-0.50354],[41.117485,-0.503847],[41.117418,-0.503961],[41.117418,-0.503961],[41.117392,-0.504006],[41.117291,-0.504135],[41.117233,-0.504198],[41.117124,-0.504243],[41.116976,-0.504337],[41.116954,-0.504407]]$coords$::jsonb;
  v_landmarks jsonb := $landmarks$[[41.116954,-0.504552],[41.116954,-0.504407]]$landmarks$::jsonb;
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
    where h.id='osm-relation-11270048'
      and h.source='openstreetmap' and h.source_type='relation'
      and h.external_id=11270048
      and h.name='Ruta de las Lastras de San José'
      and h.route_ref='PR-TE 97' and h.raw_tags->>'ref'='PR-TE 97'
      and h.source_url='https://www.openstreetmap.org/relation/11270048'
      and (h.official_url is not distinct from null
        or h.official_url='https://misendafedme.es/buscador-de-senderos/etapa/pr-te-97-ruta-de-las-lastras-de-san-jose')
      and h.region_code='teruel' and h.province='Teruel'
      and h.latitude=41.1184438 and h.longitude=-0.5007592
      and exists (select 1 from public.hiking_route_regions r
        where r.route_id=h.id and r.region_code='teruel' and r.published)
    for update of h,t;
  if not found then
    raise exception 'PR-TE 97 route identity or published region changed';
  end if;
  if v_route.status='ready' then
    if v_route.geometry_source_url='https://misendafedme.es/buscador-de-senderos/inc/downloadGpx.php?etapa=117430'
      and v_route.geometry_source='FEDME - GPX oficial PR-TE 97'
      and v_route.segments=jsonb_build_array(v_points)
      and v_route.official and v_route.continuity_checked
      and v_route.checked_at is not null
      and v_route.published and v_route.trace_available
      and v_route.official_url='https://misendafedme.es/buscador-de-senderos/etapa/pr-te-97-ruta-de-las-lastras-de-san-jose'
      and v_route.distance_km=1.91
      and v_route.route_type='Circular'
      and v_route.duration_minutes is null
      and v_route.ascent_m is null
      and v_route.description='PR-TE 97, Ruta de las Lastras de San José, con salida y regreso a Albalate del Arzobispo. El GPX oficial contiene el recorrido circular completo: 1,91 km.' then
      return;
    end if;
    raise exception 'PR-TE 97 route has another ready trace or publication state';
  end if;
  if v_route.status is distinct from 'missing'
    or v_route.published is distinct from false
    or v_route.trace_available is distinct from false
    or v_route.segments is not null or v_route.geometry_source_url is not null
    or v_route.geometry_source is distinct from 'OpenStreetMap'
    or v_route.official is distinct from false
    or v_route.continuity_checked is distinct from true
    or v_route.official_url is distinct from null
    or v_route.description is distinct from null
    or v_route.distance_km is distinct from null
    or v_route.ascent_m is not null or v_route.duration_minutes is not null
    or v_route.route_type is distinct from null then
    raise exception 'PR-TE 97 hidden route state changed';
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
      (lat between 41.11 and 41.13 and lon between -0.51 and -0.49) valid
    from steps
  )
  select count(*),coalesce(sum(step_km),0),coalesce(max(step_km),0),
    coalesce(min(center_km),999),count(*) filter(where not valid)
    into v_count,v_length_km,v_max_gap_km,v_center_gap_km,v_invalid
    from distances;
  select ST_DistanceSphere(
    ST_MakePoint((v_coords->0->>1)::double precision,(v_coords->0->>0)::double precision),
    ST_MakePoint(-0.504552,41.116954)),
    ST_DistanceSphere(
    ST_MakePoint((v_coords->(v_count-1)->>1)::double precision,
      (v_coords->(v_count-1)->>0)::double precision),
    ST_MakePoint(-0.504407,41.116954)),
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
  if v_count<>193 or v_invalid>0
    or abs(v_length_km-1.910547)>0.015
    or v_max_gap_km>0.040 or v_center_gap_km>0.100
    or v_start_gap_m>2 or v_end_gap_m>2 or v_closing_gap_m>25
    or v_landmark_gap_m>10 then
    raise exception 'PR-TE 97 GPS validation failed: points %, length %, gap %, center %, start %, end %, closure %, landmarks %, invalid %',
      v_count,v_length_km,v_max_gap_km,v_center_gap_km,
      v_start_gap_m,v_end_gap_m,v_closing_gap_m,v_landmark_gap_m,v_invalid;
  end if;
  update public.hiking_route_tracks
    set status='ready',segments=jsonb_build_array(v_points),checked_at=now(),
      continuity_checked=true,geometry_source='FEDME - GPX oficial PR-TE 97',
      geometry_source_url='https://misendafedme.es/buscador-de-senderos/inc/downloadGpx.php?etapa=117430',official=true
    where route_id=v_route.id and status='missing';
  if not found then
    raise exception 'PR-TE 97 track state changed';
  end if;
  update public.hiking_routes
    set trace_available=true,published=true,
      distance_km=round(v_length_km::numeric,2),route_type='Circular',
      official_url='https://misendafedme.es/buscador-de-senderos/etapa/pr-te-97-ruta-de-las-lastras-de-san-jose',description='PR-TE 97, Ruta de las Lastras de San José, con salida y regreso a Albalate del Arzobispo. El GPX oficial contiene el recorrido circular completo: 1,91 km.'
    where id=v_route.id and not published and not trace_available;
  if not found then
    raise exception 'PR-TE 97 publication state changed';
  end if;
end
$curate$;
