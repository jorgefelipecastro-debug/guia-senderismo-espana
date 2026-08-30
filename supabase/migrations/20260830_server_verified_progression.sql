alter table public.profiles
  add column if not exists progression_xp integer not null default 0 check (progression_xp>=0),
  add column if not exists completed_routes integer not null default 0 check (completed_routes>=0),
  add column if not exists total_distance_km numeric not null default 0 check (total_distance_km>=0),
  add column if not exists total_elevation_gain_m integer not null default 0 check (total_elevation_gain_m>=0),
  add column if not exists progression_badge text not null default 'principiante';

create or replace function public.recompute_verified_progression(p_user_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare
  v_routes integer:=0; v_distance numeric:=0; v_elevation integer:=0; v_route_xp integer:=0;
  v_contribution_xp integer:=0; v_approved integer:=0; v_xp integer:=0;
  v_accredited text; v_badge text:='principiante';
  v_badges text[][]:=array[
    array['principiante-1','Principiante 1','150','🥉'],array['principiante-2','Principiante 2','300','🥈'],array['principiante-3','Principiante 3','450','🥇'],
    array['intermedio','Intermedio','750','🦎'],array['intermedio-1','Intermedio 1','1050','🥉'],array['intermedio-2','Intermedio 2','1350','🥈'],array['intermedio-3','Intermedio 3','1650','🥇'],
    array['experto','Experto','2150','🐍'],array['experto-1','Experto 1','2750','🥉'],array['experto-2','Experto 2','3350','🥈'],array['experto-3','Experto 3','3950','🥇'],array['maestro-encumbrate','Maestro Encúmbrate','5950','👑']
  ];
  b text[];
begin
  select count(*)::integer,coalesce(sum(distance_km),0),coalesce(sum(elevation_gain_m),0)::integer,
    coalesce(sum(100 + least(500,floor(coalesce(distance_km,0)*10)::integer) + least(300,floor(coalesce(elevation_gain_m,0)/100.0)::integer*10)),0)::integer
  into v_routes,v_distance,v_elevation,v_route_xp from public.route_activities
  where user_id=p_user_id and status='completed' and trophy_earned=true;
  select coalesce(sum(xp_awarded),0)::integer,count(*)::integer into v_contribution_xp,v_approved
  from public.route_contribution_rewards where user_id=p_user_id;
  v_xp:=v_route_xp+v_contribution_xp;
  select accredited_level into v_accredited from public.profiles where id=p_user_id for update;
  if not found then return; end if;

  if v_xp>=150 then v_badge:='principiante-1'; end if;
  if v_xp>=300 then v_badge:='principiante-2'; end if;
  if v_xp>=450 then v_badge:='principiante-3'; end if;
  if v_xp>=750 then v_badge:='intermedio'; end if;
  if v_xp>=1050 then v_badge:='intermedio-1'; end if;
  if v_xp>=1350 then v_badge:='intermedio-2'; end if;
  if v_xp>=1650 then v_badge:='intermedio-3'; end if;
  if v_accredited='experto' and v_xp>=2150 then v_badge:='experto'; end if;
  if v_accredited='experto' and v_xp>=2750 then v_badge:='experto-1'; end if;
  if v_accredited='experto' and v_xp>=3350 then v_badge:='experto-2'; end if;
  if v_accredited='experto' and v_xp>=3950 then v_badge:='experto-3'; end if;
  if v_accredited='experto' and v_xp>=5950 and v_approved>=5 then v_badge:='maestro-encumbrate'; end if;

  update public.profiles set progression_xp=v_xp,completed_routes=v_routes,total_distance_km=round(v_distance,2),
    total_elevation_gain_m=v_elevation,approved_route_contributions=v_approved,contributor_xp=v_contribution_xp,
    progression_badge=v_badge,progression_level=case when v_badge like 'experto%' or v_badge='maestro-encumbrate' then 'experto' when v_badge like 'intermedio%' then 'intermedio' else 'principiante' end,updated_at=now()
  where id=p_user_id;

  foreach b slice 1 in array v_badges loop
    if v_xp>=b[3]::integer
      and (b[1] not like 'experto%' or v_accredited='experto')
      and (b[1]<>'maestro-encumbrate' or (v_accredited='experto' and v_approved>=5)) then
      insert into public.social_achievement_posts(user_id,achievement_key,title,description,badge_icon,metadata)
      values(p_user_id,'badge:'||b[1],b[2],'Ha desbloqueado la insignia '||b[2]||' con progreso verificado por Encúmbrate.',b[4],jsonb_build_object('badge',b[1],'xp',b[3]::integer))
      on conflict(user_id,achievement_key) do nothing;
    end if;
  end loop;
end $$;
revoke all on function public.recompute_verified_progression(uuid) from public,anon,authenticated;

create or replace function public.refresh_progression_from_activity() returns trigger language plpgsql security definer set search_path='' as $$
begin perform public.recompute_verified_progression(new.user_id); return new; end $$;
revoke all on function public.refresh_progression_from_activity() from public,anon,authenticated;
drop trigger if exists refresh_progression_from_activity on public.route_activities;
create trigger refresh_progression_from_activity after update of status,trophy_earned,distance_km,elevation_gain_m on public.route_activities for each row
when (new.status='completed' and new.trophy_earned=true) execute function public.refresh_progression_from_activity();

create or replace function public.refresh_progression_from_contribution() returns trigger language plpgsql security definer set search_path='' as $$
begin perform public.recompute_verified_progression(new.user_id); return new; end $$;
revoke all on function public.refresh_progression_from_contribution() from public,anon,authenticated;
drop trigger if exists refresh_progression_from_contribution on public.route_contribution_rewards;
create trigger refresh_progression_from_contribution after insert or update of xp_awarded on public.route_contribution_rewards for each row execute function public.refresh_progression_from_contribution();

do $$ declare u record; begin for u in select id from public.profiles loop perform public.recompute_verified_progression(u.id); end loop; end $$;
