-- Comarca de Ribagorza, PR-HU 26 Benasque a Cerler. Fuente oficial: https://turismoribagorza.org/wp-content/uploads/2025/06/8_pr_hu_26.gpx
-- Revisado el 2026-10-03: 218 puntos, un segmento, 2.968 km, salto máximo 63 m.
-- La ficha turística ofrece 6.26 km ida y vuelta; su GPX representa solo la ida.
do $curate$
declare
  v_coords jsonb := $coords$[[42.606596,0.524524],[42.606566,0.524612],[42.606488,0.524713],[42.606436,0.524786],[42.606398,0.52491],[42.606318,0.525175],[42.606249,0.525404],[42.606186,0.525565],[42.606164,0.525688],[42.606237,0.52579],[42.606375,0.525886],[42.606511,0.525952],[42.606613,0.525905],[42.606693,0.525831],[42.606757,0.52581],[42.606824,0.525759],[42.606888,0.525691],[42.607094,0.525566],[42.607191,0.525532],[42.607254,0.525532],[42.607333,0.52553],[42.607444,0.525476],[42.607547,0.525484],[42.607597,0.525559],[42.607659,0.525681],[42.60773,0.525751],[42.607793,0.525829],[42.607807,0.525931],[42.607767,0.526001],[42.60765,0.525987],[42.607641,0.526065],[42.607648,0.526174],[42.607635,0.526255],[42.607592,0.526366],[42.607499,0.52648],[42.607376,0.526678],[42.607309,0.526809],[42.607246,0.526975],[42.607181,0.527173],[42.607129,0.527349],[42.607075,0.527486],[42.607054,0.527591],[42.607007,0.527796],[42.606972,0.527883],[42.606901,0.528047],[42.606848,0.528134],[42.60681,0.528223],[42.606758,0.528364],[42.60667,0.528516],[42.606588,0.528646],[42.606477,0.528828],[42.606357,0.528986],[42.606303,0.529045],[42.606253,0.529076],[42.606207,0.529143],[42.606176,0.529247],[42.606126,0.529359],[42.606083,0.529509],[42.606005,0.529733],[42.605972,0.529875],[42.605964,0.529975],[42.605962,0.530128],[42.605952,0.530209],[42.605919,0.530339],[42.605852,0.5305],[42.605767,0.530623],[42.605714,0.530704],[42.605727,0.5308],[42.605665,0.530852],[42.605657,0.530914],[42.605672,0.531014],[42.605647,0.531128],[42.605675,0.531212],[42.605688,0.531365],[42.605537,0.531297],[42.605562,0.531442],[42.605627,0.531552],[42.605682,0.531596],[42.60579,0.531605],[42.605858,0.531651],[42.605919,0.531697],[42.606051,0.531768],[42.606121,0.531866],[42.606015,0.53196],[42.605853,0.531999],[42.605787,0.532043],[42.605702,0.532143],[42.605601,0.532222],[42.605516,0.532256],[42.605449,0.532306],[42.60537,0.532417],[42.605308,0.532528],[42.605285,0.532611],[42.605292,0.532697],[42.605315,0.53281],[42.605367,0.532915],[42.605471,0.533044],[42.605595,0.533218],[42.605658,0.533331],[42.605681,0.533441],[42.605718,0.533501],[42.605724,0.53357],[42.605688,0.533631],[42.605592,0.533601],[42.605459,0.533525],[42.605358,0.533474],[42.605203,0.533449],[42.605092,0.53341],[42.604965,0.5334],[42.604778,0.533376],[42.60462,0.533397],[42.604442,0.533432],[42.604361,0.533445],[42.604132,0.533441],[42.60402,0.533427],[42.60395,0.533455],[42.603952,0.533532],[42.60404,0.533609],[42.604256,0.533749],[42.604337,0.53378],[42.604399,0.53382],[42.60447,0.533833],[42.604552,0.533852],[42.604625,0.533906],[42.604658,0.533981],[42.604675,0.534119],[42.604666,0.53423],[42.604657,0.534402],[42.604616,0.534506],[42.604573,0.534654],[42.604525,0.534706],[42.604417,0.5346],[42.604386,0.534733],[42.604444,0.534987],[42.604477,0.535071],[42.60443,0.535206],[42.604367,0.535405],[42.604334,0.535513],[42.604283,0.535597],[42.604238,0.535667],[42.60419,0.535798],[42.604181,0.535893],[42.604179,0.536053],[42.604155,0.536145],[42.6041,0.53625],[42.604065,0.536347],[42.604037,0.536425],[42.603987,0.536515],[42.603903,0.53659],[42.60379,0.53658],[42.60373,0.536621],[42.603669,0.536698],[42.603637,0.536795],[42.603634,0.536923],[42.603556,0.537014],[42.603541,0.537132],[42.603564,0.537225],[42.603555,0.537311],[42.60351,0.537335],[42.60347,0.537341],[42.603416,0.537359],[42.60334,0.537398],[42.603252,0.537442],[42.603152,0.537454],[42.602973,0.537409],[42.602829,0.53736],[42.602725,0.537334],[42.602647,0.537337],[42.602457,0.53737],[42.602176,0.537437],[42.601809,0.537554],[42.601556,0.537594],[42.601336,0.537598],[42.601252,0.537604],[42.601182,0.537637],[42.600968,0.537812],[42.600614,0.538104],[42.600467,0.538205],[42.600401,0.538241],[42.600322,0.538234],[42.600023,0.538199],[42.599884,0.538202],[42.599762,0.538225],[42.599683,0.538318],[42.599591,0.538461],[42.599514,0.538545],[42.599394,0.538568],[42.59927,0.538584],[42.59917,0.538543],[42.599134,0.538413],[42.599079,0.538311],[42.598975,0.538237],[42.598792,0.538152],[42.59866,0.538141],[42.59858,0.538099],[42.598437,0.538001],[42.598286,0.537936],[42.598186,0.537914],[42.598018,0.537912],[42.597845,0.537952],[42.597658,0.538037],[42.597482,0.538188],[42.597338,0.538309],[42.597207,0.53835],[42.596995,0.538357],[42.596776,0.538348],[42.596626,0.538301],[42.596082,0.538089],[42.59572,0.537921],[42.595651,0.53791],[42.59557,0.537906],[42.5954,0.537944],[42.595103,0.537997],[42.594821,0.538066],[42.594458,0.53814],[42.594182,0.538192],[42.593867,0.538204],[42.593813,0.538245]]$coords$::jsonb;
  v_route record;
  v_points jsonb;
  v_count integer;
  v_length_km double precision;
  v_max_gap_km double precision;
  v_center_gap_km double precision;
  v_invalid integer;
  v_start_gap_m double precision;
  v_end_gap_m double precision;
begin
  select h.id,h.latitude,h.longitude,t.status,t.geometry_source_url
    into v_route
    from public.hiking_routes h
    join public.hiking_route_tracks t on t.route_id=h.id
    where h.id='osm-relation-9699509'
      and h.source='openstreetmap'
      and h.name='Camino Benasque-Cerler'
      and h.raw_tags->>'ref'='PR-HU 26'
      and h.description='Benasque - Cerler (camino antiguo)'
      and h.official_url='http://senderos.turismoribagorza.org/descargas.php'
      and exists (select 1 from public.hiking_route_regions r
        where r.route_id=h.id and r.region_code='huesca' and r.published);
  if not found then
    raise exception 'PR-HU 26 route identity or published region changed';
  end if;
  if v_route.status='ready' then
    if v_route.geometry_source_url='https://turismoribagorza.org/wp-content/uploads/2025/06/8_pr_hu_26.gpx' then
      return;
    end if;
    raise exception 'PR-HU 26 route has another ready trace';
  end if;
  if v_route.status<>'missing' then
    raise exception 'PR-HU 26 status changed: %',v_route.status;
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
      (lat between 27 and 45 and lon between -19 and 5) valid
    from steps
  )
  select count(*),coalesce(sum(step_km),0),coalesce(max(step_km),0),
    coalesce(min(center_km),999),count(*) filter(where not valid)
    into v_count,v_length_km,v_max_gap_km,v_center_gap_km,v_invalid
    from distances;
  select ST_DistanceSphere(
    ST_MakePoint((v_coords->0->>1)::double precision,(v_coords->0->>0)::double precision),
    ST_MakePoint(0.524524,42.606596)),
    ST_DistanceSphere(
    ST_MakePoint((v_coords->(v_count-1)->>1)::double precision,
      (v_coords->(v_count-1)->>0)::double precision),
    ST_MakePoint(0.538245,42.593813))
    into v_start_gap_m,v_end_gap_m;
  if v_count<>218 or v_invalid>0
    or abs(v_length_km-2.968)>0.02
    or v_max_gap_km>0.065 or v_center_gap_km>0.5
    or v_start_gap_m>2 or v_end_gap_m>2 then
    raise exception 'PR-HU 26 GPS validation failed: points %, length %, gap %, center %, start %, end %, invalid %',
      v_count,v_length_km,v_max_gap_km,v_center_gap_km,
      v_start_gap_m,v_end_gap_m,v_invalid;
  end if;
  select jsonb_agg(jsonb_build_object(
    'lat',(point->>0)::double precision,
    'lon',(point->>1)::double precision
  ) order by ordinality)
    into v_points
    from jsonb_array_elements(v_coords)
      with ordinality as p(point,ordinality);
  insert into public.hiking_route_tracks
    (route_id,status,segments,checked_at,continuity_checked,
     geometry_source,geometry_source_url,official)
  values (
    v_route.id,'ready',jsonb_build_array(v_points),now(),true,
    'Comarca de Ribagorza - GPX oficial PR-HU 26',
    'https://turismoribagorza.org/wp-content/uploads/2025/06/8_pr_hu_26.gpx',true
  )
  on conflict(route_id) do update set
    status=excluded.status,segments=excluded.segments,
    checked_at=excluded.checked_at,continuity_checked=true,
    geometry_source=excluded.geometry_source,
    geometry_source_url=excluded.geometry_source_url,official=true;
  update public.hiking_routes
    set trace_available=true,published=true,
      distance_km=round(v_length_km::numeric,2),route_type='Lineal',
      official_url='https://turismoribagorza.org/ruta/pr-hu-26-camino-antiguo-de-benasque-a-cerler/',
      description='PR-HU 26 por el camino antiguo de Benasque a Cerler. El trazado GPS de ida mide 2,97 km; el regreso puede hacerse por el mismo camino. La ficha turística indica 6,26 km para la ida y vuelta.'
    where id=v_route.id and not published and not trace_available;
  if not found then
    raise exception 'PR-HU 26 publication state changed';
  end if;
end
$curate$;
