export function classifyHikingRoute(distanceKm, ascentM) {
  if (!Number.isFinite(distanceKm) || !Number.isFinite(ascentM)) return 'sin_clasificar';
  if (distanceKm >= 20 || ascentM >= 1000) return 'experto';
  if (distanceKm <= 10 && ascentM <= 400) return 'principiante';
  return 'intermedio';
}
