drop index if exists public.activity_gps_points_activity_sequence_unique;
drop index if exists public.activity_gps_points_activity_sequence_idx;

create index if not exists accreditation_email_outbox_user_idx
on public.accreditation_email_outbox(user_id);

create index if not exists experience_accreditation_requests_reviewed_by_idx
on public.experience_accreditation_requests(reviewed_by);

create index if not exists private_conversations_user_b_idx
on public.private_conversations(user_b);

create index if not exists route_contribution_rewards_user_idx
on public.route_contribution_rewards(user_id);

create index if not exists social_messages_sender_idx
on public.social_messages(sender_id);

create index if not exists social_moderation_events_user_idx
on public.social_moderation_events(user_id);

create index if not exists social_moderation_events_reviewed_by_idx
on public.social_moderation_events(reviewed_by);

create index if not exists social_user_reports_reported_user_idx
on public.social_user_reports(reported_user_id);

create index if not exists social_user_reports_reviewed_by_idx
on public.social_user_reports(reviewed_by);

create index if not exists user_route_submissions_reviewed_by_idx
on public.user_route_submissions(reviewed_by);
