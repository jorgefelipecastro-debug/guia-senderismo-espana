-- Must run after route_meetups creates the trigger function.
revoke all on function public.meetup_after_create() from public,anon,authenticated;
