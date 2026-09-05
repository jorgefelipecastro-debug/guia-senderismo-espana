import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  downloadOfflineCartography,
  removeOfflineCartographySafe,
} from "./mapboxOffline";
export type GeoPoint = { lat: number; lon: number };
export type OfflineRoute = {
  id: string;
  name: string;
  points: GeoPoint[];
  savedAt: string;
  source?: string;
  level?: string;
  distanceKm?: number;
  duration?: string;
  ascentM?: number;
  lat?: number;
  lon?: number;
  packName?: string;
};
const key = (id: string) => `encumbrate:native-route:${id}`;
const INDEX_KEY = "encumbrate:native-route-index";
export async function saveOfflineRoute(route: OfflineRoute) {
  await AsyncStorage.setItem(key(route.id), JSON.stringify(route));
  const ids = JSON.parse(
    (await AsyncStorage.getItem(INDEX_KEY)) || "[]",
  ) as string[];
  await AsyncStorage.setItem(
    INDEX_KEY,
    JSON.stringify([route.id, ...ids.filter((id) => id !== route.id)]),
  );
  return route;
}
export async function readOfflineRoute(id: string) {
  const value = await AsyncStorage.getItem(key(id));
  if (!value) return null;
  try {
    const route = JSON.parse(value) as OfflineRoute;
    if (!route?.id || !Array.isArray(route.points) || route.points.length < 2)
      return null;
    return route;
  } catch {
    return null;
  }
}
export async function listOfflineRoutes() {
  const ids = JSON.parse(
    (await AsyncStorage.getItem(INDEX_KEY)) || "[]",
  ) as string[];
  const routes = await Promise.all(ids.map(readOfflineRoute));
  return routes.filter((route): route is OfflineRoute => Boolean(route));
}
export async function removeOfflineRoute(id: string) {
  const route = await readOfflineRoute(id);
  await removeOfflineCartographySafe(id, route?.packName);
  const ids = JSON.parse(
    (await AsyncStorage.getItem(INDEX_KEY)) || "[]",
  ) as string[];
  await AsyncStorage.multiRemove([key(id)]);
  await AsyncStorage.setItem(
    INDEX_KEY,
    JSON.stringify(ids.filter((item) => item !== id)),
  );
}
export async function refreshOfflineRoute(
  webUrl: string,
  route: OfflineRoute,
  onProgress?: (percentage: number) => void,
) {
  const response = await fetch(
      `${webUrl}/api/routes/track?id=${encodeURIComponent(route.id)}`,
    ),
    body = await response.json();
  if (!response.ok || !Array.isArray(body.points) || body.points.length < 2)
    throw new Error(body.error || "Esta ruta no publica un trazado navegable.");
  const points = validPoints(body.points);
  if (points.length < 2)
    throw new Error("El trazado recibido contiene coordenadas no válidas.");
  const candidate: OfflineRoute = {
      ...route,
      points,
      source: body.source,
      savedAt: new Date().toISOString(),
      distanceKm: route.distanceKm ?? body.distanceKm,
    },
    newPackName = `encumbrate-${route.id}-v${Date.now()}`;
  await downloadOfflineCartography(candidate, onProgress, newPackName);
  const saved = await saveOfflineRoute({ ...candidate, packName: newPackName });
  await removeOfflineCartographySafe(route.id, route.packName).catch(() => {});
  return saved;
}
export async function downloadRoute(
  webUrl: string,
  route: {
    id: string;
    name: string;
    level?: string;
    distanceKm?: number;
    duration?: string;
    ascentM?: number;
    lat?: number;
    lon?: number;
  },
  onProgress?: (percentage: number) => void,
) {
  const response = await fetch(
      `${webUrl}/api/routes/track?id=${encodeURIComponent(route.id)}`,
    ),
    body = await response.json();
  if (!response.ok || !Array.isArray(body.points) || body.points.length < 2)
    throw new Error(body.error || "Esta ruta no publica un trazado navegable.");
  const points = validPoints(body.points);
  if (points.length < 2)
    throw new Error("El trazado recibido contiene coordenadas no válidas.");
  const saved: OfflineRoute = {
    ...route,
    points,
    savedAt: new Date().toISOString(),
    source: body.source,
    distanceKm: route.distanceKm ?? body.distanceKm,
  };
  // Solo se marca como disponible sin conexión cuando tanto el trazado como
  // la cartografía han terminado. Evita ofrecer una falsa garantía offline.
  const packName = await downloadOfflineCartography(saved, onProgress);
  return saveOfflineRoute({ ...saved, packName });
}

function validPoints(points: GeoPoint[]) {
  return points
    .map((point: GeoPoint) => ({
      lat: Number(point?.lat),
      lon: Number(point?.lon),
    }))
    .filter(
      (point: GeoPoint) =>
        Number.isFinite(point.lat) &&
        Math.abs(point.lat) <= 90 &&
        Number.isFinite(point.lon) &&
        Math.abs(point.lon) <= 180,
    );
}
