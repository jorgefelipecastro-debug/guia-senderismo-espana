create table if not exists public.application_errors (
  fingerprint text primary key check (fingerprint ~ '^[a-f0-9]{64}$'),
  source text not null check (source in ('client','server','health')),
  severity text not null default 'error' check (severity in ('warning','error','critical')),
  message text not null check (char_length(message) between 1 and 1000),
  stack text check (stack is null or char_length(stack)<=8000),
  route text check (route is null or char_length(route)<=300),
  request_id text check (request_id is null or char_length(request_id)<=200),
  release text check (release is null or char_length(release)<=100),
  metadata jsonb not null default '{}'::jsonb,
  occurrences bigint not null default 1 check (occurrences>0),
  status text not null default 'open' check (status in ('open','acknowledged','resolved')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);

create index if not exists application_errors_open_idx
  on public.application_errors(severity,last_seen_at desc)
  where status<>'resolved';

create index if not exists application_errors_reviewed_by_idx
  on public.application_errors(reviewed_by)
  where reviewed_by is not null;

alter table public.application_errors enable row level security;
revoke all on public.application_errors from public,anon,authenticated;
grant select,insert,update on public.application_errors to service_role;

comment on table public.application_errors is
  'Registro privado, agrupado y redactado de incidencias de aplicación.';

create or replace function public.record_application_error(
  p_fingerprint text,p_source text,p_severity text,p_message text,p_stack text,
  p_route text,p_request_id text,p_release text,p_metadata jsonb
) returns void
language plpgsql
security invoker
set search_path=''
as $$
begin
  insert into public.application_errors(fingerprint,source,severity,message,stack,route,request_id,release,metadata)
  values(p_fingerprint,p_source,p_severity,p_message,p_stack,p_route,p_request_id,p_release,coalesce(p_metadata,'{}'::jsonb))
  on conflict(fingerprint) do update set
    severity=case when public.application_errors.severity='critical' or excluded.severity='critical' then 'critical' else excluded.severity end,
    message=excluded.message,stack=excluded.stack,request_id=excluded.request_id,release=excluded.release,
    metadata=excluded.metadata,occurrences=public.application_errors.occurrences+1,
    status=case when public.application_errors.status='acknowledged' then 'acknowledged' else 'open' end,
    last_seen_at=now(),resolved_at=null;
end
$$;

revoke all on function public.record_application_error(text,text,text,text,text,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.record_application_error(text,text,text,text,text,text,text,text,jsonb) to service_role;

select cron.schedule(
  'encumbrate-monitoring-retention','15 4 * * *',
  $$delete from public.application_errors where status='resolved' and last_seen_at<now()-interval '90 days'$$
)
where not exists(select 1 from cron.job where jobname='encumbrate-monitoring-retention');
