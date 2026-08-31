alter table public.route_activities
  add column if not exists elevation_loss_m integer not null default 0 check (elevation_loss_m>=0),
  add column if not exists min_altitude_m integer,
  add column if not exists max_altitude_m integer;

create or replace function public.finalize_external_route_activity(p_activity_id uuid)
returns public.route_activities language plpgsql security definer set search_path='' as $$
declare
  v_uid uuid:=auth.uid(); v_activity public.route_activities;
  v_point_count integer; v_distance_m double precision; v_duration integer;
  v_coverage numeric; v_completed boolean;
  v_gain integer:=0; v_loss integer:=0; v_min_alt integer; v_max_alt integer;
begin
  if v_uid is null then raise exception 'authentication required'; end if;
  select a.* into v_activity from public.route_activities a where a.id=p_activity_id and a.user_id=v_uid and a.route_id is null and a.external_route_key is not null for update;
  if not found then raise exception 'activity not found'; end if;
  if v_activity.status<>'recording' then return v_activity; end if;
  select count(*)::integer,greatest(0,extract(epoch from (max(recorded_at)-min(recorded_at)))::integer) into v_point_count,v_duration from public.activity_gps_points where activity_id=p_activity_id and user_id=v_uid;
  select coalesce(sum(public.haversine_m(latitude,longitude,next_lat,next_lon)),0) into v_distance_m from (
    select latitude,longitude,lead(latitude) over(order by sequence_number) next_lat,lead(longitude) over(order by sequence_number) next_lon
    from public.activity_gps_points where activity_id=p_activity_id and user_id=v_uid
  ) points where next_lat is not null;

  with altitude_points as (
    select sequence_number,round(avg(altitude_m) over(order by sequence_number rows between 1 preceding and 1 following))::integer altitude
    from public.activity_gps_points where activity_id=p_activity_id and user_id=v_uid and altitude_m is not null and coalesce(accuracy_m,999)<=50
  ), changes as (
    select altitude,altitude-lag(altitude) over(order by sequence_number) delta from altitude_points
  )
  select coalesce(sum(case when delta between 3 and 60 then delta else 0 end),0)::integer,
    coalesce(sum(case when delta between -60 and -3 then -delta else 0 end),0)::integer,
    min(altitude),max(altitude) into v_gain,v_loss,v_min_alt,v_max_alt from changes;

  v_coverage:=case when v_activity.planned_distance_km>0 then least(100,round((100*(v_distance_m/1000)/v_activity.planned_distance_km)::numeric,2)) else 0 end;
  v_completed:=v_point_count>=20 and v_duration>=600 and v_activity.planned_distance_km>0 and v_distance_m/1000>=v_activity.planned_distance_km*0.80 and v_distance_m/1000<=v_activity.planned_distance_km*1.50;
  update public.route_activities set status=case when v_completed then 'completed' else 'incomplete' end,ended_at=now(),distance_km=round((v_distance_m/1000)::numeric,3),duration_seconds=v_duration,
    elevation_gain_m=v_gain,elevation_loss_m=v_loss,min_altitude_m=v_min_alt,max_altitude_m=v_max_alt,
    route_coverage_percent=v_coverage,gps_point_count=v_point_count,trophy_earned=v_completed,completed_badge_awarded_at=case when v_completed then now() else null end,
    validation_reason=case when v_completed then 'Actividad GPS completada: puntos, duración y distancia suficientes' else 'Actividad incompleta: faltan puntos GPS, duración o distancia suficiente' end,updated_at=now()
  where id=p_activity_id returning * into v_activity;
  return v_activity;
end $$;
revoke all on function public.finalize_external_route_activity(uuid) from public,anon;
grant execute on function public.finalize_external_route_activity(uuid) to authenticated;
