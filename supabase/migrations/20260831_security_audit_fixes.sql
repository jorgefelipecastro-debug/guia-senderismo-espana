alter table public.social_user_reports
add column if not exists reviewed_by uuid references auth.users(id);

-- Supabase Data API adopta permisos explícitos para objetos nuevos.
-- Estas tablas siguen siendo privadas y solo se exponen en la medida mínima
-- que requiere el cliente; RLS continúa aplicándose a todas ellas.
grant select on public.social_user_reports to authenticated;
revoke insert, update, delete on public.social_user_reports from authenticated;

grant select on public.social_chat_restrictions to authenticated;
revoke insert, update, delete on public.social_chat_restrictions from authenticated;
