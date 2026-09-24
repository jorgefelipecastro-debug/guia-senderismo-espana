-- La primera renovación completó una provincia tras 78 segundos, pero pg_net
-- canceló la espera a los 60 segundos. La API admite hasta 300 segundos.
-- Conservamos cinco minutos entre peticiones y esperamos hasta tres por cada una.

do $$
declare v_job_id bigint;
begin
  select jobid into v_job_id from cron.job where jobname='encumbrate-national-route-import';
  if v_job_id is not null then perform cron.unschedule(v_job_id); end if;
  perform cron.schedule(
    'encumbrate-national-route-import',
    '*/5 * * * *',
    $job$
      select net.http_post(
        url:='https://www.encumbrate.es/api/admin/routes/import',
        headers:=jsonb_build_object(
          'Content-Type','application/json',
          'x-encumbrate-import-key',(select import_key from public.route_import_control where id=true)
        ),
        body:='{}'::jsonb,
        timeout_milliseconds:=180000
      )
      where exists(
        select 1 from public.route_import_regions
        where status='pending'
           or (status='error' and last_started_at<now()-interval '20 minutes')
           or (status='ready' and last_completed_at<now()-interval '28 days')
      );
    $job$
  );
end $$;
