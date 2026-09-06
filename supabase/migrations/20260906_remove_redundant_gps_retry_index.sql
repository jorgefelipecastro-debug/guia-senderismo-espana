-- La tabla ya dispone de una restricción UNIQUE equivalente en producción.
-- Retira únicamente el índice duplicado creado con el nombre histórico.
drop index if exists public.activity_gps_points_activity_sequence_unique;
