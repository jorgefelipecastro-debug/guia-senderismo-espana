create index if not exists moments_route_activity_idx
on public.moments(route_activity_id)
where route_activity_id is not null;
