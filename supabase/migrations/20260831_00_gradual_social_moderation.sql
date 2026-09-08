create table if not exists public.social_moderation_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  message_excerpt text not null,
  reason text not null,
  severity text not null default 'warning' check(severity in ('warning','urgent')),
  status text not null default 'pending' check(status in ('pending','reviewed','dismissed','sanctioned')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  reviewer_notes text
);

create table if not exists public.social_chat_restrictions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  restricted_until timestamptz not null,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.social_moderation_events enable row level security;
alter table public.social_chat_restrictions enable row level security;
revoke all on public.social_moderation_events,public.social_chat_restrictions from anon,authenticated;
grant select on public.social_chat_restrictions to authenticated;
create policy "users see own chat restriction" on public.social_chat_restrictions
for select to authenticated using(user_id=(select auth.uid()));

create or replace function public.send_social_message(p_body text,p_conversation_id uuid default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  mine uuid:=auth.uid();
  clean_body text:=trim(coalesce(p_body,''));
  new_id bigint;
  recent_warnings integer:=0;
  restricted_until timestamptz;
begin
  if mine is null then raise exception 'authentication_required'; end if;
  select r.restricted_until into restricted_until from public.social_chat_restrictions r
    where r.user_id=mine and r.restricted_until>now();
  if restricted_until is not null then
    return jsonb_build_object('status','restricted','until',restricted_until);
  end if;
  if not exists(select 1 from public.social_aliases where user_id=mine) then raise exception 'alias_required'; end if;
  if char_length(clean_body) not between 1 and 1000 then raise exception 'invalid_message'; end if;
  if p_conversation_id is not null and not exists(
    select 1 from public.private_conversations where id=p_conversation_id and(user_a=mine or user_b=mine)
  ) then raise exception 'conversation_forbidden'; end if;
  if public.social_has_personal_data(clean_body) then return jsonb_build_object('status','personal_data_blocked'); end if;
  if public.social_has_prohibited_language(clean_body) then
    insert into public.social_moderation_events(user_id,message_excerpt,reason)
    values(mine,left(clean_body,240),'Lenguaje potencialmente ofensivo bloqueado antes de publicarse');
    select count(*)::integer into recent_warnings from public.social_moderation_events
      where user_id=mine and created_at>now()-interval '30 days';
    if recent_warnings>=3 then
      insert into public.social_chat_restrictions(user_id,restricted_until,reason)
      values(mine,now()+interval '24 hours','Tres mensajes bloqueados pendientes de revisión')
      on conflict(user_id) do update set restricted_until=excluded.restricted_until,reason=excluded.reason,created_at=now();
      return jsonb_build_object('status','restricted','until',now()+interval '24 hours');
    end if;
    return jsonb_build_object('status','warning','remaining',greatest(0,3-recent_warnings));
  end if;
  insert into public.social_messages(sender_id,conversation_id,body)
  values(mine,p_conversation_id,clean_body) returning id into new_id;
  return jsonb_build_object('status','sent','id',new_id);
end $$;

revoke all on function public.send_social_message(text,uuid) from public,anon;
grant execute on function public.send_social_message(text,uuid) to authenticated;
