-- Store current difficulty and duration from the itinerary authors, checked 2026-09-28.
alter table public.hiking_routes
  add column if not exists official_difficulty text;

do $official$
declare
  v_count integer;
begin
  update public.hiking_routes h
    set official_difficulty='muy_alta',
        duration_minutes=325,
        description='Travesía de alta montaña entre Vallter y Núria. Itinerànnia la clasifica de dificultad muy alta. Sigue el GR 11 y las marcas de Itinerànnia; consulta las condiciones de montaña antes de salir.'
    where h.id='osm-relation-10620939'
      and h.official_url='https://www.itinerannia.net/ca/itineraris/travessa-vallter-nuria/'
      and h.published and h.trace_available
      and exists(select 1 from public.hiking_route_tracks t
        where t.route_id=h.id and t.status='ready' and t.official
          and t.geometry_source_url='https://docs.hoobaweb.com/1062/travessa-vallter-nuria-2066400-1.gpx');
  get diagnostics v_count = row_count;
  if v_count<>1 then raise exception 'Vallter-Núria official route changed'; end if;

  update public.hiking_routes h
    set official_difficulty='alta',
        duration_minutes=390,
        description='PR-C 211 Riera de Gualba, ruta de dificultad alta por el valle de Santa Fe. La Diputació de Barcelona pide extremar la precaución junto al torrente en invierno y tras días de lluvia.'
    where h.id='osm-relation-9506234'
      and h.official_url='https://itineraris-senyalitzats.diba.cat/dibaparcs/routes/view/pr-c-211-riera-de-gualba'
      and h.published and h.trace_available
      and exists(select 1 from public.hiking_route_tracks t
        where t.route_id=h.id and t.status='ready' and t.official
          and t.geometry_source_url='https://www.gooltracking.com/PHP/export_ruta_gpx.php?IDrt=3572');
  get diagnostics v_count = row_count;
  if v_count<>1 then raise exception 'PR-C 211 official route changed'; end if;

  update public.hiking_routes h
    set official_difficulty='facil'
    where h.id='osm-relation-10580203' and h.published and h.trace_available
      and exists(select 1 from public.hiking_route_tracks t
        where t.route_id=h.id and t.status='ready' and t.official
          and t.geometry_source_url='https://docs.hoobaweb.com/1062/ruta-camins-de-pedra-tosca-1.gpx');
  get diagnostics v_count = row_count;
  if v_count<>1 then raise exception 'Camins de Pedra Tosca official route changed'; end if;

  update public.hiking_routes h
    set official_difficulty='facil'
    where h.id='osm-relation-10580092' and h.published and h.trace_available
      and exists(select 1 from public.hiking_route_tracks t
        where t.route_id=h.id and t.status='ready' and t.official
          and t.geometry_source_url='https://docs.hoobaweb.com/1062/via-romana-des-del-pas-dels-traginers.gpx');
  get diagnostics v_count = row_count;
  if v_count<>1 then raise exception 'Capsacosta official route changed'; end if;
end
$official$;
