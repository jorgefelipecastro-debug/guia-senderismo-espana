-- Permite registrar rutas públicas externas sin confundirlas con el catálogo GPX oficial.
alter table public.route_activities
  alter column route_id drop not null,
  add column if not exists external_route_key text,
  add column if not exists route_name text,
  add column if not exists route_difficulty text,
  add column if not exists planned_distance_km numeric,
  add column if not exists completed_badge_awarded_at timestamptz;

do $$ begin
  if not exists (select 1 from pg_constraint where conrelid='public.route_activities'::regclass and conname='route_activities_route_reference_check') then
    alter table public.route_activities add constraint route_activities_route_reference_check check (route_id is not null or external_route_key is not null);
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.route_activities'::regclass and conname='route_activities_route_difficulty_check') then
    alter table public.route_activities add constraint route_activities_route_difficulty_check check (route_difficulty is null or route_difficulty in ('principiante','intermedio','experto'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.route_activities'::regclass and conname='route_activities_planned_distance_check') then
    alter table public.route_activities add constraint route_activities_planned_distance_check check (planned_distance_km is null or planned_distance_km > 0);
  end if;
end $$;

grant select, insert on public.route_activities to authenticated;
revoke update on public.route_activities from authenticated;
grant select, insert on public.activity_gps_points to authenticated;
grant select on public.routes, public.route_waypoints to authenticated;
grant usage, select on sequence public.activity_gps_points_id_seq to authenticated;

drop policy if exists "users start own route activities" on public.route_activities;
create policy "users start own route activities" on public.route_activities
for insert to authenticated
with check (
  (select auth.uid())=user_id and status='recording' and ended_at is null
  and distance_km=0 and elevation_gain_m=0 and duration_seconds=0
  and route_coverage_percent=0 and gps_point_count=0 and trophy_earned=false
  and completed_badge_awarded_at is null
);

create or replace function public.finalize_external_route_activity(p_activity_id uuid)
returns public.route_activities
language plpgsql security definer set search_path=''
as $$
declare
  v_uid uuid:=auth.uid(); v_activity public.route_activities;
  v_point_count integer; v_distance_m double precision; v_duration integer;
  v_coverage numeric; v_completed boolean;
begin
  if v_uid is null then raise exception 'authentication required'; end if;
  select a.* into v_activity from public.route_activities a
  where a.id=p_activity_id and a.user_id=v_uid and a.route_id is null
    and a.external_route_key is not null for update;
  if not found then raise exception 'activity not found'; end if;
  if v_activity.status<>'recording' then return v_activity; end if;
  select count(*)::integer,
    greatest(0,extract(epoch from (max(recorded_at)-min(recorded_at)))::integer)
  into v_point_count,v_duration from public.activity_gps_points
  where activity_id=p_activity_id and user_id=v_uid;
  select coalesce(sum(public.haversine_m(latitude,longitude,next_lat,next_lon)),0)
  into v_distance_m from (
    select latitude,longitude,
      lead(latitude) over(order by sequence_number) next_lat,
      lead(longitude) over(order by sequence_number) next_lon
    from public.activity_gps_points where activity_id=p_activity_id and user_id=v_uid
  ) points where next_lat is not null;
  v_coverage:=case when v_activity.planned_distance_km>0
    then least(100,round((100*(v_distance_m/1000)/v_activity.planned_distance_km)::numeric,2)) else 0 end;
  v_completed:=v_point_count>=20 and v_duration>=600 and v_activity.planned_distance_km>0
    and v_distance_m/1000>=v_activity.planned_distance_km*0.80
    and v_distance_m/1000<=v_activity.planned_distance_km*1.50;
  update public.route_activities set
    status=case when v_completed then 'completed' else 'incomplete' end,
    ended_at=now(),distance_km=round((v_distance_m/1000)::numeric,3),
    duration_seconds=v_duration,route_coverage_percent=v_coverage,
    gps_point_count=v_point_count,trophy_earned=v_completed,
    completed_badge_awarded_at=case when v_completed then now() else null end,
    validation_reason=case when v_completed
      then 'Actividad GPS completada: puntos, duración y distancia suficientes'
      else 'Actividad incompleta: faltan puntos GPS, duración o distancia suficiente' end,
    updated_at=now() where id=p_activity_id returning * into v_activity;
  return v_activity;
end;
$$;

revoke all on function public.finalize_external_route_activity(uuid) from public,anon;
grant execute on function public.finalize_external_route_activity(uuid) to authenticated;
