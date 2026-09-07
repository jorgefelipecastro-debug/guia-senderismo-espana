create or replace function public.my_route_activity_duration_seconds()
returns bigint
language sql
stable
security invoker
set search_path=public
as $$
  select coalesce(sum(duration_seconds),0)::bigint
  from public.route_activities
  where user_id=(select auth.uid())
    and status='completed'
    and trophy_earned=true
$$;
revoke all on function public.my_route_activity_duration_seconds() from public,anon;
grant execute on function public.my_route_activity_duration_seconds() to authenticated;
