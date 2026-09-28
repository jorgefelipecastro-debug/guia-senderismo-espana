export function classifyHikingRoute(distanceKm, ascentM, officialDifficulty = null) {
  // The author of a verified route may know about technical exposure that
  // distance and ascent alone cannot capture, especially in high mountains.
  if (officialDifficulty === 'alta' || officialDifficulty === 'muy_alta') return 'experto';
  if (!Number.isFinite(distanceKm) || !Number.isFinite(ascentM)) return 'sin_clasificar';
  if (distanceKm >= 20 || ascentM >= 1000) return 'experto';
  if (distanceKm <= 10 && ascentM <= 400) return 'principiante';
  return 'intermedio';
}
