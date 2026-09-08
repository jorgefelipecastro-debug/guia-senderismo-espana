create index if not exists application_errors_reviewed_by_idx
  on public.application_errors(reviewed_by)
  where reviewed_by is not null;
