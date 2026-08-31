create table if not exists public.social_aliases (
  user_id uuid primary key references auth.users(id) on delete cascade,
  alias text not null check (char_length(alias) between 3 and 30 and alias ~ '^[[:alnum:]_ -]+$'),
  alias_key text generated always as (lower(trim(alias))) stored unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.private_conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_a<>user_b),
  unique(user_a,user_b)
);

create table if not exists public.social_messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.private_conversations(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
create index if not exists social_messages_public_idx on public.social_messages(created_at desc) where conversation_id is null;
create index if not exists social_messages_private_idx on public.social_messages(conversation_id,created_at desc) where conversation_id is not null;

alter table public.social_aliases enable row level security;
alter table public.private_conversations enable row level security;
alter table public.social_messages enable row level security;
revoke all on public.social_aliases,public.private_conversations,public.social_messages from anon;
grant select,insert,update on public.social_aliases to authenticated;
grant select on public.private_conversations to authenticated;
grant select,insert on public.social_messages to authenticated;

create policy "signed users see aliases" on public.social_aliases for select to authenticated using (true);
create policy "users create own alias" on public.social_aliases for insert to authenticated with check(user_id=(select auth.uid()));
create policy "users update own alias" on public.social_aliases for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "participants see conversations" on public.private_conversations for select to authenticated
using(user_a=(select auth.uid()) or user_b=(select auth.uid()));
create policy "signed users see community and own private messages" on public.social_messages for select to authenticated
using(conversation_id is null or exists(select 1 from public.private_conversations c where c.id=conversation_id and ((select auth.uid())=c.user_a or (select auth.uid())=c.user_b)));
create policy "users send community and own private messages" on public.social_messages for insert to authenticated
with check(sender_id=(select auth.uid()) and (conversation_id is null or exists(select 1 from public.private_conversations c where c.id=conversation_id and ((select auth.uid())=c.user_a or (select auth.uid())=c.user_b))));

create or replace function public.start_private_conversation(p_other_user uuid) returns uuid
language plpgsql security definer set search_path=public as $$
declare mine uuid:=auth.uid(); first_user uuid; second_user uuid; result uuid;
begin
  if mine is null or p_other_user is null or mine=p_other_user then raise exception 'invalid participant'; end if;
  if not exists(select 1 from public.social_aliases where user_id=mine)
     or not exists(select 1 from public.social_aliases where user_id=p_other_user) then raise exception 'alias required'; end if;
  first_user:=least(mine,p_other_user);second_user:=greatest(mine,p_other_user);
  insert into public.private_conversations(user_a,user_b) values(first_user,second_user)
  on conflict(user_a,user_b) do update set user_a=excluded.user_a returning id into result;
  return result;
end $$;
revoke all on function public.start_private_conversation(uuid) from public,anon;
grant execute on function public.start_private_conversation(uuid) to authenticated;

do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='social_messages') then
    alter publication supabase_realtime add table public.social_messages;
  end if;
end $$;

