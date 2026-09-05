export function formatMapSize(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return "0 MB";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toLocaleString("es-ES", { maximumFractionDigits: 1 })} MB`;
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
