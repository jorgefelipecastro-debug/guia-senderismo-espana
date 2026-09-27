-- Generalitat Valenciana Parc Natural de la Font Roja public GPX downloads.
-- Checked 2026-09-27: El Xicotet 90 points / 1.555 km / max gap 90 m;
-- El Menejador 189 points / 6.668 km / max gap 132 m.
-- Both contain one trkseg and return to their start within metres.
-- Longer, partial or separated public files from other park routes stay hidden.
do $curate$
declare
  v_sources jsonb := '[{"route_id":"osm-relation-20602892","expected_points":90,"official_km":"1.5","gpx_url":"https://parquesnaturales.gva.es/documents/80302499/399065845/Ruta+blava.gpx/a68601e5-974d-5c15-e4ce-fe0798afea02?t=1764164558206","coords":[[38.66501,-0.540527],[38.665004,-0.539931],[38.665123,-0.5399],[38.665151,-0.539825],[38.665218,-0.53979],[38.665293,-0.539415],[38.665436,-0.539251],[38.665525,-0.539232],[38.665623,-0.539156],[38.665668,-0.539132],[38.665768,-0.538744],[38.665765,-0.538627],[38.665718,-0.538519],[38.665579,-0.538408],[38.66538,-0.538283],[38.665328,-0.538215],[38.665245,-0.538264],[38.665231,-0.538372],[38.665147,-0.538431],[38.665116,-0.538496],[38.665,-0.538481],[38.664912,-0.538543],[38.664882,-0.538643],[38.664798,-0.538683],[38.66463,-0.538829],[38.664272,-0.538499],[38.664034,-0.538377],[38.663908,-0.538351],[38.663804,-0.538452],[38.663784,-0.538631],[38.663803,-0.538715],[38.663792,-0.539048],[38.663845,-0.539356],[38.664062,-0.539524],[38.664147,-0.539676],[38.664112,-0.539834],[38.664033,-0.540006],[38.664018,-0.540271],[38.664033,-0.540471],[38.664087,-0.540703],[38.664105,-0.540789],[38.664053,-0.541092],[38.664054,-0.541285],[38.663993,-0.541645],[38.663965,-0.541792],[38.663897,-0.541897],[38.663917,-0.541971],[38.663968,-0.542022],[38.664034,-0.542043],[38.664103,-0.542013],[38.664157,-0.541894],[38.664203,-0.541694],[38.664221,-0.541625],[38.664256,-0.541619],[38.664277,-0.541686],[38.664304,-0.541717],[38.664317,-0.541828],[38.66432,-0.541883],[38.66432,-0.541946],[38.664309,-0.542053],[38.664323,-0.54193],[38.664304,-0.541719],[38.664269,-0.541669],[38.664255,-0.541618],[38.664213,-0.541626],[38.664149,-0.5419],[38.664104,-0.541998],[38.664032,-0.542033],[38.663959,-0.542006],[38.66392,-0.541965],[38.663894,-0.54189],[38.663958,-0.541783],[38.664048,-0.541291],[38.664047,-0.541051],[38.664101,-0.540783],[38.664022,-0.540465],[38.664042,-0.540016],[38.664105,-0.539821],[38.664133,-0.539672],[38.664051,-0.539524],[38.663853,-0.53937],[38.663783,-0.539082],[38.663792,-0.538702],[38.663894,-0.538758],[38.664625,-0.539193],[38.664732,-0.539478],[38.66481,-0.540009],[38.664814,-0.540079],[38.664934,-0.540193],[38.665009,-0.540527]],"expected_name":"El xicotet","page_url":"https://parquesnaturales.gva.es/va/web/pn-font-roja/ruta-azul-el-xicotet"},{"route_id":"osm-relation-20602894","expected_points":189,"official_km":"6.0","gpx_url":"https://parquesnaturales.gva.es/documents/80302499/399065845/Track_Ruta+Groga.gpx/a4c5b001-c0ab-94de-bcfc-2d4c4ce55d88?t=1764164559611","coords":[[38.664991,-0.540463],[38.664932,-0.540197],[38.664805,-0.540076],[38.66467,-0.539387],[38.664629,-0.5392],[38.663951,-0.538771],[38.663794,-0.538726],[38.663762,-0.539065],[38.663859,-0.539356],[38.664091,-0.539553],[38.66414,-0.53973],[38.664037,-0.539975],[38.664027,-0.54047],[38.664108,-0.540799],[38.664043,-0.541059],[38.664062,-0.541246],[38.663973,-0.541786],[38.663913,-0.541896],[38.663471,-0.542224],[38.663188,-0.542552],[38.663055,-0.542983],[38.66297,-0.543537],[38.663052,-0.543838],[38.663086,-0.544143],[38.663239,-0.5444],[38.663219,-0.544941],[38.663399,-0.54573],[38.663324,-0.545774],[38.663175,-0.545473],[38.663072,-0.545478],[38.663045,-0.54563],[38.663127,-0.546358],[38.663025,-0.547287],[38.662855,-0.547549],[38.661945,-0.54853],[38.661714,-0.548892],[38.661251,-0.550148],[38.661108,-0.550436],[38.661087,-0.551452],[38.660999,-0.551783],[38.661087,-0.552036],[38.661169,-0.552411],[38.661176,-0.552633],[38.66122,-0.552764],[38.661193,-0.552856],[38.661138,-0.553],[38.660948,-0.553183],[38.660767,-0.553536],[38.660638,-0.554521],[38.660495,-0.554809],[38.6604,-0.555141],[38.66044,-0.55584],[38.660393,-0.556372],[38.660331,-0.556791],[38.660171,-0.557205],[38.660061,-0.557346],[38.659744,-0.557447],[38.659451,-0.557416],[38.65875,-0.558024],[38.658108,-0.558316],[38.657757,-0.559066],[38.657716,-0.559964],[38.657767,-0.560287],[38.657668,-0.560706],[38.657474,-0.560998],[38.657338,-0.561024],[38.657273,-0.560911],[38.657192,-0.560492],[38.657124,-0.559554],[38.65709,-0.559136],[38.657161,-0.558578],[38.657433,-0.557461],[38.65774,-0.556576],[38.658063,-0.555163],[38.658271,-0.554461],[38.658254,-0.554302],[38.657764,-0.553543],[38.657503,-0.552951],[38.657452,-0.552576],[38.657524,-0.552053],[38.657721,-0.550557],[38.657857,-0.549986],[38.658191,-0.54897],[38.658637,-0.547984],[38.658712,-0.547265],[38.658746,-0.546489],[38.658729,-0.546293],[38.658654,-0.545961],[38.658528,-0.545695],[38.658416,-0.54515],[38.658391,-0.544827],[38.658442,-0.544504],[38.6585,-0.544182],[38.658694,-0.543515],[38.658834,-0.542904],[38.65911,-0.542171],[38.659184,-0.541949],[38.659147,-0.541735],[38.658824,-0.541561],[38.658551,-0.541483],[38.658051,-0.541203],[38.657656,-0.540903],[38.657407,-0.540619],[38.65737,-0.540262],[38.657499,-0.539895],[38.657761,-0.539455],[38.657865,-0.539229],[38.658025,-0.539251],[38.658454,-0.539665],[38.658628,-0.539351],[38.658703,-0.539099],[38.658809,-0.538938],[38.658897,-0.538964],[38.658815,-0.538977],[38.658689,-0.539169],[38.658628,-0.539392],[38.658662,-0.539745],[38.658686,-0.539867],[38.658849,-0.540111],[38.658907,-0.540233],[38.65888,-0.54039],[38.658819,-0.540647],[38.658897,-0.540844],[38.65905,-0.540948],[38.659207,-0.54152],[38.659204,-0.541738],[38.659381,-0.542025],[38.659466,-0.541986],[38.659524,-0.541838],[38.659565,-0.541293],[38.659748,-0.540608],[38.659799,-0.540399],[38.66,-0.54036],[38.660165,-0.540471],[38.660172,-0.540715],[38.660312,-0.540924],[38.660356,-0.541434],[38.660492,-0.541513],[38.660598,-0.541517],[38.66071,-0.541635],[38.660904,-0.541539],[38.661098,-0.541652],[38.661177,-0.541849],[38.661418,-0.541713],[38.661602,-0.541757],[38.661684,-0.541709],[38.661796,-0.541774],[38.662042,-0.541334],[38.662154,-0.54133],[38.662202,-0.541452],[38.662276,-0.541404],[38.662375,-0.541657],[38.662413,-0.541556],[38.662488,-0.541604],[38.662542,-0.541334],[38.662593,-0.541386],[38.662842,-0.540785],[38.662961,-0.540793],[38.663036,-0.540885],[38.663036,-0.540981],[38.663162,-0.541129],[38.663148,-0.541338],[38.663199,-0.541513],[38.663342,-0.541386],[38.663414,-0.541504],[38.663485,-0.541421],[38.663529,-0.541587],[38.663635,-0.541635],[38.663707,-0.541552],[38.663737,-0.541635],[38.663734,-0.541774],[38.663836,-0.54174],[38.663907,-0.541905],[38.663972,-0.54177],[38.664061,-0.541251],[38.664033,-0.541016],[38.664101,-0.540763],[38.664016,-0.540431],[38.66402,-0.539982],[38.664142,-0.539677],[38.66405,-0.539468],[38.663853,-0.539333],[38.663747,-0.539071],[38.663802,-0.538683],[38.663941,-0.538783],[38.664616,-0.539206],[38.664813,-0.540065],[38.664939,-0.540187],[38.664997,-0.540458]],"expected_name":"El Menejador","page_url":"https://parquesnaturales.gva.es/va/web/pn-font-roja/ruta-amarilla-el-menejador"}]'::jsonb;
  v_source jsonb;
  v_route record;
  v_points jsonb;
  v_count integer;
  v_length_km double precision;
  v_max_gap_km double precision;
  v_center_gap_km double precision;
  v_loop_gap_km double precision;
  v_invalid integer;
begin
  for v_source in select value from jsonb_array_elements(v_sources) as x(value) loop
    select h.id,h.latitude,h.longitude,h.distance_km,t.status
      into v_route
      from public.hiking_routes h
      join public.hiking_route_tracks t on t.route_id=h.id
      where h.id=v_source->>'route_id'
        and h.source='openstreetmap'
        and h.name=v_source->>'expected_name'
        and h.official_url=v_source->>'page_url'
        and exists (select 1 from public.hiking_route_regions r
          where r.route_id=h.id and r.published);
    if not found then
      raise exception 'Font Roja route identity or published region changed: %',
        v_source->>'route_id';
    end if;
    if v_route.status='ready' then continue; end if;
    with points as (
      select ordinality idx,(point->>0)::double precision lat,
        (point->>1)::double precision lon
      from jsonb_array_elements(v_source->'coords')
        with ordinality as p(point,ordinality)
    ), steps as (
      select *,lag(lat) over(order by idx) prev_lat,
        lag(lon) over(order by idx) prev_lon from points
    ), distances as (
      select case when prev_lat is null then 0 else 6371*2*asin(sqrt(
        least(1,power(sin(radians(lat-prev_lat)/2),2)+
        cos(radians(prev_lat))*cos(radians(lat))*
        power(sin(radians(lon-prev_lon)/2),2)))) end step_km,
        6371*2*asin(sqrt(least(1,
          power(sin(radians(lat-v_route.latitude)/2),2)+
          cos(radians(v_route.latitude))*cos(radians(lat))*
          power(sin(radians(lon-v_route.longitude)/2),2)))) center_km,
        (lat between 27 and 45 and lon between -19 and 5) valid from steps
    ) select count(*),coalesce(sum(step_km),0),coalesce(max(step_km),0),
        coalesce(min(center_km),999),count(*) filter(where not valid)
      into v_count,v_length_km,v_max_gap_km,v_center_gap_km,v_invalid
      from distances;
    select 6371*2*asin(sqrt(least(1,
      power(sin(radians(((v_source->'coords'->0->>0)::double precision-
        (v_source->'coords'->(v_count-1)->>0)::double precision)/2)),2)+
      cos(radians((v_source->'coords'->0->>0)::double precision))*
      cos(radians((v_source->'coords'->(v_count-1)->>0)::double precision))*
      power(sin(radians(((v_source->'coords'->0->>1)::double precision-
        (v_source->'coords'->(v_count-1)->>1)::double precision)/2)),2))))
      into v_loop_gap_km;
    if v_count<>(v_source->>'expected_points')::integer or v_count<50
      or v_invalid>0 or v_length_km<=0 or v_max_gap_km>0.15
      or v_center_gap_km>0.50 or v_loop_gap_km>0.10
      or abs(v_length_km/(v_source->>'official_km')::double precision-1)>0.12
      or (v_route.distance_km is not null
        and abs(v_length_km/v_route.distance_km-1)>0.12) then
      raise exception 'Font Roja track validation failed for %: points %, length %, gap %, center %, loop %, invalid %',
        v_source->>'route_id',v_count,v_length_km,v_max_gap_km,
        v_center_gap_km,v_loop_gap_km,v_invalid;
    end if;
    select jsonb_agg(jsonb_build_object('lat',(point->>0)::double precision,
      'lon',(point->>1)::double precision) order by ordinality)
      into v_points from jsonb_array_elements(v_source->'coords')
        with ordinality as p(point,ordinality);
    insert into public.hiking_route_tracks
      (route_id,status,segments,checked_at,continuity_checked,
       geometry_source,geometry_source_url,official)
    values (v_source->>'route_id','ready',jsonb_build_array(v_points),
      now(),true,'Generalitat Valenciana - Parc Natural de la Font Roja',
      v_source->>'gpx_url',true)
    on conflict(route_id) do update set
      status=excluded.status,segments=excluded.segments,
      checked_at=excluded.checked_at,continuity_checked=true,
      geometry_source=excluded.geometry_source,
      geometry_source_url=excluded.geometry_source_url,official=true;
    update public.hiking_routes
      set trace_available=true,published=true,
        distance_km=coalesce(distance_km,(v_source->>'official_km')::numeric)
      where id=v_source->>'route_id';
  end loop;
end
$curate$;
