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
  return same(points[0], line[0]) && same(points.at(-1), line.at(-1));
}
