export function hasCoreMetrics(route) {
  return Number.isFinite(route?.distanceKm) && route.distanceKm > 0 && Boolean(route?.duration);
}

export function hasAltitudeProfile(route) {
  return Number.isFinite(route?.minAltitudeM) && Number.isFinite(route?.maxAltitudeM) && route.maxAltitudeM >= route.minAltitudeM;
}

export function hasRequiredMetrics(route) {
  return hasCoreMetrics(route)
    && Number.isFinite(route?.ascentM)
    && route.ascentM >= 0
    && hasAltitudeProfile(route);
}
