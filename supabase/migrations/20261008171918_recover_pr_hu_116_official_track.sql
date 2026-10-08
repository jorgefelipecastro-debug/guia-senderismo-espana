-- Comarca de Ribagorza, PR-HU 116: Camporrells - Estopiñán.
-- Ficha oficial: https://turismoribagorza.org/ruta/pr-hu-116-camporrells-estopinan-masia-de-los-prats-pr-hu-45/
-- GPX oficial: https://turismoribagorza.org/wp-content/uploads/2025/06/44_pr_hu_116.gpx
-- SHA-256 del archivo original: a2971504892b8abf4a4a9ab300835dbeef00992869b4019035df0746ac4f0c32
-- Revisado el 2026-10-08: 416 puntos originales, un segmento continuo,
-- 10.153045 km, intervalo máximo 94.23 m.
-- Referencia, ubicación, extremos y recorrido contrastados con OSM.
-- Coordenadas originales conservadas sin remuestrear, unir ni cerrar trazados.
-- Distancia sobre el GPX; horarios y desniveles existentes se conservan.
-- La geometría OSM ya incluye la continuación hasta la masía de los Prats, aunque su nombre abreviado termina en Estopiñán. La ficha incluye regreso; el GPX es lineal.
do $curate$
declare
  v_coords jsonb := $coords$[[41.957993,0.52196],[41.957886,0.522109],[41.957667,0.522116],[41.957686,0.522299],[41.958137,0.5227],[41.958445,0.522938],[41.95856,0.523127],[41.958447,0.523405],[41.958496,0.52369],[41.958658,0.523957],[41.958768,0.524281],[41.958905,0.524504],[41.958864,0.5246],[41.958818,0.524645],[41.958763,0.524696],[41.958705,0.524756],[41.958627,0.525077],[41.958586,0.525608],[41.958544,0.526233],[41.958525,0.526415],[41.958657,0.526862],[41.958782,0.52716],[41.958825,0.527338],[41.958818,0.527543],[41.958722,0.527846],[41.958642,0.527922],[41.958502,0.528395],[41.95848,0.528692],[41.95853,0.529019],[41.958602,0.529235],[41.958643,0.529549],[41.958662,0.529885],[41.958695,0.530154],[41.958696,0.530467],[41.958756,0.5307],[41.958875,0.530944],[41.959002,0.531373],[41.959072,0.53159],[41.959189,0.531863],[41.959327,0.532115],[41.95951,0.532322],[41.959762,0.532573],[41.960106,0.533044],[41.960269,0.533287],[41.960406,0.533611],[41.960614,0.534254],[41.960954,0.535237],[41.960887,0.535521],[41.96071,0.536026],[41.96076,0.536504],[41.960882,0.536766],[41.961334,0.53773],[41.961762,0.53849],[41.961897,0.538715],[41.962285,0.539278],[41.962486,0.53957],[41.962716,0.539852],[41.963122,0.54059],[41.963428,0.540821],[41.963786,0.540932],[41.96417,0.541343],[41.964443,0.541291],[41.964724,0.541231],[41.965047,0.540845],[41.965203,0.540402],[41.965488,0.540138],[41.966054,0.539877],[41.966652,0.539513],[41.967016,0.539475],[41.96732,0.539432],[41.967604,0.53951],[41.967912,0.539465],[41.968289,0.539453],[41.968317,0.539377],[41.968324,0.539431],[41.968354,0.539427],[41.968694,0.539301],[41.969328,0.539076],[41.969497,0.539098],[41.969691,0.539126],[41.97,0.539253],[41.970311,0.539353],[41.970631,0.539188],[41.970835,0.539145],[41.971024,0.539167],[41.971143,0.539115],[41.971367,0.539391],[41.971404,0.539587],[41.971394,0.539891],[41.971418,0.540299],[41.971441,0.540697],[41.971678,0.54123],[41.971798,0.541298],[41.972248,0.541223],[41.972714,0.541224],[41.973047,0.54141],[41.973245,0.541872],[41.9737,0.542415],[41.973792,0.542698],[41.974068,0.54283],[41.97429,0.543033],[41.974463,0.543353],[41.97456,0.543675],[41.974544,0.543933],[41.974698,0.544161],[41.975099,0.544557],[41.975177,0.54463],[41.975593,0.54496],[41.975871,0.545279],[41.976087,0.545544],[41.976115,0.545597],[41.976287,0.545767],[41.976625,0.546349],[41.976887,0.546698],[41.977119,0.546986],[41.977401,0.547418],[41.977482,0.547662],[41.977606,0.547975],[41.977682,0.548011],[41.977751,0.548007],[41.977841,0.548029],[41.978111,0.548051],[41.978811,0.548215],[41.979196,0.548288],[41.979446,0.548435],[41.979736,0.548595],[41.979808,0.548639],[41.979788,0.548334],[41.979534,0.547824],[41.979744,0.547465],[41.9802,0.546662],[41.980247,0.546493],[41.980407,0.546461],[41.9809,0.546285],[41.981571,0.546248],[41.981806,0.546248],[41.982018,0.546425],[41.982326,0.546302],[41.982541,0.545982],[41.982821,0.545813],[41.983089,0.545629],[41.983324,0.545447],[41.983487,0.54533],[41.98364,0.545483],[41.983734,0.545521],[41.984386,0.545754],[41.984617,0.54654],[41.984907,0.546283],[41.985108,0.546021],[41.985518,0.545604],[41.985815,0.545241],[41.986437,0.544692],[41.986962,0.544363],[41.987235,0.544274],[41.987411,0.544275],[41.987557,0.544148],[41.987675,0.544107],[41.98781,0.544074],[41.987978,0.543988],[41.988252,0.543886],[41.988551,0.543801],[41.988815,0.543656],[41.989012,0.543309],[41.989703,0.543295],[41.99,0.543199],[41.990603,0.543271],[41.991052,0.543354],[41.991179,0.543174],[41.991409,0.542743],[41.991548,0.542427],[41.991754,0.541911],[41.992081,0.541516],[41.992196,0.54143],[41.992263,0.541325],[41.992325,0.541256],[41.992365,0.541226],[41.992385,0.541215],[41.992491,0.541241],[41.992602,0.541294],[41.992895,0.541418],[41.99304,0.541481],[41.99322,0.541629],[41.993484,0.541604],[41.993669,0.541602],[41.993809,0.541514],[41.99395,0.541499],[41.994282,0.541627],[41.994557,0.541782],[41.994642,0.541672],[41.994878,0.541031],[41.994994,0.541007],[41.995066,0.541116],[41.995105,0.541493],[41.995128,0.541721],[41.995342,0.541868],[41.995595,0.542108],[41.995694,0.54229],[41.995763,0.542474],[41.995962,0.54242],[41.996364,0.542521],[41.996733,0.542553],[41.997065,0.542645],[41.997148,0.542941],[41.99727,0.542953],[41.997834,0.542872],[41.99793,0.542878],[41.997991,0.542836],[41.998115,0.542792],[41.998304,0.54276],[41.9985,0.542697],[41.99883,0.542594],[41.999149,0.542515],[41.999462,0.542389],[41.999599,0.542306],[41.999732,0.542237],[41.999854,0.54213],[41.999994,0.542084],[42.000283,0.54214],[42.000441,0.542166],[42.000623,0.542103],[42.000808,0.542037],[42.001113,0.541961],[42.001531,0.541931],[42.001949,0.541794],[42.00231,0.541638],[42.002862,0.541452],[42.003073,0.541354],[42.003206,0.541262],[42.003462,0.541044],[42.003632,0.540924],[42.003757,0.540674],[42.00383,0.540473],[42.003856,0.540281],[42.003856,0.539998],[42.003849,0.539605],[42.003831,0.539073],[42.003853,0.5389],[42.003955,0.538875],[42.004094,0.538869],[42.00418,0.538894],[42.004283,0.538907],[42.00435,0.5389],[42.004537,0.538822],[42.004728,0.538729],[42.004872,0.538635],[42.005029,0.538514],[42.005251,0.538382],[42.005334,0.538324],[42.005407,0.538254],[42.005503,0.538194],[42.005597,0.538152],[42.005717,0.538126],[42.005841,0.538098],[42.005938,0.538063],[42.006031,0.538023],[42.006152,0.537922],[42.006471,0.537636],[42.006861,0.537289],[42.00707,0.537158],[42.00729,0.537031],[42.007457,0.536957],[42.007649,0.53687],[42.00774,0.536844],[42.007965,0.53681],[42.008073,0.536789],[42.008208,0.536754],[42.008328,0.536754],[42.008447,0.536745],[42.008564,0.536714],[42.008667,0.536666],[42.008812,0.536599],[42.008955,0.536604],[42.009036,0.536639],[42.009133,0.536657],[42.009213,0.536711],[42.009349,0.53683],[42.009431,0.536903],[42.009536,0.536935],[42.009659,0.536943],[42.009762,0.536939],[42.009847,0.536965],[42.009966,0.536999],[42.010078,0.536995],[42.010135,0.536957],[42.010185,0.53688],[42.010238,0.536754],[42.010302,0.536644],[42.010407,0.536568],[42.010556,0.536538],[42.010728,0.536462],[42.010834,0.53644],[42.010923,0.536484],[42.011019,0.536572],[42.01111,0.536635],[42.011171,0.536701],[42.011213,0.536752],[42.011285,0.536899],[42.011328,0.537014],[42.011349,0.537126],[42.011392,0.537194],[42.011465,0.537263],[42.01153,0.537367],[42.011541,0.537487],[42.011528,0.537667],[42.011526,0.53778],[42.011586,0.537913],[42.011675,0.538127],[42.011685,0.538225],[42.01171,0.538317],[42.011755,0.538373],[42.011817,0.538395],[42.011869,0.538375],[42.011958,0.53835],[42.012092,0.538339],[42.012174,0.538346],[42.012248,0.538379],[42.01236,0.538453],[42.012429,0.538522],[42.012511,0.538611],[42.012589,0.538659],[42.012687,0.538689],[42.012748,0.538698],[42.012822,0.538717],[42.0129,0.538751],[42.01297,0.53877],[42.01304,0.538764],[42.013088,0.538747],[42.013137,0.538707],[42.01323,0.53862],[42.013377,0.538488],[42.01348,0.538429],[42.013548,0.53843],[42.013686,0.538461],[42.013801,0.538481],[42.014051,0.538483],[42.0142,0.538477],[42.014274,0.538511],[42.014388,0.538572],[42.014542,0.538699],[42.01465,0.538762],[42.014765,0.538809],[42.014955,0.538861],[42.015193,0.538929],[42.015373,0.538966],[42.015532,0.539012],[42.015724,0.539072],[42.01589,0.53914],[42.016025,0.539217],[42.01615,0.539311],[42.016258,0.539406],[42.016329,0.539506],[42.016415,0.539632],[42.016495,0.539757],[42.016589,0.539862],[42.016655,0.539906],[42.016743,0.539923],[42.016839,0.53995],[42.01692,0.53998],[42.017004,0.540027],[42.017457,0.539991],[42.017699,0.539982],[42.017892,0.540034],[42.018113,0.540079],[42.018189,0.5401],[42.018379,0.540143],[42.018565,0.540192],[42.018674,0.540213],[42.018951,0.54022],[42.019171,0.540203],[42.019269,0.540231],[42.019352,0.540282],[42.019454,0.54038],[42.019591,0.540528],[42.019787,0.540691],[42.019864,0.540733],[42.020044,0.540746],[42.020204,0.540769],[42.020376,0.540813],[42.020565,0.540844],[42.020717,0.54087],[42.020837,0.540908],[42.020915,0.540942],[42.020959,0.540976],[42.021013,0.541017],[42.021099,0.541059],[42.021274,0.541147],[42.021349,0.541179],[42.021432,0.54124],[42.021564,0.541294],[42.021672,0.541355],[42.021776,0.54141],[42.021874,0.541454],[42.021946,0.541498],[42.02202,0.541557],[42.022067,0.541576],[42.022199,0.541592],[42.022322,0.541605],[42.022457,0.541595],[42.022605,0.541592],[42.022671,0.541601],[42.022755,0.54163],[42.022805,0.541664],[42.022854,0.541711],[42.022927,0.541781],[42.023044,0.541921],[42.023208,0.542077],[42.023314,0.54219],[42.023397,0.542301],[42.023448,0.542377],[42.023517,0.542454],[42.023599,0.542526],[42.023712,0.542598],[42.023874,0.542707],[42.023943,0.542774],[42.024016,0.542877],[42.0241,0.543042]]$coords$::jsonb;
  v_landmarks jsonb := $landmarks$[[41.996734,0.542553],[42.003851,0.538983],[41.998472,0.54268],[41.957994,0.52196]]$landmarks$::jsonb;
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
    where h.id='osm-relation-9694510'
      and h.source='openstreetmap' and h.source_type='relation'
      and h.external_id=9694510
      and h.name='Camporrells - Estopiñán'
      and h.route_ref='PR-HU 116' and h.raw_tags->>'ref'='PR-HU 116'
      and h.source_url='https://www.openstreetmap.org/relation/9694510'
      and (h.official_url is not distinct from null
        or h.official_url='https://turismoribagorza.org/ruta/pr-hu-116-camporrells-estopinan-masia-de-los-prats-pr-hu-45/')
      and h.region_code='huesca' and h.province='Huesca'
      and h.latitude=41.9907134 and h.longitude=0.5352522
      and exists (select 1 from public.hiking_route_regions r
        where r.route_id=h.id and r.region_code='huesca' and r.published)
    for update of h,t;
  if not found then
    raise exception 'PR-HU 116 route identity or published region changed';
  end if;
  if v_route.status='ready' then
    if v_route.geometry_source_url='https://turismoribagorza.org/wp-content/uploads/2025/06/44_pr_hu_116.gpx'
      and v_route.geometry_source='Comarca de Ribagorza - GPX oficial PR-HU 116'
      and v_route.segments=jsonb_build_array(v_points)
      and v_route.official and v_route.continuity_checked
      and v_route.checked_at is not null
      and v_route.published and v_route.trace_available
      and v_route.official_url='https://turismoribagorza.org/ruta/pr-hu-116-camporrells-estopinan-masia-de-los-prats-pr-hu-45/'
      and v_route.distance_km=10.15
      and v_route.route_type='Lineal'
      and v_route.duration_minutes is null
      and v_route.ascent_m is null
      and v_route.description='PR-HU 116 de Camporrells a Estopiñán y la masía de los Prats, donde enlaza con el PR-HU 45. El GPX oficial contiene la ida: 10,15 km. La ficha incluye el regreso a Camporrells, pero ese regreso no forma parte del archivo GPS.' then
      return;
    end if;
    raise exception 'PR-HU 116 route has another ready trace or publication state';
  end if;
  if v_route.status is distinct from 'missing'
    or v_route.published is distinct from false
    or v_route.trace_available is distinct from false
    or v_route.segments is not null or v_route.geometry_source_url is not null
    or v_route.geometry_source is distinct from 'OpenStreetMap'
    or v_route.official is distinct from false
    or v_route.continuity_checked is distinct from true
    or v_route.official_url is distinct from null
    or v_route.description is distinct from 'Camporrells (GR-23) - Estopiñán'
    or v_route.distance_km is distinct from 10
    or v_route.ascent_m is not null or v_route.duration_minutes is not null
    or v_route.route_type is distinct from null then
    raise exception 'PR-HU 116 hidden route state changed';
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
      (lat between 41.95 and 42.03 and lon between 0.52 and 0.55) valid
    from steps
  )
  select count(*),coalesce(sum(step_km),0),coalesce(max(step_km),0),
    coalesce(min(center_km),999),count(*) filter(where not valid)
    into v_count,v_length_km,v_max_gap_km,v_center_gap_km,v_invalid
    from distances;
  select ST_DistanceSphere(
    ST_MakePoint((v_coords->0->>1)::double precision,(v_coords->0->>0)::double precision),
    ST_MakePoint(0.52196,41.957993)),
    ST_DistanceSphere(
    ST_MakePoint((v_coords->(v_count-1)->>1)::double precision,
      (v_coords->(v_count-1)->>0)::double precision),
    ST_MakePoint(0.543042,42.0241)),
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
  if v_count<>416 or v_invalid>0
    or abs(v_length_km-10.153045)>0.015
    or v_max_gap_km>0.096 or v_center_gap_km>0.6
    or v_start_gap_m>2 or v_end_gap_m>2 or v_closing_gap_m<500
    or v_landmark_gap_m>10 then
    raise exception 'PR-HU 116 GPS validation failed: points %, length %, gap %, center %, start %, end %, closure %, landmarks %, invalid %',
      v_count,v_length_km,v_max_gap_km,v_center_gap_km,
      v_start_gap_m,v_end_gap_m,v_closing_gap_m,v_landmark_gap_m,v_invalid;
  end if;
  update public.hiking_route_tracks
    set status='ready',segments=jsonb_build_array(v_points),checked_at=now(),
      continuity_checked=true,geometry_source='Comarca de Ribagorza - GPX oficial PR-HU 116',
      geometry_source_url='https://turismoribagorza.org/wp-content/uploads/2025/06/44_pr_hu_116.gpx',official=true
    where route_id=v_route.id and status='missing';
  if not found then
    raise exception 'PR-HU 116 track state changed';
  end if;
  update public.hiking_routes
    set trace_available=true,published=true,
      distance_km=round(v_length_km::numeric,2),route_type='Lineal',
      official_url='https://turismoribagorza.org/ruta/pr-hu-116-camporrells-estopinan-masia-de-los-prats-pr-hu-45/',description='PR-HU 116 de Camporrells a Estopiñán y la masía de los Prats, donde enlaza con el PR-HU 45. El GPX oficial contiene la ida: 10,15 km. La ficha incluye el regreso a Camporrells, pero ese regreso no forma parte del archivo GPS.'
    where id=v_route.id and not published and not trace_available;
  if not found then
    raise exception 'PR-HU 116 publication state changed';
  end if;
end
$curate$;
