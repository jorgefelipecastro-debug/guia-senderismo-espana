-- Comarca de Ribagorza, PR-HU 27: Benasque – Cerler.
-- Ficha oficial: https://turismoribagorza.org/ruta/pr-hu-27-benasque-cerler-por-es-felegas/
-- GPX oficial: https://turismoribagorza.org/wp-content/uploads/2025/06/9_pr_hu_27.gpx
-- SHA-256 del archivo original: 072c5f22e5e5f30c4610a4e3506897ee0a00dfd195edbbb4a82138dbc7bdfbb8
-- Revisado el 2026-10-08: 297 puntos originales, un segmento continuo,
-- 4.746184 km, intervalo máximo 78.45 m.
-- Referencia, ubicación, extremos y puntos de paso contrastados con OSM.
-- Coordenadas originales conservadas sin remuestrear, unir ni cerrar trazados.
-- Distancia sobre el GPX; horarios y desniveles existentes se conservan.
-- La ficha incluye el regreso; el GPX solo contiene el tramo de ida.
do $curate$
declare
  v_coords jsonb := $coords$[[42.603182,0.523481],[42.602802,0.523407],[42.60255,0.523351],[42.602413,0.523322],[42.602334,0.523416],[42.602258,0.523474],[42.602144,0.523464],[42.602011,0.523464],[42.601897,0.523496],[42.601781,0.523604],[42.601652,0.523727],[42.601585,0.523791],[42.601514,0.52384],[42.601429,0.523876],[42.601373,0.523918],[42.60132,0.523971],[42.601248,0.524084],[42.601187,0.524167],[42.6011,0.524262],[42.600997,0.524353],[42.600887,0.52443],[42.600772,0.52447],[42.600628,0.524517],[42.600436,0.524589],[42.600287,0.524707],[42.600149,0.524872],[42.600063,0.524992],[42.599996,0.525216],[42.599927,0.525503],[42.599836,0.525799],[42.599675,0.526305],[42.599579,0.526723],[42.599514,0.526865],[42.599413,0.527012],[42.5993,0.527182],[42.599167,0.527355],[42.59902,0.527465],[42.598952,0.527497],[42.598873,0.527612],[42.598755,0.527675],[42.598663,0.527701],[42.598571,0.527778],[42.598477,0.527878],[42.598333,0.527963],[42.59812,0.528003],[42.597937,0.527966],[42.597811,0.527882],[42.597748,0.527797],[42.597649,0.527633],[42.597566,0.527569],[42.597478,0.527537],[42.597391,0.52753],[42.597297,0.527563],[42.597193,0.527692],[42.597102,0.527923],[42.597102,0.528178],[42.597102,0.528457],[42.597093,0.528633],[42.597026,0.528808],[42.596941,0.528937],[42.596815,0.529019],[42.59656,0.529043],[42.596359,0.529045],[42.596199,0.529036],[42.596085,0.528972],[42.595984,0.528827],[42.595877,0.528705],[42.595752,0.528657],[42.595534,0.528641],[42.595325,0.528637],[42.5952,0.528545],[42.595099,0.528356],[42.595036,0.528238],[42.594995,0.528177],[42.594941,0.528135],[42.594871,0.52813],[42.594786,0.528176],[42.594665,0.528265],[42.594587,0.528317],[42.594519,0.528325],[42.594449,0.528316],[42.594398,0.528263],[42.594361,0.528141],[42.59429,0.528002],[42.594157,0.527845],[42.594003,0.527746],[42.593919,0.527658],[42.593844,0.527535],[42.593701,0.527252],[42.593593,0.527032],[42.593481,0.526867],[42.593411,0.526787],[42.593335,0.526748],[42.593262,0.526686],[42.593198,0.526611],[42.59312,0.526552],[42.593053,0.52654],[42.592968,0.526576],[42.592954,0.526715],[42.592965,0.526824],[42.593021,0.52694],[42.593039,0.527128],[42.593047,0.527221],[42.593084,0.527355],[42.593118,0.527427],[42.593156,0.527495],[42.593162,0.527612],[42.593152,0.52777],[42.593129,0.527894],[42.593086,0.52804],[42.593064,0.52818],[42.593061,0.528314],[42.593054,0.528478],[42.593043,0.52859],[42.592997,0.528679],[42.592917,0.528727],[42.59288,0.528788],[42.59286,0.5289],[42.592876,0.529151],[42.592863,0.529283],[42.59272,0.529565],[42.592543,0.529751],[42.59215,0.530014],[42.591859,0.530142],[42.591656,0.530194],[42.591597,0.530265],[42.59155,0.530404],[42.591547,0.530578],[42.591607,0.530684],[42.591639,0.530786],[42.591584,0.530853],[42.5915,0.530949],[42.591416,0.531069],[42.591381,0.531153],[42.591383,0.531235],[42.591445,0.531324],[42.591515,0.531394],[42.59168,0.531508],[42.591822,0.531617],[42.592044,0.531663],[42.592148,0.53164],[42.592269,0.531598],[42.592359,0.531607],[42.592441,0.531678],[42.592569,0.531857],[42.592877,0.53206],[42.593035,0.532135],[42.593125,0.532128],[42.593201,0.532111],[42.593299,0.532079],[42.593389,0.532093],[42.593451,0.532153],[42.593588,0.532436],[42.59372,0.532676],[42.593914,0.532994],[42.594014,0.53309],[42.594079,0.533183],[42.594126,0.533313],[42.594197,0.533537],[42.594323,0.533868],[42.594391,0.534002],[42.594433,0.534155],[42.594462,0.534386],[42.594506,0.534726],[42.594575,0.534956],[42.594612,0.535147],[42.594598,0.535244],[42.594542,0.535358],[42.594446,0.535487],[42.594215,0.535655],[42.594126,0.535744],[42.594034,0.535893],[42.593997,0.535984],[42.593964,0.53619],[42.593951,0.53649],[42.593959,0.53689],[42.593955,0.537137],[42.593966,0.537455],[42.593964,0.537621],[42.593936,0.537776],[42.593894,0.537909],[42.593827,0.537942],[42.593687,0.537938],[42.593606,0.537993],[42.593655,0.538078],[42.593788,0.538114],[42.593655,0.538078],[42.593606,0.537993],[42.593687,0.537938],[42.593827,0.537942],[42.593894,0.537909],[42.593936,0.537776],[42.593964,0.537621],[42.593966,0.537455],[42.593955,0.537137],[42.593959,0.53689],[42.593951,0.53649],[42.593964,0.53619],[42.593997,0.535984],[42.594034,0.535893],[42.594126,0.535744],[42.594215,0.535655],[42.594446,0.535487],[42.594542,0.535358],[42.594598,0.535244],[42.594612,0.535147],[42.594575,0.534956],[42.594506,0.534726],[42.594462,0.534386],[42.594433,0.534155],[42.594391,0.534002],[42.594323,0.533868],[42.594197,0.533537],[42.594126,0.533313],[42.594079,0.533183],[42.594014,0.53309],[42.593914,0.532994],[42.59372,0.532676],[42.593588,0.532436],[42.593451,0.532153],[42.593389,0.532093],[42.593299,0.532079],[42.593201,0.532111],[42.593125,0.532128],[42.593035,0.532135],[42.592877,0.53206],[42.592569,0.531857],[42.592441,0.531678],[42.592359,0.531607],[42.592269,0.531598],[42.592148,0.53164],[42.592044,0.531663],[42.591822,0.531617],[42.59168,0.531508],[42.591515,0.531394],[42.591445,0.531324],[42.591349,0.531369],[42.591216,0.531434],[42.590898,0.531625],[42.590641,0.531741],[42.590458,0.53182],[42.590379,0.531866],[42.590335,0.531976],[42.590326,0.532188],[42.590299,0.532324],[42.590235,0.532483],[42.590141,0.532577],[42.590059,0.532667],[42.590012,0.532782],[42.589996,0.53291],[42.590013,0.533104],[42.590004,0.533276],[42.589979,0.533546],[42.589924,0.53376],[42.589832,0.533973],[42.58973,0.534191],[42.589595,0.534466],[42.589548,0.534581],[42.589524,0.534707],[42.589522,0.53496],[42.589516,0.535151],[42.589508,0.535512],[42.589512,0.535756],[42.589528,0.53596],[42.589562,0.536179],[42.589597,0.536382],[42.589592,0.536526],[42.589569,0.53667],[42.589481,0.537005],[42.5892,0.537884],[42.589111,0.538147],[42.589086,0.538334],[42.589077,0.538465],[42.58904,0.538765],[42.589026,0.538939],[42.589008,0.539081],[42.588999,0.53922],[42.589017,0.539401],[42.58903,0.539538],[42.589066,0.539707],[42.58907,0.539822],[42.589063,0.53996],[42.589035,0.540072],[42.588963,0.540235],[42.5889,0.540338],[42.588743,0.540502],[42.588554,0.540711],[42.588391,0.540847],[42.588283,0.540917],[42.58822,0.540992],[42.588242,0.541093],[42.588264,0.541241],[42.588339,0.54128],[42.588392,0.541274],[42.588445,0.541262],[42.588535,0.541268],[42.588712,0.541334]]$coords$::jsonb;
  v_landmarks jsonb := $landmarks$[[42.593862,0.537926],[42.603182,0.523481],[42.593788,0.538114],[42.588712,0.541334]]$landmarks$::jsonb;
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
    where h.id='osm-relation-9705378'
      and h.source='openstreetmap' and h.source_type='relation'
      and h.external_id=9705378
      and h.name='Benasque – Cerler'
      and h.route_ref='PR-HU 27' and h.raw_tags->>'ref'='PR-HU 27'
      and h.source_url='https://www.openstreetmap.org/relation/9705378'
      and (h.official_url is not distinct from null
        or h.official_url='https://turismoribagorza.org/ruta/pr-hu-27-benasque-cerler-por-es-felegas/')
      and h.region_code='huesca' and h.province='Huesca'
      and h.latitude=42.5956456 and h.longitude=0.5323262
      and exists (select 1 from public.hiking_route_regions r
        where r.route_id=h.id and r.region_code='huesca' and r.published)
    for update of h,t;
  if not found then
    raise exception 'PR-HU 27 route identity or published region changed';
  end if;
  if v_route.status='ready' then
    if v_route.geometry_source_url='https://turismoribagorza.org/wp-content/uploads/2025/06/9_pr_hu_27.gpx'
      and v_route.geometry_source='Comarca de Ribagorza - GPX oficial PR-HU 27'
      and v_route.segments=jsonb_build_array(v_points)
      and v_route.official and v_route.continuity_checked
      and v_route.checked_at is not null
      and v_route.published and v_route.trace_available
      and v_route.official_url='https://turismoribagorza.org/ruta/pr-hu-27-benasque-cerler-por-es-felegas/'
      and v_route.distance_km=4.75
      and v_route.route_type='Lineal'
      and v_route.duration_minutes is null
      and v_route.ascent_m is null
      and v_route.description='PR-HU 27 de Benasque a Cerler por el bosque de Es Felegás, con paso por el pueblo y el aparcamiento de la estación de esquí. El GPX oficial contiene la ida: 4,75 km. Los 9,84 km, 4 h 10 min y 630 m de subida de la ficha oficial corresponden a la ida y vuelta.' then
      return;
    end if;
    raise exception 'PR-HU 27 route has another ready trace or publication state';
  end if;
  if v_route.status is distinct from 'missing'
    or v_route.published is distinct from false
    or v_route.trace_available is distinct from false
    or v_route.segments is not null or v_route.geometry_source_url is not null
    or v_route.geometry_source is distinct from 'OpenStreetMap'
    or v_route.official is distinct from false
    or v_route.continuity_checked is distinct from true
    or v_route.official_url is distinct from null
    or v_route.description is distinct from 'Benasque – Cerler – regreso a Benasque'
    or v_route.distance_km is distinct from 5.000
    or v_route.ascent_m is not null or v_route.duration_minutes is not null
    or v_route.route_type is distinct from null then
    raise exception 'PR-HU 27 hidden route state changed';
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
      (lat between 42.58 and 42.61 and lon between 0.52 and 0.55) valid
    from steps
  )
  select count(*),coalesce(sum(step_km),0),coalesce(max(step_km),0),
    coalesce(min(center_km),999),count(*) filter(where not valid)
    into v_count,v_length_km,v_max_gap_km,v_center_gap_km,v_invalid
    from distances;
  select ST_DistanceSphere(
    ST_MakePoint((v_coords->0->>1)::double precision,(v_coords->0->>0)::double precision),
    ST_MakePoint(0.523481,42.603182)),
    ST_DistanceSphere(
    ST_MakePoint((v_coords->(v_count-1)->>1)::double precision,
      (v_coords->(v_count-1)->>0)::double precision),
    ST_MakePoint(0.541334,42.588712)),
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
  if v_count<>297 or v_invalid>0
    or abs(v_length_km-4.746184)>0.015
    or v_max_gap_km>0.081 or v_center_gap_km>0.25
    or v_start_gap_m>2 or v_end_gap_m>2 or v_closing_gap_m<500
    or v_landmark_gap_m>10 then
    raise exception 'PR-HU 27 GPS validation failed: points %, length %, gap %, center %, start %, end %, closure %, landmarks %, invalid %',
      v_count,v_length_km,v_max_gap_km,v_center_gap_km,
      v_start_gap_m,v_end_gap_m,v_closing_gap_m,v_landmark_gap_m,v_invalid;
  end if;
  update public.hiking_route_tracks
    set status='ready',segments=jsonb_build_array(v_points),checked_at=now(),
      continuity_checked=true,geometry_source='Comarca de Ribagorza - GPX oficial PR-HU 27',
      geometry_source_url='https://turismoribagorza.org/wp-content/uploads/2025/06/9_pr_hu_27.gpx',official=true
    where route_id=v_route.id and status='missing';
  if not found then
    raise exception 'PR-HU 27 track state changed';
  end if;
  update public.hiking_routes
    set trace_available=true,published=true,
      distance_km=round(v_length_km::numeric,2),route_type='Lineal',
      official_url='https://turismoribagorza.org/ruta/pr-hu-27-benasque-cerler-por-es-felegas/',description='PR-HU 27 de Benasque a Cerler por el bosque de Es Felegás, con paso por el pueblo y el aparcamiento de la estación de esquí. El GPX oficial contiene la ida: 4,75 km. Los 9,84 km, 4 h 10 min y 630 m de subida de la ficha oficial corresponden a la ida y vuelta.'
    where id=v_route.id and not published and not trace_available;
  if not found then
    raise exception 'PR-HU 27 publication state changed';
  end if;
end
$curate$;
