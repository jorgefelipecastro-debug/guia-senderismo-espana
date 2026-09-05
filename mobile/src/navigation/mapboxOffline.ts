import Mapbox, { offlineManager } from "@rnmapbox/maps";
import type { OfflineRoute } from "./routeStorage";
import { isPackComplete, offlineBounds } from "./offlineGeometry.mjs";

const publicToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
if (publicToken) Mapbox.setAccessToken(publicToken);

export async function downloadOfflineCartography(
  route: OfflineRoute,
  onProgress?: (percentage: number) => void,
  requestedName?: string,
) {
  if (!publicToken)
    throw new Error("Falta configurar el token público de Mapbox.");
  const name = requestedName || route.packName || `encumbrate-${route.id}`,
    existing = await offlineManager.getPack(name);
  if (existing) {
    const status = await existing.status();
    if (isPackComplete(status)) {
      onProgress?.(100);
      return name;
    }
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => {
          offlineManager.unsubscribe(name);
          reject(new Error("La descarga del mapa no terminó a tiempo."));
        },
        10 * 60 * 1000,
      );
      offlineManager
        .subscribe(
          name,
          (_pack, next) => {
            onProgress?.(next.percentage);
            if (isPackComplete(next)) {
              clearTimeout(timeout);
              offlineManager.unsubscribe(name);
              resolve();
            }
          },
          (_pack, error) => {
            clearTimeout(timeout);
            offlineManager.unsubscribe(name);
            reject(
              new Error(error.message || "No se pudo reanudar la cartografía."),
            );
          },
        )
        .then(() => existing.resume())
        .catch(reject);
    });
    return name;
  }
  const area = offlineBounds(route.points);
  await new Promise<void>((resolve, reject) => {
    let completed = false;
    const timeout = setTimeout(
      () => {
        if (!completed) {
          completed = true;
          offlineManager.unsubscribe(name);
          reject(new Error("La descarga del mapa no terminó a tiempo."));
        }
      },
      10 * 60 * 1000,
    );
    offlineManager
      .createPack(
        {
          name,
          styleURL: Mapbox.StyleURL.Outdoors,
          minZoom: 10,
          maxZoom: 17,
          bounds: [area.ne, area.sw],
        },
        (_pack, status) => {
          onProgress?.(status.percentage);
          if (!completed && isPackComplete(status)) {
            completed = true;
            clearTimeout(timeout);
            offlineManager.unsubscribe(name);
            resolve();
          }
        },
        (_pack, error) => {
          if (!completed) {
            completed = true;
            clearTimeout(timeout);
            offlineManager.unsubscribe(name);
            reject(
              new Error(
                error.message || "No se pudo descargar la cartografía.",
              ),
            );
          }
        },
      )
      .catch((error) => {
        if (!completed) {
          completed = true;
          clearTimeout(timeout);
          reject(error);
        }
      });
  });
  return name;
}

export async function removeOfflineCartography(
  routeId: string,
  packName?: string,
) {
  await offlineManager.deletePack(packName || `encumbrate-${routeId}`);
}

export type OfflineCartographyStatus = {
  exists: boolean;
  complete: boolean;
  percentage: number;
  completedResourceSize: number;
  completedResourceCount: number;
  requiredResourceCount: number;
};

export async function offlineCartographyStatus(
  routeId: string,
  packName?: string,
): Promise<OfflineCartographyStatus> {
  const pack = await offlineManager.getPack(
    packName || `encumbrate-${routeId}`,
  );
  if (!pack)
    return {
      exists: false,
      complete: false,
      percentage: 0,
      completedResourceSize: 0,
      completedResourceCount: 0,
      requiredResourceCount: 0,
    };
  const status = await pack.status();
  return {
    exists: true,
    complete: isPackComplete(status),
    percentage: Number(status.percentage || 0),
    completedResourceSize: Number(status.completedResourceSize || 0),
    completedResourceCount: Number(status.completedResourceCount || 0),
    requiredResourceCount: Number(status.requiredResourceCount || 0),
  };
}

export async function removeOfflineCartographySafe(
  routeId: string,
  packName?: string,
) {
  const name = packName || `encumbrate-${routeId}`,
    pack = await offlineManager.getPack(name);
  if (pack) await offlineManager.deletePack(name);
}
