-- The cron guard must match claim_route_geometry_batch. Old OSM records with
-- no published region cannot be claimed, and missing geometry becomes due for
-- a fresh check after 28 days. Neither case should be silently mishandled.
do $fix$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id from cron.job
  where jobname = 'encumbrate-route-geometry-verification';

  if v_job_id is not null then
    perform cron.alter_job(job_id := v_job_id, command := $job$
      select net.http_post(
        url := 'https://www.encumbrate.es/api/admin/routes/verify-tracks',
        headers := jsonb_build_object('Content-Type', 'application/json',
          'x-encumbrate-import-key',
          (select import_key from public.route_import_control where id = true)),
        body := '{}'::jsonb,
        timeout_milliseconds := 180000
      )
      where exists (
        select 1 from public.route_import_control
        where id = true and enabled
      )
      and exists (
        select 1 from public.hiking_routes h
        left join public.hiking_route_tracks t on t.route_id = h.id
        where (h.source = 'openstreetmap' or h.raw_tags ? 'osm_relation_id')
          and (h.external_id is not null or h.raw_tags ? 'osm_relation_id')
          and (h.source <> 'openstreetmap' or exists (
            select 1 from public.hiking_route_regions m
            where m.route_id = h.id and m.published
          ))
          and (t.route_id is null
            or (t.status = 'checking' and t.checked_at < now() - interval '10 minutes')
            or (t.status = 'missing' and t.checked_at < now() - interval '28 days'))
      );
    $job$);
  end if;
end
$fix$;
