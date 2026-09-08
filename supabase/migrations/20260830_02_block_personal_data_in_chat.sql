create or replace function public.social_has_personal_data(value text) returns boolean
language sql immutable parallel safe set search_path=pg_catalog as $$
  select
    lower(coalesce(value,'')) ~ '[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}'
    or coalesce(value,'') ~ '(^|[^0-9])([+]34[ .-]?)?[6-9]([ .-]?[0-9]){8}([^0-9]|$)'
    or lower(coalesce(value,'')) ~ '(^|[^a-z0-9])[xyz]?[0-9]{7,8}[ -]?[a-z]([^a-z0-9]|$)'
    or upper(coalesce(value,'')) ~ '(^|[^A-Z0-9])ES([ ]?[0-9]){22}([^A-Z0-9]|$)'
    or coalesce(value,'') ~ '(^|[^0-9])([0-9][ -]?){15,19}[0-9]([^0-9]|$)'
$$;

create or replace function public.send_social_message(p_body text,p_conversation_id uuid default null)
returns jsonb language plpgsql security definer
set search_path=public,pg_temp as $$
declare mine uuid:=auth.uid();clean_body text:=trim(coalesce(p_body,''));new_id bigint;
begin
  if mine is null then raise exception 'authentication_required'; end if;
  if exists(select 1 from public.social_suspensions where user_id=mine) then return jsonb_build_object('status','suspended'); end if;
  if not exists(select 1 from public.social_aliases where user_id=mine) then raise exception 'alias_required'; end if;
  if char_length(clean_body) not between 1 and 1000 then raise exception 'invalid_message'; end if;
  if p_conversation_id is not null and not exists(select 1 from public.private_conversations where id=p_conversation_id and(user_a=mine or user_b=mine)) then raise exception 'conversation_forbidden'; end if;
  if public.social_has_personal_data(clean_body) then return jsonb_build_object('status','personal_data_blocked'); end if;
  if public.social_has_prohibited_language(clean_body) then
    insert into public.social_suspensions(user_id,reason) values(mine,'Lenguaje ofensivo inequívoco en el chat') on conflict(user_id) do nothing;
    return jsonb_build_object('status','suspended');
  end if;
  insert into public.social_messages(sender_id,conversation_id,body) values(mine,p_conversation_id,clean_body) returning id into new_id;
  return jsonb_build_object('status','sent','id',new_id);
end $$;

revoke all on function public.social_has_personal_data(text) from public,anon,authenticated;
revoke all on function public.send_social_message(text,uuid) from public,anon;
grant execute on function public.send_social_message(text,uuid) to authenticated;
