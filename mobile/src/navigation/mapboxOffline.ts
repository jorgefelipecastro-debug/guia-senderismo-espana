import Mapbox, { offlineManager } from "@rnmapbox/maps";
import type { OfflineRoute } from "./routeStorage";
import { Paths } from "expo-file-system";
import { storageSafety } from "./downloadedMapUtils.mjs";
import { isPackComplete, offlineBounds } from "./offlineGeometry.mjs";

const publicToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
const NEW_ROUTE_DOWNLOAD_BUDGET = 200 * 1024 * 1024;
if (publicToken) Mapbox.setAccessToken(publicToken);

export function deviceStorageStatus(extraBytes = 0) {
  return storageSafety({
    freeBytes: Number(Paths.availableDiskSpace || 0),
    totalBytes: Number(Paths.totalDiskSpace || 0),
    extraBytes,
  });
}

async function assertOfflineStorageCapacity(route: OfflineRoute, requestedName?: string) {
  let expected = NEW_ROUTE_DOWNLOAD_BUDGET;
  if (requestedName && route.packName && requestedName !== route.packName) {
    const previous = await offlineManager.getPack(route.packName).catch(() => null);
    const status = previous ? await previous.status().catch(() => null) : null;
    const currentBytes = Number(status?.completedResourceSize || 0);
    if (currentBytes > 0) expected = Math.max(expected, currentBytes * 1.25);
  }
  const storage = deviceStorageStatus(expected);
  if (!storage.safe)
    throw new Error(
      `No hay espacio libre suficiente para preparar este mapa sin poner en riesgo el almacenamiento del móvil. Libera al menos ${Math.ceil((storage.reserve + storage.extra - storage.free) / (1024 * 1024))} MB e inténtalo de nuevo.`,
    );
  return storage;
}

export async function downloadOfflineCartography(
  route: OfflineRoute,
  onProgress?: (percentage: number) => void,
  requestedName?: string,
) {
  if (!publicToken)
    throw new Error("Falta configurar el token público de Mapbox.");
  await assertOfflineStorageCapacity(route, requestedName);
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
