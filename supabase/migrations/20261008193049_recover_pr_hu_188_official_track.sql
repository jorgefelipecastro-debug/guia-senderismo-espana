-- FEDME, PR-HU 188: Puente del Hospital - Puerto de Plan.
-- Ficha oficial: https://misendafedme.es/buscador-de-senderos/etapa/pr-hu-188-subida-al-puerto-de-plan
-- GPX oficial: https://misendafedme.es/buscador-de-senderos/inc/downloadGpx.php?etapa=117347
-- SHA-256 del archivo original: 1122e5918f5b327905f27199c4eb60bfbf1dbcf8d2491fdfc5a8786f1a6539ee
-- Revisado el 2026-10-08: 444 puntos originales, un segmento continuo,
-- 6.881072 km, intervalo máximo 24.95 m.
-- Referencia, ubicación, extremos y recorrido contrastados con OSM.
-- Coordenadas originales conservadas sin remuestrear, unir ni cerrar trazados.
-- Distancia sobre el GPX; horarios y desniveles existentes se conservan.
-- Se conserva el GPX oficial completo hasta el puerto. OSM presenta una discontinuidad de unos 54 m y un extremo desplazado 114 m respecto al final oficial; no se interpolan esos puntos ni se incorpora otro ramal.
do $curate$
declare
  v_coords jsonb := $coords$[[42.646587,0.346363],[42.646699,0.346422],[42.646708,0.346414],[42.646821,0.346313],[42.646816,0.346082],[42.646933,0.345882],[42.647084,0.345857],[42.647212,0.345803],[42.6473,0.345722],[42.647322,0.345702],[42.647173,0.345547],[42.647076,0.345422],[42.647085,0.34523],[42.647139,0.345121],[42.64716,0.345079],[42.647282,0.344984],[42.647384,0.344927],[42.647476,0.344872],[42.647502,0.344697],[42.64741,0.344589],[42.64731,0.344539],[42.647327,0.344364],[42.64746,0.344289],[42.647543,0.344222],[42.647581,0.344068],[42.647543,0.343864],[42.64763,0.34371],[42.647725,0.343662],[42.647876,0.343606],[42.64796,0.343539],[42.648004,0.343361],[42.648077,0.343219],[42.648143,0.343006],[42.648187,0.342856],[42.64836,0.342856],[42.648484,0.342754],[42.648595,0.342811],[42.648697,0.342828],[42.648846,0.342742],[42.648974,0.342865],[42.649087,0.342896],[42.64926,0.342906],[42.649365,0.342905],[42.64949,0.342904],[42.649631,0.342848],[42.649689,0.342649],[42.649589,0.342548],[42.649502,0.342268],[42.649514,0.341994],[42.649602,0.341868],[42.649673,0.341718],[42.649771,0.341631],[42.649904,0.341389],[42.649944,0.341217],[42.650046,0.341112],[42.650189,0.340948],[42.650302,0.340941],[42.650415,0.340934],[42.650604,0.340857],[42.650774,0.34072],[42.65087,0.340666],[42.650947,0.340484],[42.651033,0.340418],[42.65113,0.34041],[42.651251,0.340455],[42.651396,0.3404],[42.651533,0.340298],[42.65169,0.340209],[42.651805,0.340025],[42.65193,0.339963],[42.652085,0.339921],[42.652229,0.339821],[42.652319,0.339884],[42.652426,0.339917],[42.652571,0.340057],[42.652707,0.340089],[42.652851,0.339952],[42.652948,0.339893],[42.653062,0.339809],[42.653181,0.339694],[42.653244,0.339551],[42.653344,0.33943],[42.653414,0.33936],[42.653499,0.33923],[42.653584,0.33911],[42.653654,0.33904],[42.653724,0.33898],[42.653814,0.33894],[42.653929,0.338865],[42.654034,0.33877],[42.654064,0.338635],[42.654154,0.33846],[42.65422,0.338336],[42.654224,0.33822],[42.654241,0.338063],[42.654304,0.337921],[42.654345,0.337825],[42.654342,0.337702],[42.654259,0.337587],[42.654355,0.337506],[42.654437,0.337467],[42.654502,0.3374],[42.654448,0.337226],[42.654486,0.337017],[42.654582,0.336922],[42.654714,0.336825],[42.654873,0.336703],[42.655015,0.33681],[42.655134,0.33674],[42.655249,0.3367],[42.655364,0.33667],[42.655444,0.33663],[42.655504,0.33654],[42.655554,0.33644],[42.655584,0.33632],[42.655634,0.336221],[42.655674,0.336121],[42.655734,0.336031],[42.655774,0.335921],[42.655784,0.33581],[42.655779,0.335678],[42.65586,0.335596],[42.655997,0.335443],[42.656086,0.335309],[42.656174,0.335175],[42.656261,0.335074],[42.656347,0.334973],[42.656433,0.334837],[42.656486,0.334612],[42.65655,0.334428],[42.656683,0.334273],[42.656735,0.334032],[42.656795,0.333864],[42.656881,0.333745],[42.65694,0.333606],[42.656999,0.333467],[42.657101,0.333323],[42.657235,0.333377],[42.657431,0.333269],[42.65751,0.333432],[42.657676,0.333456],[42.657728,0.333297],[42.657901,0.333236],[42.657813,0.333447],[42.65787,0.333646],[42.658079,0.333535],[42.658206,0.333381],[42.658379,0.333349],[42.658526,0.333291],[42.658698,0.333327],[42.658782,0.333412],[42.65889,0.333473],[42.658959,0.333641],[42.65899,0.333912],[42.659038,0.334177],[42.659127,0.334373],[42.659277,0.334564],[42.659426,0.3347],[42.659553,0.334863],[42.65963,0.334957],[42.659717,0.335088],[42.659858,0.335075],[42.659921,0.334964],[42.659958,0.334752],[42.660006,0.334623],[42.660125,0.334453],[42.660283,0.334326],[42.660426,0.334242],[42.660453,0.334373],[42.660572,0.334325],[42.660663,0.334266],[42.660751,0.33414],[42.660839,0.334014],[42.660926,0.33376],[42.660997,0.333673],[42.661152,0.33352],[42.661269,0.333464],[42.661386,0.333408],[42.661472,0.333198],[42.661461,0.332985],[42.66148,0.332682],[42.661601,0.332623],[42.661673,0.332732],[42.661792,0.332762],[42.661976,0.332856],[42.662112,0.33294],[42.662212,0.332954],[42.662375,0.333039],[42.662478,0.33307],[42.662599,0.333082],[42.66272,0.333094],[42.662865,0.333141],[42.66301,0.333206],[42.663108,0.333249],[42.663317,0.33334],[42.663435,0.333357],[42.663552,0.333373],[42.663745,0.333399],[42.663888,0.333385],[42.664019,0.333371],[42.664222,0.333375],[42.664348,0.333339],[42.664485,0.333321],[42.664625,0.333323],[42.664767,0.333377],[42.664899,0.333457],[42.665036,0.333538],[42.6652,0.333609],[42.665333,0.333674],[42.665396,0.333786],[42.665494,0.333883],[42.66561,0.333956],[42.66571,0.334006],[42.665832,0.334056],[42.665983,0.334061],[42.666144,0.334076],[42.666338,0.334149],[42.666462,0.334167],[42.666524,0.334058],[42.666641,0.333982],[42.666773,0.333984],[42.66689,0.334053],[42.666977,0.334107],[42.667118,0.333959],[42.667271,0.333982],[42.667354,0.334251],[42.667486,0.334206],[42.667551,0.334376],[42.667695,0.334238],[42.667798,0.334127],[42.667901,0.334017],[42.668078,0.334041],[42.66826,0.333964],[42.668403,0.333887],[42.668425,0.333753],[42.668284,0.333581],[42.668161,0.333393],[42.668062,0.333303],[42.667962,0.333214],[42.667825,0.333122],[42.667759,0.333018],[42.667621,0.332903],[42.667498,0.332771],[42.667491,0.332623],[42.667555,0.332387],[42.667558,0.332232],[42.66756,0.332078],[42.667502,0.331932],[42.667444,0.331787],[42.667376,0.331556],[42.667392,0.331389],[42.667444,0.331223],[42.667436,0.331024],[42.667493,0.330873],[42.667594,0.33087],[42.667678,0.330939],[42.66781,0.330873],[42.667871,0.330645],[42.667912,0.330492],[42.667953,0.33034],[42.668066,0.330338],[42.668179,0.330337],[42.668318,0.330281],[42.668505,0.330229],[42.668643,0.330207],[42.668776,0.33014],[42.668938,0.330045],[42.669081,0.329989],[42.669246,0.329923],[42.669417,0.329967],[42.669562,0.33001],[42.669683,0.329974],[42.669744,0.329871],[42.669837,0.329798],[42.669951,0.329724],[42.670076,0.329649],[42.6702,0.329575],[42.670348,0.329538],[42.67047,0.32942],[42.670509,0.329274],[42.67051,0.329124],[42.67061,0.328974],[42.670709,0.328825],[42.670865,0.328609],[42.67098,0.328489],[42.671045,0.328268],[42.671099,0.328128],[42.671153,0.327989],[42.671176,0.327808],[42.671286,0.327547],[42.671384,0.327461],[42.671482,0.327375],[42.671577,0.327254],[42.671661,0.327109],[42.671744,0.326964],[42.671878,0.32688],[42.67198,0.326838],[42.672118,0.326797],[42.672285,0.326756],[42.67242,0.32658],[42.672429,0.32639],[42.672311,0.326206],[42.672223,0.326149],[42.672061,0.326023],[42.671952,0.325898],[42.671843,0.32579],[42.671743,0.325754],[42.671587,0.325645],[42.671492,0.32557],[42.671343,0.325559],[42.671231,0.325483],[42.67112,0.325407],[42.671102,0.325166],[42.671115,0.324973],[42.671047,0.324846],[42.670991,0.324717],[42.670941,0.3246],[42.670892,0.32446],[42.670794,0.324244],[42.67076,0.324121],[42.670744,0.323991],[42.670693,0.323876],[42.670679,0.323736],[42.670712,0.323488],[42.670769,0.323322],[42.670826,0.323134],[42.670941,0.322943],[42.67105,0.322699],[42.671158,0.322521],[42.671263,0.322472],[42.671444,0.322404],[42.671548,0.322406],[42.67171,0.322307],[42.671883,0.32217],[42.672088,0.322064],[42.672222,0.321979],[42.672375,0.321855],[42.672561,0.321824],[42.672683,0.321824],[42.672805,0.321824],[42.672911,0.321756],[42.6731,0.321605],[42.673208,0.321491],[42.673325,0.321403],[42.673461,0.32131],[42.673599,0.321191],[42.67368,0.321085],[42.673819,0.321062],[42.673916,0.321007],[42.674048,0.32096],[42.674179,0.320913],[42.674294,0.320878],[42.674409,0.320843],[42.674532,0.320795],[42.674654,0.320747],[42.674809,0.320681],[42.675029,0.320671],[42.675129,0.320644],[42.675271,0.32053],[42.675404,0.320448],[42.675522,0.32037],[42.675639,0.320292],[42.675754,0.320131],[42.675908,0.319989],[42.676092,0.319847],[42.676215,0.319748],[42.676337,0.319649],[42.676428,0.31956],[42.676615,0.319454],[42.676802,0.319348],[42.67694,0.319241],[42.677077,0.319106],[42.677209,0.31894],[42.67731,0.318854],[42.67741,0.318768],[42.677545,0.318672],[42.677727,0.318591],[42.67785,0.318507],[42.678038,0.318468],[42.67822,0.318463],[42.678378,0.318364],[42.678565,0.318224],[42.678676,0.318189],[42.678762,0.318121],[42.678861,0.318002],[42.67901,0.317936],[42.679067,0.317751],[42.67903,0.317586],[42.678993,0.317451],[42.678963,0.317219],[42.678927,0.317024],[42.67886,0.316837],[42.678836,0.316651],[42.678828,0.316454],[42.678846,0.316316],[42.678869,0.316131],[42.678929,0.315913],[42.679044,0.315806],[42.679077,0.315673],[42.679129,0.315496],[42.679162,0.315308],[42.679208,0.315126],[42.679245,0.314882],[42.679194,0.314705],[42.679153,0.314525],[42.679127,0.314355],[42.679127,0.314186],[42.679146,0.313986],[42.679301,0.313983],[42.679359,0.313871],[42.679395,0.313725],[42.67951,0.313689],[42.679635,0.313586],[42.679798,0.313615],[42.679915,0.313672],[42.68006,0.313728],[42.680229,0.313806],[42.680235,0.313629],[42.680153,0.313509],[42.680056,0.313326],[42.68005,0.313144],[42.680212,0.313208],[42.680359,0.313296],[42.680515,0.313357],[42.680663,0.313429],[42.680683,0.31328],[42.680628,0.31312],[42.68062,0.312938],[42.680711,0.312894],[42.680744,0.312773],[42.680744,0.312619],[42.680744,0.312438],[42.680745,0.312274],[42.680789,0.312114],[42.680863,0.311908],[42.68091,0.311737],[42.680953,0.311597],[42.680995,0.311449],[42.681023,0.31125],[42.681039,0.311091],[42.68105,0.310894],[42.681072,0.310605],[42.681069,0.310472],[42.681028,0.310339]]$coords$::jsonb;
  v_landmarks jsonb := $landmarks$[[42.655836,0.335604]]$landmarks$::jsonb;
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
    where h.id='osm-relation-9669286'
      and h.source='openstreetmap' and h.source_type='relation'
      and h.external_id=9669286
      and h.name='Puente del Hospital - Puerto de Plan'
      and h.route_ref='PR-HU 188' and h.raw_tags->>'ref'='PR-HU 188'
      and h.source_url='https://www.openstreetmap.org/relation/9669286'
      and (h.official_url is not distinct from null
        or h.official_url='https://misendafedme.es/buscador-de-senderos/etapa/pr-hu-188-subida-al-puerto-de-plan')
      and h.region_code='huesca' and h.province='Huesca'
      and h.latitude=42.6638911 and h.longitude=0.3277142
      and exists (select 1 from public.hiking_route_regions r
        where r.route_id=h.id and r.region_code='huesca' and r.published)
    for update of h,t;
  if not found then
    raise exception 'PR-HU 188 route identity or published region changed';
  end if;
  if v_route.status='ready' then
    if v_route.geometry_source_url='https://misendafedme.es/buscador-de-senderos/inc/downloadGpx.php?etapa=117347'
      and v_route.geometry_source='FEDME - GPX oficial PR-HU 188'
      and v_route.segments=jsonb_build_array(v_points)
      and v_route.official and v_route.continuity_checked
      and v_route.checked_at is not null
      and v_route.published and v_route.trace_available
      and v_route.official_url='https://misendafedme.es/buscador-de-senderos/etapa/pr-hu-188-subida-al-puerto-de-plan'
      and v_route.distance_km=6.88
      and v_route.route_type='Lineal'
      and v_route.duration_minutes is null
      and v_route.ascent_m is null
      and v_route.description='PR-HU 188 desde el Puente del Hospital hasta el Puerto de Plan, pasando por el desvío hacia Urdiceto. El GPX oficial contiene la subida lineal de ida: 6,88 km.' then
      return;
    end if;
    raise exception 'PR-HU 188 route has another ready trace or publication state';
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
    or v_route.distance_km is distinct from 7
    or v_route.ascent_m is not null or v_route.duration_minutes is not null
    or v_route.route_type is distinct from null then
    raise exception 'PR-HU 188 hidden route state changed';
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
      (lat between 42.64 and 42.69 and lon between 0.31 and 0.35) valid
    from steps
  )
  select count(*),coalesce(sum(step_km),0),coalesce(max(step_km),0),
    coalesce(min(center_km),999),count(*) filter(where not valid)
    into v_count,v_length_km,v_max_gap_km,v_center_gap_km,v_invalid
    from distances;
  select ST_DistanceSphere(
    ST_MakePoint((v_coords->0->>1)::double precision,(v_coords->0->>0)::double precision),
    ST_MakePoint(0.346363,42.646587)),
    ST_DistanceSphere(
    ST_MakePoint((v_coords->(v_count-1)->>1)::double precision,
      (v_coords->(v_count-1)->>0)::double precision),
    ST_MakePoint(0.310339,42.681028)),
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
  if v_count<>444 or v_invalid>0
    or abs(v_length_km-6.881072)>0.015
    or v_max_gap_km>0.026 or v_center_gap_km>0.5
    or v_start_gap_m>2 or v_end_gap_m>2 or v_closing_gap_m<500
    or v_landmark_gap_m>10 then
    raise exception 'PR-HU 188 GPS validation failed: points %, length %, gap %, center %, start %, end %, closure %, landmarks %, invalid %',
      v_count,v_length_km,v_max_gap_km,v_center_gap_km,
      v_start_gap_m,v_end_gap_m,v_closing_gap_m,v_landmark_gap_m,v_invalid;
  end if;
  update public.hiking_route_tracks
    set status='ready',segments=jsonb_build_array(v_points),checked_at=now(),
      continuity_checked=true,geometry_source='FEDME - GPX oficial PR-HU 188',
      geometry_source_url='https://misendafedme.es/buscador-de-senderos/inc/downloadGpx.php?etapa=117347',official=true
    where route_id=v_route.id and status='missing';
  if not found then
    raise exception 'PR-HU 188 track state changed';
  end if;
  update public.hiking_routes
    set trace_available=true,published=true,
      distance_km=round(v_length_km::numeric,2),route_type='Lineal',
      official_url='https://misendafedme.es/buscador-de-senderos/etapa/pr-hu-188-subida-al-puerto-de-plan',description='PR-HU 188 desde el Puente del Hospital hasta el Puerto de Plan, pasando por el desvío hacia Urdiceto. El GPX oficial contiene la subida lineal de ida: 6,88 km.'
    where id=v_route.id and not published and not trace_available;
  if not found then
    raise exception 'PR-HU 188 publication state changed';
  end if;
end
$curate$;
