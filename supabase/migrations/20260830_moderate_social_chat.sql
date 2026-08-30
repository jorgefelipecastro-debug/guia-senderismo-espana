create table if not exists public.social_suspensions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reason text not null,
  source text not null default 'automatic_moderation',
  suspended_at timestamptz not null default now()
);

alter table public.social_suspensions enable row level security;
revoke all on public.social_suspensions from anon, authenticated;
grant select on public.social_suspensions to authenticated;
create policy "users see own suspension" on public.social_suspensions
for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.social_normalize(value text) returns text
language sql immutable parallel safe set search_path = pg_catalog as $$
  select regexp_replace(
    translate(lower(trim(coalesce(value,''))),
      'áàäâéèëêíìïîóòöôúùüûñç',
      'aaaaeeeeiiiioooouuuunc'),
    '[^a-z0-9]+', ' ', 'g')
$$;

create unique index if not exists social_aliases_normalized_unique
on public.social_aliases (public.social_normalize(alias));

create or replace function public.social_has_prohibited_language(value text) returns boolean
language sql immutable parallel safe set search_path = pg_catalog, public as $$
  select public.social_normalize(value) ~
    '(^| )(puta|puto|putas|putos|gilipollas|cabron|cabrona|cabrones|cabronas|hijoputa|hijodeputa|maricon|maricones|zorra|zorras|subnormal|retrasado|retrasada|imbecil|idiota|mierda|joder|coño|polla|hostia|follar|negro de mierda|moro de mierda|sudaca|machupichu|bollera|travelo)( |$)'
$$;

create or replace function public.set_social_alias(p_alias text) returns text
language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  mine uuid := auth.uid();
  clean_alias text := regexp_replace(trim(coalesce(p_alias,'')), '\s+', ' ', 'g');
begin
  if mine is null then raise exception 'authentication_required'; end if;
  if exists(select 1 from public.social_suspensions where user_id=mine) then
    raise exception 'account_suspended';
  end if;
  if char_length(clean_alias) not between 3 and 30 or clean_alias !~ '^[[:alnum:]_ -]+$' then
    raise exception 'invalid_alias';
  end if;
  if public.social_has_prohibited_language(clean_alias) then
    raise exception 'prohibited_alias';
  end if;
  insert into public.social_aliases(user_id,alias,updated_at)
  values(mine,clean_alias,now())
  on conflict(user_id) do update set alias=excluded.alias,updated_at=now();
  return clean_alias;
exception when unique_violation then
  raise exception 'alias_taken';
end $$;

create or replace function public.send_social_message(p_body text,p_conversation_id uuid default null)
returns jsonb language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  mine uuid := auth.uid();
  clean_body text := trim(coalesce(p_body,''));
  new_id bigint;
begin
  if mine is null then raise exception 'authentication_required'; end if;
  if exists(select 1 from public.social_suspensions where user_id=mine) then
    return jsonb_build_object('status','suspended');
  end if;
  if not exists(select 1 from public.social_aliases where user_id=mine) then
    raise exception 'alias_required';
  end if;
  if char_length(clean_body) not between 1 and 1000 then
    raise exception 'invalid_message';
  end if;
  if p_conversation_id is not null and not exists(
    select 1 from public.private_conversations
    where id=p_conversation_id and (user_a=mine or user_b=mine)
  ) then raise exception 'conversation_forbidden'; end if;
  if public.social_has_prohibited_language(clean_body) then
    insert into public.social_suspensions(user_id,reason)
    values(mine,'Lenguaje ofensivo inequívoco en el chat')
    on conflict(user_id) do nothing;
    return jsonb_build_object('status','suspended');
  end if;
  insert into public.social_messages(sender_id,conversation_id,body)
  values(mine,p_conversation_id,clean_body) returning id into new_id;
  return jsonb_build_object('status','sent','id',new_id);
end $$;

revoke all on function public.social_normalize(text) from public,anon,authenticated;
revoke all on function public.social_has_prohibited_language(text) from public,anon,authenticated;
revoke all on function public.set_social_alias(text) from public,anon;
revoke all on function public.send_social_message(text,uuid) from public,anon;
grant execute on function public.set_social_alias(text) to authenticated;
grant execute on function public.send_social_message(text,uuid) to authenticated;
revoke insert,update on public.social_aliases from authenticated;
revoke insert on public.social_messages from authenticated;
