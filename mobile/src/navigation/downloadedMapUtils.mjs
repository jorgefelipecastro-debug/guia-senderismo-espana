export function formatMapSize(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return "0 MB";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  if (value < 1024 * 1024 * 1024)
    return `${(value / (1024 * 1024)).toLocaleString("es-ES", { maximumFractionDigits: 1 })} MB`;
  return `${(value / (1024 * 1024 * 1024)).toLocaleString("es-ES", { maximumFractionDigits: 2 })} GB`;
}

export function downloadedMapState(status) {
  if (!status?.exists)
    return { label: "Cartografía incompleta", tone: "warning" };
  if (status.complete)
    return { label: "Disponible sin conexión", tone: "ready" };
  return {
    label: `Descarga al ${Math.max(0, Math.min(100, Math.round(Number(status.percentage || 0))))} %`,
    tone: "warning",
  };
}

export function canModifyDownloadedMap(routeId, activeRouteId) {
  return Boolean(routeId) && routeId !== activeRouteId;
}

export const MIN_FREE_STORAGE_BYTES = 1024 * 1024 * 1024;
export const MIN_FREE_STORAGE_RATIO = 0.1;

export function storageSafety({ freeBytes, totalBytes, extraBytes = 0 }) {
  const free = Number(freeBytes || 0),
    total = Number(totalBytes || 0),
    extra = Math.max(0, Number(extraBytes || 0)),
    reserve = Math.max(
      MIN_FREE_STORAGE_BYTES,
      total > 0 ? total * MIN_FREE_STORAGE_RATIO : 0,
    ),
    usable = Math.max(0, free - reserve),
    safe = free > reserve + extra;
  return { safe, reserve, usable, free, total, extra };
}
