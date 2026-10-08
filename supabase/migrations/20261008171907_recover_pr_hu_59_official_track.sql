-- FEDME, PR-HU 59: Almazorre - Dolmen.
-- Ficha oficial: https://misendafedme.es/buscador-de-senderos/etapa/pr-hu-59-almazorre-dolmen-
-- GPX oficial: https://misendafedme.es/buscador-de-senderos/inc/downloadGpx.php?etapa=117665
-- SHA-256 del archivo original: f1113cd9a948f834d1c3f9339a6b9de680e3f3bd194983b1a9384c90cb2ae756
-- Revisado el 2026-10-08: 197 puntos originales, un segmento continuo,
-- 3.065169 km, intervalo máximo 24.41 m.
-- Referencia, ubicación, extremos y recorrido contrastados con OSM.
-- Coordenadas originales conservadas sin remuestrear, unir ni cerrar trazados.
-- Distancia sobre el GPX; horarios y desniveles existentes se conservan.
-- Recorrido lineal a Caseta de las Balanzas, contrastado también con la ficha del Ayuntamiento de Bárcabo.
do $curate$
declare
  v_coords jsonb := $coords$[[42.261356,0.060759],[42.261442,0.060683],[42.261564,0.06068],[42.261686,0.060678],[42.261806,0.060685],[42.261925,0.060692],[42.262003,0.060651],[42.262136,0.060606],[42.262245,0.060584],[42.26235,0.06051],[42.262363,0.0605],[42.26244,0.060441],[42.262488,0.060342],[42.262542,0.06026],[42.262651,0.060147],[42.262783,0.060084],[42.262909,0.060043],[42.263038,0.060049],[42.263167,0.060009],[42.263299,0.059905],[42.26346,0.05982],[42.26361,0.059814],[42.263714,0.059864],[42.263823,0.059882],[42.263824,0.0597],[42.263785,0.059546],[42.263759,0.059442],[42.263744,0.059384],[42.263745,0.059262],[42.263873,0.059112],[42.263849,0.058896],[42.263925,0.058695],[42.264005,0.058594],[42.264083,0.058568],[42.264153,0.058623],[42.264228,0.058554],[42.264269,0.058566],[42.264327,0.058584],[42.264435,0.05873],[42.264518,0.058847],[42.264597,0.0589],[42.264752,0.058958],[42.264907,0.059015],[42.265071,0.059143],[42.26518,0.059207],[42.265288,0.059271],[42.265407,0.059397],[42.265491,0.059501],[42.265632,0.059598],[42.265774,0.059695],[42.265932,0.059775],[42.266091,0.059856],[42.266242,0.059896],[42.266439,0.060027],[42.266598,0.060061],[42.266785,0.060055],[42.266995,0.060117],[42.267136,0.060195],[42.267269,0.0603],[42.267401,0.060404],[42.267512,0.060531],[42.267646,0.060559],[42.267797,0.06057],[42.267981,0.060594],[42.26809,0.06058],[42.268265,0.060639],[42.268376,0.060687],[42.268487,0.060735],[42.268587,0.060901],[42.2687,0.060879],[42.268804,0.06079],[42.268914,0.060705],[42.269018,0.060557],[42.26913,0.060527],[42.269253,0.060608],[42.269393,0.06073],[42.269506,0.060866],[42.269608,0.060897],[42.269731,0.060804],[42.269832,0.060678],[42.269964,0.06063],[42.27005,0.060487],[42.270229,0.060387],[42.270398,0.060369],[42.270538,0.060499],[42.270679,0.060644],[42.270749,0.060789],[42.270909,0.060869],[42.271051,0.060948],[42.271189,0.061001],[42.271331,0.061095],[42.271473,0.061136],[42.271611,0.061229],[42.271718,0.061294],[42.271825,0.061358],[42.271993,0.061353],[42.272122,0.061198],[42.272167,0.061018],[42.272206,0.060881],[42.272395,0.060784],[42.272503,0.060686],[42.272521,0.060529],[42.272422,0.060349],[42.272467,0.060071],[42.272573,0.059845],[42.272462,0.059704],[42.272397,0.059521],[42.272315,0.059452],[42.272254,0.059325],[42.272219,0.059186],[42.27214,0.059036],[42.272023,0.058891],[42.271981,0.058775],[42.271921,0.058617],[42.272032,0.05862],[42.272151,0.058692],[42.272303,0.058755],[42.27243,0.058784],[42.272556,0.058814],[42.272709,0.05881],[42.272847,0.058774],[42.272941,0.058813],[42.273054,0.058791],[42.273165,0.058732],[42.273344,0.058737],[42.273484,0.058782],[42.273625,0.058827],[42.273744,0.058834],[42.273862,0.058842],[42.274018,0.058721],[42.274123,0.058574],[42.274266,0.058583],[42.27441,0.058592],[42.274527,0.058568],[42.274643,0.058543],[42.274808,0.058476],[42.27495,0.058371],[42.275052,0.058297],[42.275131,0.05809],[42.275249,0.058],[42.275355,0.057942],[42.275502,0.058014],[42.275631,0.05809],[42.275796,0.058124],[42.2759,0.058168],[42.276038,0.058131],[42.276173,0.05809],[42.276313,0.058114],[42.276516,0.058008],[42.276629,0.058017],[42.276742,0.058025],[42.276863,0.058035],[42.276983,0.058045],[42.277165,0.058084],[42.27731,0.058051],[42.277486,0.058016],[42.277641,0.05803],[42.277819,0.057977],[42.278003,0.057994],[42.27817,0.058064],[42.278331,0.058199],[42.278442,0.058334],[42.278583,0.058461],[42.278762,0.058458],[42.278912,0.05851],[42.279032,0.058584],[42.279141,0.058603],[42.279353,0.058674],[42.279528,0.058653],[42.279701,0.058663],[42.279814,0.058659],[42.279967,0.058741],[42.280102,0.058864],[42.280241,0.059025],[42.280311,0.059163],[42.280382,0.059301],[42.280432,0.059427],[42.280518,0.059567],[42.280635,0.059763],[42.28073,0.059886],[42.280765,0.06005],[42.280926,0.060147],[42.28113,0.060128],[42.281334,0.060072],[42.281502,0.059932],[42.281619,0.059861],[42.28167,0.059723],[42.281763,0.05962],[42.28189,0.05954],[42.281979,0.059423],[42.282057,0.059347],[42.282177,0.059188],[42.282313,0.059184],[42.282495,0.059271],[42.282632,0.059394],[42.282758,0.059414],[42.282896,0.059389]]$coords$::jsonb;
  v_landmarks jsonb := $landmarks$[[42.261356,0.060759],[42.282896,0.059389]]$landmarks$::jsonb;
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
    where h.id='osm-relation-9645909'
      and h.source='openstreetmap' and h.source_type='relation'
      and h.external_id=9645909
      and h.name='Almazorre - Dolmen'
      and h.route_ref='PR-HU 59' and h.raw_tags->>'ref'='PR-HU 59'
      and h.source_url='https://www.openstreetmap.org/relation/9645909'
      and (h.official_url is not distinct from null
        or h.official_url='https://misendafedme.es/buscador-de-senderos/etapa/pr-hu-59-almazorre-dolmen-')
      and h.region_code='huesca' and h.province='Huesca'
      and h.latitude=42.272131 and h.longitude=0.0596037
      and exists (select 1 from public.hiking_route_regions r
        where r.route_id=h.id and r.region_code='huesca' and r.published)
    for update of h,t;
  if not found then
    raise exception 'PR-HU 59 route identity or published region changed';
  end if;
  if v_route.status='ready' then
    if v_route.geometry_source_url='https://misendafedme.es/buscador-de-senderos/inc/downloadGpx.php?etapa=117665'
      and v_route.geometry_source='FEDME - GPX oficial PR-HU 59'
      and v_route.segments=jsonb_build_array(v_points)
      and v_route.official and v_route.continuity_checked
      and v_route.checked_at is not null
      and v_route.published and v_route.trace_available
      and v_route.official_url='https://misendafedme.es/buscador-de-senderos/etapa/pr-hu-59-almazorre-dolmen-'
      and v_route.distance_km=3.07
      and v_route.route_type='Lineal'
      and v_route.duration_minutes is null
      and v_route.ascent_m is null
      and v_route.description='PR-HU 59 de Almazorre al dolmen Caseta de las Balanzas, pasando por el barranco Cañiminas, el antiguo horno de cal y las ruinas del castillo de La Zaba. El GPX oficial contiene el tramo lineal de ida: 3,07 km.' then
      return;
    end if;
    raise exception 'PR-HU 59 route has another ready trace or publication state';
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
    or v_route.distance_km is distinct from 3
    or v_route.ascent_m is not null or v_route.duration_minutes is not null
    or v_route.route_type is distinct from null then
    raise exception 'PR-HU 59 hidden route state changed';
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
      (lat between 42.26 and 42.29 and lon between 0.05 and 0.07) valid
    from steps
  )
  select count(*),coalesce(sum(step_km),0),coalesce(max(step_km),0),
    coalesce(min(center_km),999),count(*) filter(where not valid)
    into v_count,v_length_km,v_max_gap_km,v_center_gap_km,v_invalid
    from distances;
  select ST_DistanceSphere(
    ST_MakePoint((v_coords->0->>1)::double precision,(v_coords->0->>0)::double precision),
    ST_MakePoint(0.060759,42.261356)),
    ST_DistanceSphere(
    ST_MakePoint((v_coords->(v_count-1)->>1)::double precision,
      (v_coords->(v_count-1)->>0)::double precision),
    ST_MakePoint(0.059389,42.282896)),
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
  if v_count<>197 or v_invalid>0
    or abs(v_length_km-3.065169)>0.015
    or v_max_gap_km>0.026 or v_center_gap_km>0.05
    or v_start_gap_m>2 or v_end_gap_m>2 or v_closing_gap_m<500
    or v_landmark_gap_m>10 then
    raise exception 'PR-HU 59 GPS validation failed: points %, length %, gap %, center %, start %, end %, closure %, landmarks %, invalid %',
      v_count,v_length_km,v_max_gap_km,v_center_gap_km,
      v_start_gap_m,v_end_gap_m,v_closing_gap_m,v_landmark_gap_m,v_invalid;
  end if;
  update public.hiking_route_tracks
    set status='ready',segments=jsonb_build_array(v_points),checked_at=now(),
      continuity_checked=true,geometry_source='FEDME - GPX oficial PR-HU 59',
      geometry_source_url='https://misendafedme.es/buscador-de-senderos/inc/downloadGpx.php?etapa=117665',official=true
    where route_id=v_route.id and status='missing';
  if not found then
    raise exception 'PR-HU 59 track state changed';
  end if;
  update public.hiking_routes
    set trace_available=true,published=true,
      distance_km=round(v_length_km::numeric,2),route_type='Lineal',
      official_url='https://misendafedme.es/buscador-de-senderos/etapa/pr-hu-59-almazorre-dolmen-',description='PR-HU 59 de Almazorre al dolmen Caseta de las Balanzas, pasando por el barranco Cañiminas, el antiguo horno de cal y las ruinas del castillo de La Zaba. El GPX oficial contiene el tramo lineal de ida: 3,07 km.'
    where id=v_route.id and not published and not trace_available;
  if not found then
    raise exception 'PR-HU 59 publication state changed';
  end if;
end
$curate$;
