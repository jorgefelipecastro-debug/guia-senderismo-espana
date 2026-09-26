// An older download may have contained separate relation ways that the
// navigator drew as one line. Keep it for storage management, but do not
// guide a walk with it until a continuous replacement is downloaded.
export function isContinuousOfflineTrack(track) {
  const points = track?.points, segments = track?.segments;
  if (!Array.isArray(points) || points.length < 2 ||
      !Array.isArray(segments) || segments.length !== 1 ||
      !Array.isArray(segments[0]) || segments[0].length < 2) return false;
  const line = segments[0], same = (a, b) =>
    Number.isFinite(a?.lat) && Number.isFinite(a?.lon) &&
    a.lat === b?.lat && a.lon === b?.lon;
  const stepKm = (a, b) => {
    const rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
    return 12742 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  };
  return same(points[0], line[0]) && same(points.at(-1), line.at(-1)) &&
    points.every((point, index) => Number.isFinite(point?.lat) && Number.isFinite(point?.lon) &&
      (index === 0 || stepKm(points[index - 1], point) <= 2));
}
