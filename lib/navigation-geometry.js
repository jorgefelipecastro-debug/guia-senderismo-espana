const R = 6371000;
const rad = (value) => (value * Math.PI) / 180;

export function distanceMetres(a, b) {
  const dLat = rad(b.lat - a.lat),
    dLon = rad(b.lon - a.lon),
    x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function bearingDegrees(a, b) {
  const dLon = rad(b.lon - a.lon),
    lat1 = rad(a.lat),
    lat2 = rad(b.lat);
  return (
    ((Math.atan2(
      Math.sin(dLon) * Math.cos(lat2),
      Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon),
    ) *
      180) /
      Math.PI +
      360) %
    360
  );
}

export function nearestPolylinePoint(position, points) {
  if (!Array.isArray(points) || !points.length) return null;
  if (points.length === 1)
    return {
      point: points[0],
      index: 0,
      fraction: 0,
      distance: distanceMetres(position, points[0]),
    };
  const cos = Math.max(0.01, Math.cos(rad(position.lat))),
    toXY = (point) => ({
      x: rad(point.lon - position.lon) * R * cos,
      y: rad(point.lat - position.lat) * R,
    });
  let best = null;
  for (let index = 0; index < points.length - 1; index++) {
    const a = toXY(points[index]),
      b = toXY(points[index + 1]),
      dx = b.x - a.x,
      dy = b.y - a.y,
      length2 = dx * dx + dy * dy,
      fraction = length2
        ? Math.max(0, Math.min(1, -((a.x * dx + a.y * dy) / length2)))
        : 0,
      x = a.x + dx * fraction,
      y = a.y + dy * fraction,
      distance = Math.hypot(x, y);
    if (!best || distance < best.distance) {
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
  }
  return best;
}

export function normalizeHeading(value) {
  return (((Number(value) || 0) % 360) + 360) % 360;
}

export function gpsFixUsable(fix, { maxAccuracy = 80 } = {}) {
  const lat = Number(fix?.lat),
    lon = Number(fix?.lon),
    accuracy = Number(fix?.accuracy);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180 &&
    Number.isFinite(accuracy) &&
    accuracy >= 0 &&
    accuracy <= maxAccuracy
  );
}

function timestampMs(point) {
  const raw = point?.at ?? point?.timestamp;
  if (Number.isFinite(raw)) return Number(raw);
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function plausibleGpsTransition(
  previous,
  next,
  { maxSpeedMps = 12, minimumAllowanceM = 60 } = {},
) {
  if (!previous) return true;
  const travelled = distanceMetres(previous, next),
    previousAt = timestampMs(previous),
    nextAt = timestampMs(next),
    accuracyAllowance = Math.min(
      100,
      Math.max(0, Number(previous.accuracy) || 0) +
        Math.max(0, Number(next.accuracy) || 0),
    );
  if (previousAt === null || nextAt === null || nextAt <= previousAt)
    return travelled <= Math.max(minimumAllowanceM, accuracyAllowance);
  const elapsedSeconds = Math.max(0.5, (nextAt - previousAt) / 1000),
    allowed = Math.max(
      minimumAllowanceM,
      maxSpeedMps * elapsedSeconds + accuracyAllowance,
    );
  return travelled <= allowed;
}

export function navigationHeading(previous, next) {
  const measured = Number(next?.heading),
    speed = Number(next?.speed);
  if (
    Number.isFinite(measured) &&
    measured >= 0 &&
    Number.isFinite(speed) &&
    speed >= 0.6
  )
    return normalizeHeading(measured);
  if (previous && distanceMetres(previous, next) >= 4)
    return bearingDegrees(previous, next);
  if (Number.isFinite(previous?.heading)) return normalizeHeading(previous.heading);
  return 0;
}

export function routeProximity(distance, accuracy) {
  if (!Number.isFinite(distance)) return { status: "searching", distance: null };
  const safeAccuracy = Number.isFinite(Number(accuracy))
      ? Math.max(3, Math.min(80, Number(accuracy)))
      : 80,
    onTrackM = Math.max(25, Math.min(40, safeAccuracy * 0.9)),
    nearM = Math.max(50, Math.min(85, safeAccuracy * 1.5));
  if (distance <= onTrackM)
    return { status: "on-track", distance, onTrackM, nearM };
  if (distance <= nearM)
    return { status: "near", distance, onTrackM, nearM };
  if (safeAccuracy > 50)
    return { status: "uncertain", distance, onTrackM, nearM };
  return { status: "off-route", distance, onTrackM, nearM };
}

function perpendicularDistance(point, start, end) {
  return nearestPolylinePoint(point, [start, end]).distance;
}

export function simplifyTrack(points, maxPoints = 2000) {
  if (!Array.isArray(points) || points.length <= maxPoints) return points;
  const limit = Math.max(2, Math.floor(maxPoints)),
    importance = new Array(points.length).fill(-1),
    stack = [[0, points.length - 1]];
  importance[0] = Infinity;
  importance[importance.length - 1] = Infinity;
  while (stack.length) {
    const [start, end] = stack.pop();
    if (end - start < 2) continue;
    let maximum = -1,
      selected = -1;
    for (let index = start + 1; index < end; index++) {
      const distance = perpendicularDistance(
        points[index],
        points[start],
        points[end],
      );
      if (distance > maximum) {
        maximum = distance;
        selected = index;
      }
    }
    importance[selected] = maximum;
    stack.push([start, selected], [selected, end]);
  }
  const selected = importance
    .map((score, index) => ({ score, index }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ index }) => index)
    .sort((a, b) => a - b);
  return selected.map((index) => points[index]);
}

export function validateReturnRoute({ from, to, points, distanceM }) {
  if (
    !Array.isArray(points) ||
    points.length < 2 ||
    !Number.isFinite(distanceM) ||
    distanceM <= 0
  )
    return { safe: false, reason: "Geometría de retorno no válida." };
  const direct = Math.max(1, distanceMetres(from, to)),
    startGap = distanceMetres(from, points[0]),
    endGap = distanceMetres(to, points.at(-1));
  if (startGap > 60 || endGap > 60)
    return {
      safe: false,
      reason:
        "La ruta calculada se separa demasiado de tu posición o del sendero.",
    };
  if (distanceM > Math.max(5000, direct * 5))
    return {
      safe: false,
      reason: "El retorno calculado supone un rodeo excesivo.",
    };
  return { safe: true, directM: direct, detourRatio: distanceM / direct };
}

export function breadcrumbReturn(
  position,
  breadcrumbs,
  track,
  arrivalThreshold = 30,
) {
  if (!position || !Array.isArray(breadcrumbs) || !breadcrumbs.length)
    return [];
  const reversed = [position, ...breadcrumbs.slice().reverse()],
    result = [];
  for (const point of reversed) {
    result.push({ lat: point.lat, lon: point.lon });
    const nearest = nearestPolylinePoint(point, track);
    if (result.length > 1 && nearest && nearest.distance <= arrivalThreshold)
      break;
  }
  return result.length > 1 ? result : [];
}
