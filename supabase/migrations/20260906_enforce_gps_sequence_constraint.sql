-- Garantía final para instalaciones nuevas: un punto de una actividad no puede
-- repetirse al recuperar una sincronización interrumpida.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.activity_gps_points'::regclass
      and conname = 'activity_gps_points_activity_id_sequence_number_key'
  ) then
    alter table public.activity_gps_points
      add constraint activity_gps_points_activity_id_sequence_number_key
      unique (activity_id, sequence_number);
  end if;
end
$$;
