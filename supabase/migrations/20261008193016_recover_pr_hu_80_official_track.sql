-- FEDME, PR-HU 80: Parque de Arratiecho - Casita de las Brujas.
-- Ficha oficial: https://misendafedme.es/buscador-de-senderos/etapa/pr-hu-80-parque-de-arratiecho-parque-de-arratiecho
-- GPX oficial: https://misendafedme.es/buscador-de-senderos/inc/downloadGpx.php?etapa=117740
-- SHA-256 del archivo original: 5de656c568fd725d2a02c97970dd06771f66672f2b68a3b5839d1e8d1d4bd42c
-- Revisado el 2026-10-08: 213 puntos originales, un segmento continuo,
-- 3.244704 km, intervalo máximo 27.22 m.
-- Referencia, ubicación, extremos y recorrido contrastados con OSM.
-- Coordenadas originales conservadas sin remuestrear, unir ni cerrar trazados.
-- Distancia sobre el GPX; horarios y desniveles existentes se conservan.
-- Circuito cerrado en el archivo original, contrastado íntegramente con la relación OSM. La distancia anterior de 6 km se sustituye por la del GPS oficial.
do $curate$
declare
  v_coords jsonb := $coords$[[42.625303,-0.315936],[42.62534,-0.315617],[42.625418,-0.315366],[42.625494,-0.315227],[42.625544,-0.315111],[42.625652,-0.314944],[42.625705,-0.314735],[42.625739,-0.314548],[42.625811,-0.314318],[42.625814,-0.314304],[42.625851,-0.314155],[42.625891,-0.313991],[42.625954,-0.31382],[42.626015,-0.313662],[42.626066,-0.313529],[42.626119,-0.313392],[42.626172,-0.313254],[42.626253,-0.313068],[42.626335,-0.312882],[42.626411,-0.31267],[42.626472,-0.312477],[42.626532,-0.312284],[42.626622,-0.312013],[42.626696,-0.311837],[42.62677,-0.311661],[42.626829,-0.311493],[42.626929,-0.311253],[42.627119,-0.31123],[42.627264,-0.311198],[42.62732,-0.310987],[42.627333,-0.310834],[42.627393,-0.310663],[42.627432,-0.31044],[42.627573,-0.31036],[42.627725,-0.310219],[42.62774,-0.310104],[42.627804,-0.309991],[42.627867,-0.310111],[42.627868,-0.310221],[42.627878,-0.310366],[42.627944,-0.310469],[42.627994,-0.310551],[42.628214,-0.310697],[42.628315,-0.310731],[42.628196,-0.31057],[42.628163,-0.310526],[42.628157,-0.310464],[42.628192,-0.310488],[42.628257,-0.31052],[42.62833,-0.310544],[42.628329,-0.310494],[42.628242,-0.310422],[42.628207,-0.310274],[42.628338,-0.310392],[42.628431,-0.31044],[42.628542,-0.310455],[42.628647,-0.310482],[42.628752,-0.310566],[42.628752,-0.310422],[42.62877,-0.310233],[42.628783,-0.310066],[42.62873,-0.309905],[42.628672,-0.309729],[42.628601,-0.30953],[42.62858,-0.30931],[42.628704,-0.309118],[42.628782,-0.30896],[42.628782,-0.308724],[42.628828,-0.308549],[42.628927,-0.308394],[42.628994,-0.308247],[42.629083,-0.308113],[42.629127,-0.307949],[42.629178,-0.307806],[42.629228,-0.307596],[42.629337,-0.30748],[42.629371,-0.307332],[42.629516,-0.307233],[42.629564,-0.30708],[42.629621,-0.306973],[42.629737,-0.307049],[42.629888,-0.307141],[42.629895,-0.306964],[42.629903,-0.306793],[42.629967,-0.306635],[42.630051,-0.306872],[42.630144,-0.30672],[42.630151,-0.306559],[42.630212,-0.306375],[42.630291,-0.306263],[42.630324,-0.306449],[42.630432,-0.306325],[42.630476,-0.306163],[42.630575,-0.305942],[42.630669,-0.305759],[42.630702,-0.305565],[42.630543,-0.305553],[42.630419,-0.30559],[42.630268,-0.305588],[42.630057,-0.305605],[42.629914,-0.305646],[42.629787,-0.305663],[42.629691,-0.305529],[42.629535,-0.305479],[42.629425,-0.305313],[42.629315,-0.305093],[42.629209,-0.305038],[42.629101,-0.305019],[42.628984,-0.305053],[42.628872,-0.30519],[42.628854,-0.305414],[42.62877,-0.305565],[42.628686,-0.305639],[42.628523,-0.305697],[42.628408,-0.305781],[42.628342,-0.305917],[42.628219,-0.306076],[42.628113,-0.30624],[42.628263,-0.306224],[42.628291,-0.306352],[42.62813,-0.306553],[42.627973,-0.306742],[42.62786,-0.306954],[42.627725,-0.307125],[42.627631,-0.307208],[42.627548,-0.307275],[42.627409,-0.307427],[42.627285,-0.307554],[42.627131,-0.307573],[42.626943,-0.307454],[42.626961,-0.307691],[42.627135,-0.307859],[42.627008,-0.307848],[42.62705,-0.307979],[42.627145,-0.308021],[42.627253,-0.308116],[42.62729,-0.308238],[42.62713,-0.308211],[42.626919,-0.308183],[42.626865,-0.308093],[42.626787,-0.308113],[42.626734,-0.308127],[42.626765,-0.308234],[42.626852,-0.308343],[42.626947,-0.308361],[42.627054,-0.308329],[42.627144,-0.308422],[42.627233,-0.308516],[42.627213,-0.308725],[42.627176,-0.308721],[42.627166,-0.308802],[42.627227,-0.308873],[42.627292,-0.308907],[42.627344,-0.309058],[42.627217,-0.309075],[42.6271,-0.308998],[42.626995,-0.309012],[42.627039,-0.309097],[42.627138,-0.309178],[42.627188,-0.309328],[42.62708,-0.309319],[42.62697,-0.309246],[42.626821,-0.309236],[42.626686,-0.309237],[42.626542,-0.309282],[42.626648,-0.309424],[42.626834,-0.30948],[42.626958,-0.309601],[42.627052,-0.309814],[42.627078,-0.309999],[42.626971,-0.309993],[42.626813,-0.309898],[42.626639,-0.309829],[42.626509,-0.309835],[42.626395,-0.30987],[42.626176,-0.309845],[42.626053,-0.309793],[42.626159,-0.309961],[42.626261,-0.310083],[42.626399,-0.310272],[42.626556,-0.310365],[42.626674,-0.310429],[42.626743,-0.310599],[42.626832,-0.310798],[42.626823,-0.310971],[42.626928,-0.311246],[42.626929,-0.311253],[42.626829,-0.311493],[42.62677,-0.311661],[42.626696,-0.311837],[42.626622,-0.312013],[42.626532,-0.312284],[42.626472,-0.312477],[42.626411,-0.31267],[42.626335,-0.312882],[42.626253,-0.313068],[42.626172,-0.313254],[42.626119,-0.313392],[42.626066,-0.313529],[42.626015,-0.313662],[42.625954,-0.31382],[42.625891,-0.313991],[42.625851,-0.314155],[42.625814,-0.314304],[42.625811,-0.314318],[42.625739,-0.314548],[42.625705,-0.314735],[42.625652,-0.314944],[42.625544,-0.315111],[42.625494,-0.315227],[42.625418,-0.315366],[42.62534,-0.315617],[42.625303,-0.315936]]$coords$::jsonb;
  v_landmarks jsonb := $landmarks$[[42.625303,-0.315936]]$landmarks$::jsonb;
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
    where h.id='osm-relation-9724196'
      and h.source='openstreetmap' and h.source_type='relation'
      and h.external_id=9724196
      and h.name='Parque de Arratiecho - Casita de las Brujas'
      and h.route_ref='PR-HU 80' and h.raw_tags->>'ref'='PR-HU 80'
      and h.source_url='https://www.openstreetmap.org/relation/9724196'
      and (h.official_url is not distinct from null
        or h.official_url='https://misendafedme.es/buscador-de-senderos/etapa/pr-hu-80-parque-de-arratiecho-parque-de-arratiecho')
      and h.region_code='huesca' and h.province='Huesca'
      and h.latitude=42.628011 and h.longitude=-0.3105207
      and exists (select 1 from public.hiking_route_regions r
        where r.route_id=h.id and r.region_code='huesca' and r.published)
    for update of h,t;
  if not found then
    raise exception 'PR-HU 80 route identity or published region changed';
  end if;
  if v_route.status='ready' then
    if v_route.geometry_source_url='https://misendafedme.es/buscador-de-senderos/inc/downloadGpx.php?etapa=117740'
      and v_route.geometry_source='FEDME - GPX oficial PR-HU 80'
      and v_route.segments=jsonb_build_array(v_points)
      and v_route.official and v_route.continuity_checked
      and v_route.checked_at is not null
      and v_route.published and v_route.trace_available
      and v_route.official_url='https://misendafedme.es/buscador-de-senderos/etapa/pr-hu-80-parque-de-arratiecho-parque-de-arratiecho'
      and v_route.distance_km=3.24
      and v_route.route_type='Circular'
      and v_route.duration_minutes is null
      and v_route.ascent_m is null
      and v_route.description='PR-HU 80 circular desde el parque de Arratiecho hasta la Casita de las Brujas y regreso al parque. El GPX oficial recorre el circuito completo: 3,24 km.' then
      return;
    end if;
    raise exception 'PR-HU 80 route has another ready trace or publication state';
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
    or v_route.distance_km is distinct from 6
    or v_route.ascent_m is not null or v_route.duration_minutes is not null
    or v_route.route_type is distinct from 'Circular' then
    raise exception 'PR-HU 80 hidden route state changed';
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
      (lat between 42.62 and 42.64 and lon between -0.32 and -0.3) valid
    from steps
  )
  select count(*),coalesce(sum(step_km),0),coalesce(max(step_km),0),
    coalesce(min(center_km),999),count(*) filter(where not valid)
    into v_count,v_length_km,v_max_gap_km,v_center_gap_km,v_invalid
    from distances;
  select ST_DistanceSphere(
    ST_MakePoint((v_coords->0->>1)::double precision,(v_coords->0->>0)::double precision),
    ST_MakePoint(-0.315936,42.625303)),
    ST_DistanceSphere(
    ST_MakePoint((v_coords->(v_count-1)->>1)::double precision,
      (v_coords->(v_count-1)->>0)::double precision),
    ST_MakePoint(-0.315936,42.625303)),
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
  if v_count<>213 or v_invalid>0
    or abs(v_length_km-3.244704)>0.015
    or v_max_gap_km>0.031 or v_center_gap_km>0.05
    or v_start_gap_m>2 or v_end_gap_m>2 or v_closing_gap_m>25
    or v_landmark_gap_m>10 then
    raise exception 'PR-HU 80 GPS validation failed: points %, length %, gap %, center %, start %, end %, closure %, landmarks %, invalid %',
      v_count,v_length_km,v_max_gap_km,v_center_gap_km,
      v_start_gap_m,v_end_gap_m,v_closing_gap_m,v_landmark_gap_m,v_invalid;
  end if;
  update public.hiking_route_tracks
    set status='ready',segments=jsonb_build_array(v_points),checked_at=now(),
      continuity_checked=true,geometry_source='FEDME - GPX oficial PR-HU 80',
      geometry_source_url='https://misendafedme.es/buscador-de-senderos/inc/downloadGpx.php?etapa=117740',official=true
    where route_id=v_route.id and status='missing';
  if not found then
    raise exception 'PR-HU 80 track state changed';
  end if;
  update public.hiking_routes
    set trace_available=true,published=true,
      distance_km=round(v_length_km::numeric,2),route_type='Circular',
      official_url='https://misendafedme.es/buscador-de-senderos/etapa/pr-hu-80-parque-de-arratiecho-parque-de-arratiecho',description='PR-HU 80 circular desde el parque de Arratiecho hasta la Casita de las Brujas y regreso al parque. El GPX oficial recorre el circuito completo: 3,24 km.'
    where id=v_route.id and not published and not trace_available;
  if not found then
    raise exception 'PR-HU 80 publication state changed';
  end if;
end
$curate$;
