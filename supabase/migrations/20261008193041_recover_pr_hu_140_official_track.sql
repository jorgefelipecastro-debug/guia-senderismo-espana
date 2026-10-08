-- Comarca Hoya de Huesca, PR-HU 140: Recorrido por el humedal de Cortés.
-- Ficha oficial: https://senderos.hoyadehuesca.es/ruta/68
-- GPX oficial: https://senderos.hoyadehuesca.es/vsp/get_route_GPX.php?id=68
-- SHA-256 del archivo original: 170487194247ccf0e7248d4048557152234a1af3715a8e14a01ceafc4aa8f010
-- Revisado el 2026-10-08: 361 puntos originales, un segmento continuo,
-- 6.351752 km, intervalo máximo 87.22 m.
-- Referencia, ubicación, extremos y recorrido contrastados con OSM.
-- Coordenadas originales conservadas sin remuestrear, unir ni cerrar trazados.
-- Distancia sobre el GPX; horarios y desniveles existentes se conservan.
-- Los 361 puntos originales se guardan íntegros. El navegador elimina tres repeticiones consecutivas exactas mediante su normalización existente; sirve 358 puntos y conserva el mismo recorrido.
do $curate$
declare
  v_coords jsonb := $coords$[[42.144227,-0.410248],[42.144314,-0.410334],[42.144322,-0.410339],[42.144471,-0.410476],[42.144596,-0.410651],[42.144675,-0.410748],[42.144797,-0.410879],[42.144866,-0.410971],[42.144885,-0.411038],[42.144881,-0.411136],[42.144881,-0.411136],[42.144848,-0.411313],[42.144822,-0.411547],[42.144813,-0.411872],[42.144815,-0.412196],[42.144805,-0.412529],[42.144788,-0.412904],[42.144793,-0.413384],[42.144814,-0.413562],[42.144873,-0.413728],[42.14496,-0.413922],[42.145185,-0.41433],[42.145291,-0.414501],[42.145367,-0.41463],[42.145483,-0.414791],[42.14562,-0.414905],[42.145759,-0.415006],[42.145759,-0.415006],[42.145761,-0.415138],[42.145798,-0.415329],[42.145838,-0.415502],[42.145871,-0.415676],[42.145912,-0.41583],[42.145959,-0.415936],[42.146041,-0.416113],[42.146114,-0.416289],[42.146182,-0.416452],[42.146236,-0.416589],[42.146274,-0.416691],[42.146309,-0.416793],[42.146348,-0.416937],[42.146395,-0.417144],[42.146443,-0.417321],[42.146514,-0.417487],[42.146621,-0.417708],[42.146713,-0.417921],[42.14678,-0.418101],[42.146826,-0.418232],[42.146892,-0.418429],[42.146968,-0.418652],[42.147112,-0.419058],[42.147231,-0.41937],[42.147293,-0.419509],[42.147336,-0.419585],[42.14746,-0.419789],[42.147557,-0.419937],[42.147709,-0.42017],[42.147826,-0.42036],[42.147947,-0.420536],[42.147997,-0.420615],[42.148051,-0.4207],[42.148156,-0.420895],[42.148228,-0.421046],[42.148286,-0.421188],[42.148413,-0.421501],[42.148496,-0.421696],[42.148548,-0.421845],[42.148603,-0.422014],[42.148696,-0.422297],[42.14876,-0.422474],[42.148883,-0.422795],[42.148968,-0.423018],[42.149021,-0.423165],[42.149107,-0.423363],[42.149211,-0.423583],[42.149369,-0.423908],[42.149456,-0.424088],[42.149553,-0.424287],[42.149637,-0.42445],[42.149708,-0.424592],[42.149761,-0.424709],[42.149802,-0.424819],[42.14985,-0.424947],[42.149909,-0.42513],[42.149949,-0.425261],[42.150231,-0.426058],[42.150255,-0.426081],[42.150297,-0.426091],[42.150349,-0.426067],[42.150465,-0.425928],[42.150629,-0.425767],[42.150866,-0.425545],[42.151138,-0.425313],[42.151322,-0.425165],[42.151578,-0.424953],[42.151739,-0.424829],[42.151961,-0.424633],[42.152237,-0.424425],[42.15234,-0.424358],[42.152512,-0.424266],[42.152752,-0.424121],[42.152957,-0.424003],[42.153164,-0.42389],[42.15333,-0.423815],[42.153534,-0.423713],[42.15374,-0.423616],[42.153912,-0.423535],[42.154134,-0.423438],[42.154299,-0.423361],[42.154351,-0.423344],[42.154407,-0.423335],[42.154459,-0.423341],[42.154516,-0.423366],[42.154576,-0.423409],[42.154729,-0.42352],[42.154823,-0.423591],[42.154884,-0.423652],[42.154958,-0.42373],[42.155078,-0.423865],[42.155175,-0.423979],[42.1553,-0.424126],[42.155433,-0.424289],[42.15559,-0.424481],[42.155792,-0.424737],[42.15594,-0.424926],[42.156102,-0.425129],[42.15617,-0.425228],[42.156207,-0.425289],[42.156228,-0.425354],[42.156257,-0.425425],[42.156303,-0.425486],[42.156374,-0.425583],[42.156457,-0.425675],[42.15655,-0.425771],[42.156628,-0.425848],[42.156733,-0.425955],[42.156795,-0.426021],[42.15684,-0.426081],[42.156871,-0.426132],[42.156896,-0.426177],[42.156927,-0.426251],[42.156961,-0.426347],[42.156991,-0.426441],[42.157031,-0.426557],[42.157062,-0.426627],[42.157122,-0.426734],[42.157226,-0.426893],[42.157296,-0.427],[42.157384,-0.427119],[42.157489,-0.427254],[42.157593,-0.427403],[42.157653,-0.42747],[42.157716,-0.427526],[42.157795,-0.427585],[42.15787,-0.427628],[42.157929,-0.42767],[42.157989,-0.427721],[42.158052,-0.427788],[42.158179,-0.427913],[42.158314,-0.428039],[42.158391,-0.428115],[42.15845,-0.428181],[42.158508,-0.428259],[42.158598,-0.42838],[42.158664,-0.428469],[42.158801,-0.428626],[42.158897,-0.428746],[42.158985,-0.428865],[42.159096,-0.429025],[42.159203,-0.429215],[42.159293,-0.429403],[42.15935,-0.429533],[42.159413,-0.429683],[42.159482,-0.42987],[42.159553,-0.43003],[42.159633,-0.430171],[42.159723,-0.430319],[42.159867,-0.430547],[42.160003,-0.430742],[42.160166,-0.430973],[42.160311,-0.431142],[42.160431,-0.43126],[42.160624,-0.431467],[42.16087,-0.431741],[42.161072,-0.431938],[42.161284,-0.432155],[42.161532,-0.432398],[42.161696,-0.432576],[42.162007,-0.432922],[42.162335,-0.433241],[42.162608,-0.433511],[42.162819,-0.433706],[42.162943,-0.43382],[42.163189,-0.434037],[42.163311,-0.434163],[42.163441,-0.434318],[42.163497,-0.434372],[42.163569,-0.434421],[42.163629,-0.434458],[42.163748,-0.434527],[42.16388,-0.434618],[42.163991,-0.434699],[42.164068,-0.434785],[42.164116,-0.434861],[42.164153,-0.43494],[42.164181,-0.435031],[42.164202,-0.435129],[42.164218,-0.435242],[42.164224,-0.435355],[42.164236,-0.43549],[42.164249,-0.435594],[42.164265,-0.435674],[42.164289,-0.435757],[42.164338,-0.435869],[42.164414,-0.43601],[42.164479,-0.436141],[42.164536,-0.436278],[42.164559,-0.436361],[42.164579,-0.436451],[42.164594,-0.436551],[42.164611,-0.436705],[42.16463,-0.436897],[42.164668,-0.43712],[42.164678,-0.437226],[42.164692,-0.437413],[42.164698,-0.437504],[42.164725,-0.437604],[42.16476,-0.437656],[42.164822,-0.437696],[42.164874,-0.437715],[42.164931,-0.437754],[42.165005,-0.437825],[42.165076,-0.437885],[42.165199,-0.437999],[42.165258,-0.438043],[42.165258,-0.438043],[42.165302,-0.438161],[42.165329,-0.438305],[42.165335,-0.438404],[42.165348,-0.438451],[42.165396,-0.438535],[42.165428,-0.438612],[42.165452,-0.43873],[42.165505,-0.438916],[42.165596,-0.439076],[42.165694,-0.439205],[42.165797,-0.439343],[42.165934,-0.439583],[42.166048,-0.439774],[42.166116,-0.43991],[42.166148,-0.440018],[42.166184,-0.440236],[42.166248,-0.44048],[42.166295,-0.440722],[42.166325,-0.440877],[42.166337,-0.441034],[42.166355,-0.441191],[42.166386,-0.441359],[42.16641,-0.441558],[42.166407,-0.441847],[42.166402,-0.44216],[42.166413,-0.442411],[42.16648,-0.442783],[42.166597,-0.443048],[42.166743,-0.443253],[42.166934,-0.443543],[42.167107,-0.443739],[42.16731,-0.443988],[42.167439,-0.444121],[42.167595,-0.444307],[42.167741,-0.444497],[42.167828,-0.444534],[42.167931,-0.444523],[42.168089,-0.444538],[42.168251,-0.444557],[42.168437,-0.444616],[42.168586,-0.444645],[42.168782,-0.44471],[42.168956,-0.444755],[42.169103,-0.444762],[42.169114,-0.444805],[42.169164,-0.44494],[42.169203,-0.445036],[42.169252,-0.445199],[42.169316,-0.445458],[42.169387,-0.44572],[42.169427,-0.445861],[42.169489,-0.446132],[42.16953,-0.446334],[42.169559,-0.446504],[42.169595,-0.446734],[42.16962,-0.446891],[42.169655,-0.447073],[42.16969,-0.44723],[42.169764,-0.447548],[42.169795,-0.4477],[42.169808,-0.447811],[42.16981,-0.447952],[42.169796,-0.448306],[42.169797,-0.44854],[42.169803,-0.448663],[42.169823,-0.44877],[42.169908,-0.44898],[42.169977,-0.449153],[42.170035,-0.449317],[42.170104,-0.449464],[42.17019,-0.449614],[42.170278,-0.44976],[42.17034,-0.449842],[42.170405,-0.4499],[42.170531,-0.450016],[42.170618,-0.450115],[42.170782,-0.450313],[42.170829,-0.450388],[42.170856,-0.450508],[42.170903,-0.450824],[42.170939,-0.451107],[42.170984,-0.451347],[42.171,-0.451482],[42.171005,-0.451652],[42.171006,-0.451779],[42.171029,-0.45188],[42.171074,-0.451965],[42.171175,-0.452066],[42.171254,-0.452142],[42.171303,-0.452174],[42.171353,-0.452184],[42.171409,-0.452185],[42.171462,-0.452163],[42.17165,-0.452037],[42.172073,-0.451659],[42.172714,-0.451049],[42.172913,-0.450858],[42.173026,-0.45079],[42.173168,-0.450768],[42.173356,-0.450763],[42.173835,-0.45075],[42.174312,-0.450763],[42.174904,-0.450759],[42.175594,-0.450773],[42.176049,-0.450778],[42.176627,-0.450784],[42.177251,-0.450783],[42.177578,-0.450789],[42.177933,-0.450794],[42.17815,-0.450825],[42.17832,-0.450855],[42.178462,-0.45089],[42.178551,-0.450927],[42.17865,-0.450967],[42.178728,-0.450998],[42.178876,-0.45105],[42.178966,-0.451082],[42.179139,-0.451113],[42.179271,-0.451127],[42.17938,-0.451108],[42.179547,-0.451084],[42.179848,-0.451022],[42.180148,-0.450959],[42.180572,-0.450853],[42.180675,-0.450824]]$coords$::jsonb;
  v_landmarks jsonb := $landmarks$[[42.165335,-0.438404],[42.144675,-0.410747],[42.180675,-0.450824],[42.144322,-0.410339],[42.144314,-0.410334],[42.171254,-0.452142]]$landmarks$::jsonb;
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
    where h.id='osm-relation-5681010'
      and h.source='openstreetmap' and h.source_type='relation'
      and h.external_id=5681010
      and h.name='Recorrido por el humedal de Cortés'
      and h.route_ref='PR-HU 140' and h.raw_tags->>'ref'='PR-HU 140'
      and h.source_url='https://www.openstreetmap.org/relation/5681010'
      and (h.official_url is not distinct from null
        or h.official_url='https://senderos.hoyadehuesca.es/ruta/68')
      and h.region_code='huesca' and h.province='Huesca'
      and h.latitude=42.1623605 and h.longitude=-0.431207
      and exists (select 1 from public.hiking_route_regions r
        where r.route_id=h.id and r.region_code='huesca' and r.published)
    for update of h,t;
  if not found then
    raise exception 'PR-HU 140 route identity or published region changed';
  end if;
  if v_route.status='ready' then
    if v_route.geometry_source_url='https://senderos.hoyadehuesca.es/vsp/get_route_GPX.php?id=68'
      and v_route.geometry_source='Comarca Hoya de Huesca - GPX oficial PR-HU 140'
      and v_route.segments=jsonb_build_array(v_points)
      and v_route.official and v_route.continuity_checked
      and v_route.checked_at is not null
      and v_route.published and v_route.trace_available
      and v_route.official_url='https://senderos.hoyadehuesca.es/ruta/68'
      and v_route.distance_km=6.35
      and v_route.route_type='Lineal'
      and v_route.duration_minutes is null
      and v_route.ascent_m is null
      and v_route.description='PR-HU 140 desde Huesca, junto al puente de San Miguel, hasta Banastás, pasando por la Alberca de Cortés y Chimillas. El GPX oficial contiene el recorrido lineal de ida: 6,35 km.' then
      return;
    end if;
    raise exception 'PR-HU 140 route has another ready trace or publication state';
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
    raise exception 'PR-HU 140 hidden route state changed';
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
      (lat between 42.14 and 42.19 and lon between -0.46 and -0.41) valid
    from steps
  )
  select count(*),coalesce(sum(step_km),0),coalesce(max(step_km),0),
    coalesce(min(center_km),999),count(*) filter(where not valid)
    into v_count,v_length_km,v_max_gap_km,v_center_gap_km,v_invalid
    from distances;
  select ST_DistanceSphere(
    ST_MakePoint((v_coords->0->>1)::double precision,(v_coords->0->>0)::double precision),
    ST_MakePoint(-0.410248,42.144227)),
    ST_DistanceSphere(
    ST_MakePoint((v_coords->(v_count-1)->>1)::double precision,
      (v_coords->(v_count-1)->>0)::double precision),
    ST_MakePoint(-0.450824,42.180675)),
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
  if v_count<>361 or v_invalid>0
    or abs(v_length_km-6.351752)>0.015
    or v_max_gap_km>0.091 or v_center_gap_km>0.18
    or v_start_gap_m>2 or v_end_gap_m>2 or v_closing_gap_m<500
    or v_landmark_gap_m>10 then
    raise exception 'PR-HU 140 GPS validation failed: points %, length %, gap %, center %, start %, end %, closure %, landmarks %, invalid %',
      v_count,v_length_km,v_max_gap_km,v_center_gap_km,
      v_start_gap_m,v_end_gap_m,v_closing_gap_m,v_landmark_gap_m,v_invalid;
  end if;
  update public.hiking_route_tracks
    set status='ready',segments=jsonb_build_array(v_points),checked_at=now(),
      continuity_checked=true,geometry_source='Comarca Hoya de Huesca - GPX oficial PR-HU 140',
      geometry_source_url='https://senderos.hoyadehuesca.es/vsp/get_route_GPX.php?id=68',official=true
    where route_id=v_route.id and status='missing';
  if not found then
    raise exception 'PR-HU 140 track state changed';
  end if;
  update public.hiking_routes
    set trace_available=true,published=true,
      distance_km=round(v_length_km::numeric,2),route_type='Lineal',
      official_url='https://senderos.hoyadehuesca.es/ruta/68',description='PR-HU 140 desde Huesca, junto al puente de San Miguel, hasta Banastás, pasando por la Alberca de Cortés y Chimillas. El GPX oficial contiene el recorrido lineal de ida: 6,35 km.'
    where id=v_route.id and not published and not trace_available;
  if not found then
    raise exception 'PR-HU 140 publication state changed';
  end if;
end
$curate$;
