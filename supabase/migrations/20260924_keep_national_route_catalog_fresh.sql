-- La importación inicial cancelaba el cron al terminar. Sin un nuevo evento
-- externo, ninguna provincia volvía a importarse al vencer los 30 días.
-- Conservamos la tarea y volvemos a consultar las provincias cada 28 días.

create or replace function public.claim_next_route_import_region()
returns setof public.route_import_regions
language plpgsql security definer set search_path=''
as $$
declare v_region public.route_import_regions;
begin
  select * into v_region
  from public.route_import_regions
  where status='pending'
     or (status='error' and last_started_at < now()-interval '20 minutes')
     or (status='ready' and last_completed_at < now()-interval '28 days')
  order by case status when 'pending' then 0 when 'error' then 1 else 2 end,
           last_completed_at nulls first,import_attempts,sort_order
  for update skip locked limit 1;
  if not found then return; end if;
  update public.route_import_regions set
    status='importing',import_attempts=import_attempts+1,
    last_started_at=now(),last_error=null
  where code=v_region.code returning * into v_region;
  return next v_region;
end;
$$;

create or replace function public.complete_route_import_region(
  p_region_code text,
  p_run_id bigint,
  p_started_at timestamptz,
  p_source_count integer,
  p_upserted_count integer
)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_count integer; v_incomplete integer; v_previous_count integer;
begin
  -- La API en producción puede seguir ejecutando una versión anterior durante
  -- el despliegue. El control en la base preserva el catálogo incluso entonces.
  select coalesce((
    select rr.upserted_count from public.route_import_runs rr
    where rr.region_code=p_region_code and rr.status='completed'
    order by rr.completed_at desc limit 1
  ), r.route_count) into v_previous_count
  from public.route_import_regions r where r.code=p_region_code for update;
  if v_previous_count>0 and
    (p_upserted_count=0 or (v_previous_count>=10 and p_upserted_count<v_previous_count/2.0)) then
    raise exception 'Importación anómala: % rutas frente a % anteriores en %',
      p_upserted_count,v_previous_count,p_region_code;
  end if;

  update public.hiking_route_regions
     set published=false
   where region_code=p_region_code and last_seen_at<p_started_at;

  update public.hiking_routes h set published=exists(
    select 1 from public.hiking_route_regions m
    where m.route_id=h.id and m.published
  ) where h.region_code=p_region_code
     or exists(select 1 from public.hiking_route_regions m where m.route_id=h.id and m.region_code=p_region_code);

  select count(*),count(*) filter(where cardinality(h.incomplete_fields)>0)
    into v_count,v_incomplete
  from public.hiking_route_regions m
  join public.hiking_routes h on h.id=m.route_id
  where m.region_code=p_region_code and m.published and h.published;

  update public.route_import_regions set status='ready',route_count=v_count,
    incomplete_count=v_incomplete,last_completed_at=now(),last_error=null
  where code=p_region_code;

  update public.route_import_runs set status='completed',source_count=p_source_count,
    upserted_count=p_upserted_count,incomplete_count=v_incomplete,completed_at=now()
  where id=p_run_id;

  return jsonb_build_object('route_count',v_count,'incomplete_count',v_incomplete);
end;
$$;

revoke all on function public.claim_next_route_import_region() from public,anon,authenticated;
grant execute on function public.claim_next_route_import_region() to service_role;
revoke all on function public.complete_route_import_region(text,bigint,timestamptz,integer,integer) from public,anon,authenticated;
grant execute on function public.complete_route_import_region(text,bigint,timestamptz,integer,integer) to service_role;

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
        timeout_milliseconds:=60000
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
