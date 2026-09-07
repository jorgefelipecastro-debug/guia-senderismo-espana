-- Límite distribuido para todas las APIs. Las identidades e IP se guardan como HMAC,
-- nunca como valores originales, y la tabla no está expuesta por la Data API.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.api_rate_limits (
  scope text not null,
  subject_hash text not null check (subject_hash ~ '^[a-f0-9]{64}$'),
  window_start timestamptz not null,
  window_seconds integer not null check (window_seconds between 1 and 86400),
  request_count integer not null default 1 check (request_count > 0),
  expires_at timestamptz not null,
  primary key (scope, subject_hash, window_start)
);

create index if not exists api_rate_limits_expiry_idx
  on private.api_rate_limits (expires_at);

revoke all on private.api_rate_limits from public, anon, authenticated;

create or replace function public.enforce_api_rate_limit(
  p_scope text,
  p_ip_hash text,
  p_user_hash text,
  p_ip_limit integer,
  p_user_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer,
  limit_value integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_start timestamptz;
  v_expires_at timestamptz;
  v_subject text;
  v_subject_limit integer;
  v_count integer;
  v_allowed boolean := true;
  v_remaining integer := 2147483647;
begin
  if p_scope is null or length(p_scope) not between 1 and 80
     or p_ip_hash !~ '^[a-f0-9]{64}$'
     or (p_user_hash is not null and p_user_hash !~ '^[a-f0-9]{64}$')
     or p_ip_limit not between 1 and 10000
     or p_user_limit not between 1 and 10000
     or p_window_seconds not between 1 and 86400 then
    raise exception 'Invalid rate limit arguments';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );
  v_expires_at := v_window_start + make_interval(secs => p_window_seconds * 2);

  for v_subject, v_subject_limit in
    select values_to_check.subject_hash, values_to_check.subject_limit
    from (values (p_ip_hash, p_ip_limit), (p_user_hash, p_user_limit))
      as values_to_check(subject_hash, subject_limit)
    where values_to_check.subject_hash is not null
  loop
    insert into private.api_rate_limits (
      scope, subject_hash, window_start, window_seconds, request_count, expires_at
    ) values (
      p_scope, v_subject, v_window_start, p_window_seconds, 1, v_expires_at
    )
    on conflict (scope, subject_hash, window_start) do update
      set request_count = private.api_rate_limits.request_count + 1,
          expires_at = excluded.expires_at
    returning request_count into v_count;
    v_allowed := v_allowed and v_count <= v_subject_limit;
    v_remaining := least(v_remaining, greatest(0, v_subject_limit - v_count));
  end loop;

  if random() < 0.01 then
    delete from private.api_rate_limits where expires_at < v_now;
  end if;

  return query select
    v_allowed,
    v_remaining,
    greatest(0, ceil(extract(epoch from (v_window_start + make_interval(secs => p_window_seconds) - v_now)))::integer),
    case when p_user_hash is null then p_ip_limit else p_user_limit end;
end;
$$;

revoke all on function public.enforce_api_rate_limit(text,text,text,integer,integer,integer)
  from public, anon, authenticated;
grant execute on function public.enforce_api_rate_limit(text,text,text,integer,integer,integer)
  to service_role;

comment on function public.enforce_api_rate_limit(text,text,text,integer,integer,integer)
  is 'Contador atómico por IP y usuario para las APIs de Encúmbrate; acceso exclusivo del servidor.';
