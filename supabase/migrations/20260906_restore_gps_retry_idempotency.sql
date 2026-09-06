-- Un corte puede ocurrir después de insertar un lote GPS en el servidor y antes
-- de que el dispositivo confirme su borrado local. La secuencia debe poder
-- reenviarse sin crear puntos duplicados.
begin;

create unique index if not exists activity_gps_points_activity_sequence_unique
on public.activity_gps_points(activity_id, sequence_number);

commit;
