create index if not exists social_aliases_alias_user_idx
  on public.social_aliases(alias,user_id);

create index if not exists private_conversations_user_a_page_idx
  on public.private_conversations(user_a,created_at desc,id desc);

create index if not exists private_conversations_user_b_page_idx
  on public.private_conversations(user_b,created_at desc,id desc);

create index if not exists route_meetups_upcoming_page_idx
  on public.route_meetups(status,starts_at,id);

create index if not exists moments_user_page_idx
  on public.moments(user_id,captured_at desc,id desc);

create index if not exists moments_community_page_idx
  on public.moments(published_at desc,id desc)
  where visibility='community';

create index if not exists route_activities_user_page_idx
  on public.route_activities(user_id,started_at desc,id desc);
