const rad = (value) => (value * Math.PI) / 180;
export function distanceMetres(a, b) {
  const dLat = rad(b.lat - a.lat),
    dLon = rad(b.lon - a.lon),
    x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
export function nearestTrackPoint(position, points) {
  if (!points?.length) return null;
  if (points.length === 1)
    return {
      point: points[0],
      index: 0,
      fraction: 0,
      distance: distanceMetres(position, points[0]),
    };
  const radius = 6371000,
    cos = Math.max(0.01, Math.cos(rad(position.lat))),
    xy = (point) => ({
      x: rad(point.lon - position.lon) * radius * cos,
      y: rad(point.lat - position.lat) * radius,
    });
  let best = null;
  for (let index = 0; index < points.length - 1; index++) {
    const a = xy(points[index]),
      b = xy(points[index + 1]),
      dx = b.x - a.x,
      dy = b.y - a.y,
      length2 = dx * dx + dy * dy,
      fraction = length2
        ? Math.max(0, Math.min(1, -((a.x * dx + a.y * dy) / length2)))
        : 0,
      x = a.x + dx * fraction,
      y = a.y + dy * fraction,
      distance = Math.hypot(x, y);
    if (!best || distance < best.distance)
      best = {
        point: {
          lat:
            points[index].lat +
            (points[index + 1].lat - points[index].lat) * fraction,
          lon:
            points[index].lon +
            (points[index + 1].lon - points[index].lon) * fraction,
        },
        index,
        fraction,
        distance,
      };
  }
  return best;
}
export function normalizeHeading(value) {
  return (((Number(value) || 0) % 360) + 360) % 360;
}
export function smoothHeading(previous, next, weight = 0.28) {
  const from = normalizeHeading(previous),
    to = normalizeHeading(next);
  const delta = ((to - from + 540) % 360) - 180;
  return normalizeHeading(from + delta * Math.max(0, Math.min(1, weight)));
}
export function breadcrumbReturn(
  position,
  breadcrumbs,
  track,
  arrivalThreshold = 30,
) {
  if (!position || !breadcrumbs?.length) return [];
  const reversed = [position, ...breadcrumbs.slice().reverse()],
    result = [];
  for (const point of reversed) {
    result.push({ lat: point.lat, lon: point.lon });
    const nearest = nearestTrackPoint(point, track);
    if (result.length > 1 && nearest && nearest.distance <= arrivalThreshold)
      break;
  }
  return result.length > 1 ? result : [];
}
