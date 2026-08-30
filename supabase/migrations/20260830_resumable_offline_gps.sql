-- Conserva las grabaciones antiguas como incompletas antes de imponer una sola sesión activa.
with ranked as (select id,row_number() over(partition by user_id order by started_at desc,id desc) rn from public.route_activities where status='recording')
update public.route_activities a set status='incomplete',ended_at=now(),validation_reason='Grabación anterior cerrada al activar recuperación de sesiones',updated_at=now()
from ranked r where a.id=r.id and r.rn>1;
create unique index if not exists route_activities_one_recording_per_user on public.route_activities(user_id) where status='recording';
create unique index if not exists activity_gps_points_activity_sequence_unique on public.activity_gps_points(activity_id,sequence_number);

create or replace function public.start_external_route_activity(p_route_key text,p_route_name text,p_route_difficulty text,p_planned_distance_km numeric)
returns public.route_activities language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid(); v_activity public.route_activities;
begin
 if v_uid is null then raise exception 'authentication required'; end if;
 update public.route_activities set status='incomplete',ended_at=now(),validation_reason='Grabación caducada recuperada por Encúmbrate',updated_at=now()
 where user_id=v_uid and status='recording' and started_at<now()-interval '12 hours';
 select * into v_activity from public.route_activities where user_id=v_uid and status='recording' limit 1;
 if found then
   if v_activity.external_route_key=p_route_key then return v_activity; end if;
   raise exception 'active_route_exists';
 end if;
 insert into public.route_activities(user_id,external_route_key,route_name,route_difficulty,planned_distance_km,status)
 values(v_uid,p_route_key,left(p_route_name,240),p_route_difficulty,p_planned_distance_km,'recording') returning * into v_activity;
 return v_activity;
end $$;
revoke all on function public.start_external_route_activity(text,text,text,numeric) from public,anon;
grant execute on function public.start_external_route_activity(text,text,text,numeric) to authenticated;

create or replace function public.append_offline_gps_points(p_activity_id uuid,p_points jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid(); v_count integer;
begin
 if v_uid is null then raise exception 'authentication required'; end if;
 if jsonb_typeof(p_points)<>'array' or jsonb_array_length(p_points)>200 then raise exception 'invalid_points'; end if;
 if not exists(select 1 from public.route_activities where id=p_activity_id and user_id=v_uid and status='recording') then raise exception 'activity_not_recording'; end if;
 insert into public.activity_gps_points(activity_id,user_id,sequence_number,recorded_at,latitude,longitude,accuracy_m,altitude_m)
 select p_activity_id,v_uid,(p->>'sequence')::integer,(p->>'at')::timestamptz,(p->>'lat')::numeric,(p->>'lon')::numeric,nullif(p->>'accuracy','')::numeric,nullif(p->>'altitude','')::numeric
 from jsonb_array_elements(p_points) p
 where (p->>'sequence')::integer>0 and (p->>'lat')::numeric between -90 and 90 and (p->>'lon')::numeric between -180 and 180 and coalesce((p->>'accuracy')::numeric,999)<=100
 on conflict(activity_id,sequence_number) do nothing;
 get diagnostics v_count=row_count; return v_count;
end $$;
revoke all on function public.append_offline_gps_points(uuid,jsonb) from public,anon;
grant execute on function public.append_offline_gps_points(uuid,jsonb) to authenticated;
