-- Comarca de Ribagorza, PR-HU 33: Sendero Praus de Cases.
-- Ficha oficial: https://turismoribagorza.org/ruta/pr-hu-33-eriste-cerler/
-- GPX oficial: https://turismoribagorza.org/wp-content/uploads/2025/06/14_pr_hu_33.gpx
-- SHA-256 del archivo original: e1bbdcb3dc4bdaa0c90f951ee474a8b668c1978ca256bc0b176a959ce5c7462b
-- Revisado el 2026-10-08: 340 puntos originales, un segmento continuo,
-- 5.012208 km, intervalo máximo 51.73 m.
-- Referencia, ubicación, extremos y puntos de paso contrastados con OSM.
-- Coordenadas originales conservadas sin remuestrear, unir ni cerrar trazados.
-- Distancia sobre el GPX; horarios y desniveles existentes se conservan.
-- La ficha incluye el regreso; el GPX solo contiene el tramo de ida.
do $curate$
declare
  v_coords jsonb := $coords$[[42.587256,0.490746],[42.5872,0.49096],[42.587193,0.491044],[42.587326,0.491172],[42.587522,0.491293],[42.587627,0.491352],[42.587683,0.491382],[42.587835,0.491463],[42.587895,0.491497],[42.588036,0.49158],[42.588064,0.491715],[42.588026,0.491785],[42.587981,0.491865],[42.587902,0.491978],[42.587812,0.49213],[42.587768,0.492207],[42.587734,0.492267],[42.587764,0.492313],[42.587843,0.492457],[42.587929,0.492617],[42.588035,0.49283],[42.588131,0.493049],[42.588202,0.493246],[42.588219,0.493387],[42.5882,0.493479],[42.588149,0.493567],[42.588163,0.49368],[42.588214,0.49393],[42.588278,0.49419],[42.588398,0.494552],[42.588488,0.494637],[42.58851,0.494724],[42.588514,0.494889],[42.588503,0.495076],[42.588472,0.495146],[42.588415,0.495211],[42.588361,0.495396],[42.588327,0.495493],[42.588272,0.495568],[42.58819,0.495658],[42.588143,0.495808],[42.588116,0.495944],[42.588069,0.496082],[42.588035,0.496352],[42.588005,0.496585],[42.587958,0.49683],[42.587909,0.497057],[42.587899,0.497212],[42.588023,0.497344],[42.588221,0.497572],[42.588301,0.497698],[42.588369,0.497816],[42.588424,0.497993],[42.588478,0.498269],[42.588564,0.498469],[42.588634,0.498669],[42.588681,0.498858],[42.588705,0.499039],[42.588695,0.499188],[42.588637,0.499383],[42.588621,0.499523],[42.588628,0.499695],[42.588662,0.499893],[42.588727,0.500079],[42.588773,0.500346],[42.588782,0.500759],[42.588781,0.501213],[42.58876,0.501499],[42.588753,0.501657],[42.588786,0.501902],[42.588853,0.502313],[42.588888,0.502783],[42.588917,0.50324],[42.588926,0.503588],[42.588935,0.503926],[42.588985,0.504098],[42.589188,0.504448],[42.589342,0.50473],[42.589397,0.504901],[42.589431,0.505218],[42.589476,0.505462],[42.589516,0.505629],[42.589524,0.505765],[42.589508,0.505895],[42.589481,0.506055],[42.589491,0.506294],[42.58952,0.506507],[42.589519,0.506598],[42.589489,0.506678],[42.589437,0.506809],[42.589354,0.506995],[42.589392,0.507092],[42.589436,0.507186],[42.589488,0.507298],[42.589557,0.507406],[42.58966,0.507621],[42.589684,0.507684],[42.58971,0.507772],[42.589751,0.507902],[42.58983,0.508076],[42.589897,0.508152],[42.589965,0.508264],[42.590014,0.508342],[42.590068,0.508463],[42.590133,0.508632],[42.590183,0.508804],[42.590247,0.508971],[42.590356,0.509004],[42.590452,0.509044],[42.590567,0.509125],[42.590668,0.509258],[42.590698,0.509333],[42.590693,0.509418],[42.590668,0.509505],[42.590658,0.509648],[42.590699,0.509721],[42.5907,0.509804],[42.590683,0.509904],[42.590621,0.510039],[42.590594,0.510165],[42.590717,0.510367],[42.590829,0.510526],[42.590912,0.51044],[42.590978,0.510448],[42.591025,0.510539],[42.59097,0.510662],[42.590903,0.51076],[42.590902,0.510868],[42.590969,0.511123],[42.59108,0.511284],[42.591157,0.511373],[42.591221,0.511505],[42.591235,0.511621],[42.591207,0.511722],[42.591164,0.511795],[42.591126,0.511836],[42.591042,0.511934],[42.590942,0.512094],[42.590839,0.51229],[42.590726,0.512426],[42.590652,0.512621],[42.59058,0.512739],[42.59054,0.512793],[42.590479,0.512864],[42.590424,0.512926],[42.590373,0.512965],[42.590215,0.512954],[42.590105,0.512966],[42.58996,0.513041],[42.589879,0.513097],[42.589789,0.513131],[42.589733,0.513166],[42.589653,0.513263],[42.589573,0.513336],[42.589485,0.513436],[42.589442,0.513495],[42.589407,0.513559],[42.589348,0.513681],[42.589314,0.513788],[42.589292,0.513888],[42.589302,0.514],[42.589317,0.514111],[42.589244,0.514184],[42.589219,0.514287],[42.589254,0.514479],[42.589283,0.514628],[42.589308,0.514716],[42.589358,0.514831],[42.589387,0.514933],[42.589401,0.515031],[42.589364,0.515204],[42.589317,0.515348],[42.589292,0.515477],[42.589283,0.515559],[42.589278,0.515664],[42.589276,0.515789],[42.589279,0.515892],[42.58929,0.516109],[42.589307,0.516261],[42.589322,0.51638],[42.589335,0.516525],[42.58934,0.51666],[42.589338,0.516822],[42.589332,0.516922],[42.589323,0.51699],[42.589299,0.517108],[42.58928,0.517177],[42.589214,0.517365],[42.589135,0.517611],[42.589066,0.517779],[42.589037,0.517927],[42.589012,0.518025],[42.589021,0.518154],[42.58905,0.518426],[42.589117,0.518625],[42.589234,0.518838],[42.58942,0.519078],[42.589548,0.519263],[42.589562,0.519384],[42.589512,0.519526],[42.589479,0.519732],[42.589461,0.519965],[42.589439,0.520193],[42.589402,0.52036],[42.589321,0.520507],[42.589241,0.520715],[42.589149,0.520951],[42.589035,0.521206],[42.588944,0.521353],[42.588775,0.521559],[42.588642,0.521631],[42.588508,0.521787],[42.588337,0.522007],[42.588204,0.522387],[42.588091,0.523],[42.588006,0.523453],[42.587932,0.523933],[42.587877,0.524131],[42.587827,0.524264],[42.587738,0.524305],[42.587638,0.524409],[42.587535,0.524606],[42.587483,0.524833],[42.58747,0.525167],[42.5874,0.525425],[42.587323,0.525486],[42.5872,0.525553],[42.587108,0.525766],[42.587103,0.525967],[42.587052,0.526159],[42.586986,0.526246],[42.586974,0.526432],[42.587083,0.526481],[42.587172,0.526666],[42.587185,0.526988],[42.587194,0.527298],[42.58719,0.52764],[42.58719,0.527897],[42.587137,0.528071],[42.587022,0.528179],[42.586928,0.528289],[42.586903,0.528397],[42.586876,0.528619],[42.586846,0.528758],[42.586787,0.528849],[42.586751,0.528924],[42.586714,0.529036],[42.586645,0.529117],[42.586572,0.529172],[42.586488,0.529274],[42.586454,0.529389],[42.586461,0.529499],[42.586453,0.529604],[42.586414,0.529706],[42.586393,0.529875],[42.586399,0.529996],[42.586348,0.530085],[42.586298,0.530176],[42.586262,0.530325],[42.586262,0.53046],[42.586295,0.530554],[42.586366,0.530625],[42.586385,0.530729],[42.586379,0.530819],[42.586363,0.530993],[42.586331,0.531098],[42.586266,0.531216],[42.586193,0.53129],[42.586137,0.531406],[42.586038,0.531443],[42.58596,0.531518],[42.585883,0.53165],[42.585855,0.531785],[42.58585,0.531924],[42.585793,0.532057],[42.585735,0.532176],[42.585682,0.532303],[42.585674,0.532431],[42.5856,0.532551],[42.585518,0.532677],[42.585505,0.532815],[42.585585,0.533029],[42.585699,0.533199],[42.585794,0.533338],[42.585875,0.533538],[42.585924,0.533714],[42.586023,0.533844],[42.586174,0.533909],[42.586335,0.533982],[42.586459,0.534122],[42.586591,0.534329],[42.586643,0.534503],[42.586667,0.53463],[42.586773,0.534817],[42.586857,0.535042],[42.586951,0.535111],[42.586975,0.535199],[42.587013,0.535384],[42.587143,0.535535],[42.587191,0.535676],[42.587223,0.53586],[42.587257,0.536078],[42.587261,0.536252],[42.587256,0.536495],[42.587214,0.536752],[42.587126,0.537002],[42.587041,0.537069],[42.587021,0.537172],[42.587044,0.537328],[42.586986,0.537442],[42.586957,0.537551],[42.586958,0.537719],[42.586979,0.537868],[42.586965,0.537972],[42.586912,0.538145],[42.586877,0.538399],[42.58688,0.538708],[42.586916,0.538974],[42.586996,0.539237],[42.587098,0.539377],[42.587207,0.539679],[42.587296,0.53994],[42.587406,0.540243],[42.587504,0.540469],[42.587598,0.540426],[42.587689,0.54038],[42.587756,0.54051],[42.587807,0.5406],[42.587911,0.540676],[42.588052,0.540692],[42.588128,0.540756],[42.58822,0.540992],[42.588242,0.541093],[42.588264,0.541241],[42.588339,0.54128],[42.588392,0.541274],[42.588445,0.541262],[42.588535,0.541268],[42.588712,0.541334],[42.588765,0.541407]]$coords$::jsonb;
  v_landmarks jsonb := $landmarks$[[42.587326,0.491172],[42.58805,0.491742],[42.588064,0.491715],[42.58804,0.491771],[42.590713,0.50936],[42.590698,0.509333],[42.587256,0.490746],[42.590356,0.509004],[42.588036,0.49158],[42.588765,0.541407],[42.588712,0.541334],[42.587725,0.492258]]$landmarks$::jsonb;
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
    where h.id='osm-relation-9709561'
      and h.source='openstreetmap' and h.source_type='relation'
      and h.external_id=9709561
      and h.name='Sendero Praus de Cases'
      and h.route_ref='PR-HU 33' and h.raw_tags->>'ref'='PR-HU 33'
      and h.source_url='https://www.openstreetmap.org/relation/9709561'
      and (h.official_url is not distinct from null
        or h.official_url='https://turismoribagorza.org/ruta/pr-hu-33-eriste-cerler/')
      and h.region_code='huesca' and h.province='Huesca'
      and h.latitude=42.5883355 and h.longitude=0.5162321
      and exists (select 1 from public.hiking_route_regions r
        where r.route_id=h.id and r.region_code='huesca' and r.published)
    for update of h,t;
  if not found then
    raise exception 'PR-HU 33 route identity or published region changed';
  end if;
  if v_route.status='ready' then
    if v_route.geometry_source_url='https://turismoribagorza.org/wp-content/uploads/2025/06/14_pr_hu_33.gpx'
      and v_route.geometry_source='Comarca de Ribagorza - GPX oficial PR-HU 33'
      and v_route.segments=jsonb_build_array(v_points)
      and v_route.official and v_route.continuity_checked
      and v_route.checked_at is not null
      and v_route.published and v_route.trace_available
      and v_route.official_url='https://turismoribagorza.org/ruta/pr-hu-33-eriste-cerler/'
      and v_route.distance_km=5.01
      and v_route.route_type='Lineal'
      and v_route.duration_minutes is null
      and v_route.ascent_m is null
      and v_route.description='PR-HU 33 de Eriste a Cerler por Linsoles y Anciles, hasta el aparcamiento de la estación de esquí. El GPX oficial contiene la ida: 5,01 km. El regreso se realiza por el mismo camino. Los 10,27 km, 3 h 40 min y 450 m de subida de la ficha corresponden a la ida y vuelta.' then
      return;
    end if;
    raise exception 'PR-HU 33 route has another ready trace or publication state';
  end if;
  if v_route.status is distinct from 'missing'
    or v_route.published is distinct from false
    or v_route.trace_available is distinct from false
    or v_route.segments is not null or v_route.geometry_source_url is not null
    or v_route.geometry_source is distinct from 'OpenStreetMap'
    or v_route.official is distinct from false
    or v_route.continuity_checked is distinct from true
    or v_route.official_url is distinct from null
    or v_route.description is distinct from 'Eriste – Anciles – Cerler'
    or v_route.distance_km is distinct from 5.000
    or v_route.ascent_m is not null or v_route.duration_minutes is not null
    or v_route.route_type is distinct from null then
    raise exception 'PR-HU 33 hidden route state changed';
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
      (lat between 42.58 and 42.6 and lon between 0.48 and 0.55) valid
    from steps
  )
  select count(*),coalesce(sum(step_km),0),coalesce(max(step_km),0),
    coalesce(min(center_km),999),count(*) filter(where not valid)
    into v_count,v_length_km,v_max_gap_km,v_center_gap_km,v_invalid
    from distances;
  select ST_DistanceSphere(
    ST_MakePoint((v_coords->0->>1)::double precision,(v_coords->0->>0)::double precision),
    ST_MakePoint(0.490746,42.587256)),
    ST_DistanceSphere(
    ST_MakePoint((v_coords->(v_count-1)->>1)::double precision,
      (v_coords->(v_count-1)->>0)::double precision),
    ST_MakePoint(0.541407,42.588765)),
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
  if v_count<>340 or v_invalid>0
    or abs(v_length_km-5.012208)>0.015
    or v_max_gap_km>0.056 or v_center_gap_km>0.15
    or v_start_gap_m>2 or v_end_gap_m>2 or v_closing_gap_m<500
    or v_landmark_gap_m>10 then
    raise exception 'PR-HU 33 GPS validation failed: points %, length %, gap %, center %, start %, end %, closure %, landmarks %, invalid %',
      v_count,v_length_km,v_max_gap_km,v_center_gap_km,
      v_start_gap_m,v_end_gap_m,v_closing_gap_m,v_landmark_gap_m,v_invalid;
  end if;
  update public.hiking_route_tracks
    set status='ready',segments=jsonb_build_array(v_points),checked_at=now(),
      continuity_checked=true,geometry_source='Comarca de Ribagorza - GPX oficial PR-HU 33',
      geometry_source_url='https://turismoribagorza.org/wp-content/uploads/2025/06/14_pr_hu_33.gpx',official=true
    where route_id=v_route.id and status='missing';
  if not found then
    raise exception 'PR-HU 33 track state changed';
  end if;
  update public.hiking_routes
    set trace_available=true,published=true,
      distance_km=round(v_length_km::numeric,2),route_type='Lineal',
      official_url='https://turismoribagorza.org/ruta/pr-hu-33-eriste-cerler/',description='PR-HU 33 de Eriste a Cerler por Linsoles y Anciles, hasta el aparcamiento de la estación de esquí. El GPX oficial contiene la ida: 5,01 km. El regreso se realiza por el mismo camino. Los 10,27 km, 3 h 40 min y 450 m de subida de la ficha corresponden a la ida y vuelta.'
    where id=v_route.id and not published and not trace_available;
  if not found then
    raise exception 'PR-HU 33 publication state changed';
  end if;
end
$curate$;
