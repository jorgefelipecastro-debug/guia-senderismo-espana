// A route needs tiles around its line, not across its entire bounding box.
// Keep this module free of browser APIs so the app and standalone viewer can
// plan exactly the same offline download.
const rad = value => value * Math.PI / 180;
const key = (z, x, y) => `${z}/${x}/${y}`;

function tilePosition(point, z) {
  const n = 2 ** z, latitude = Math.max(-85.05112878, Math.min(85.05112878, point.lat));
  return {
    x: (point.lon + 180) / 360 * n,
    y: (1 - Math.asinh(Math.tan(rad(latitude))) / Math.PI) / 2 * n,
  };
}

function corridorAtZoom(points, z, paddingMeters, selected, limit) {
  const n = 2 ** z;
  for (let index = 0; index < points.length; index++) {
    const current = tilePosition(points[index], z);
    const previous = index ? tilePosition(points[index - 1], z) : current;
    const steps = Math.max(1, Math.ceil(2 * Math.max(Math.abs(current.x - previous.x), Math.abs(current.y - previous.y))));
    const latitude = (points[index].lat + points[Math.max(0, index - 1)].lat) / 2;
    const metresPerTile = 40075016.686 * Math.max(.1, Math.cos(rad(latitude))) / n;
    const margin = Math.ceil(paddingMeters / metresPerTile);
    for (let step = 0; step <= steps; step++) {
      const x = Math.floor(previous.x + (current.x - previous.x) * step / steps);
      const y = Math.floor(previous.y + (current.y - previous.y) * step / steps);
      for (let dx = -margin; dx <= margin; dx++) for (let dy = -margin; dy <= margin; dy++) {
        const tx = x + dx, ty = y + dy;
        if (tx < 0 || tx >= n || ty < 0 || ty >= n) continue;
        const id = key(z, tx, ty);
        if (!selected.has(id)) selected.set(id, { z, x: tx, y: ty, key: id });
      }
      if (selected.size > limit) return false;
    }
  }
  return true;
}

export function routeCorridorTiles(points, { minZoom = 8, maxZoom = 15, paddingMeters = 1200, limit = 1200 } = {}) {
  if (!Array.isArray(points) || points.length < 2 || points.some(p =>
    !Number.isFinite(p?.lat) || !Number.isFinite(p?.lon) || p.lat < -85 || p.lat > 85 || p.lon < -180 || p.lon > 180))
    throw Error('El trazado no tiene coordenadas válidas.');
  if (!Number.isInteger(minZoom) || !Number.isInteger(maxZoom) || minZoom < 5 || maxZoom > 15 || minZoom > maxZoom)
    throw Error('Niveles de mapa no válidos.');
  for (let highest = maxZoom; highest >= minZoom; highest--) {
    const selected = new Map();
    let complete = true;
    for (let z = minZoom; z <= highest; z++) {
      if (!corridorAtZoom(points, z, paddingMeters, selected, limit)) { complete = false; break; }
    }
    if (complete) return { tiles: [...selected.values()], minZoom, maxZoom: highest };
  }
  throw Error('La ruta requiere más espacio del disponible para su mapa offline.');
}
