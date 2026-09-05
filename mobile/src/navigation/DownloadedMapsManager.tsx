import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  offlineCartographyStatus,
  type OfflineCartographyStatus,
} from "./mapboxOffline";
import {
  listOfflineRoutes,
  refreshOfflineRoute,
  removeOfflineRoute,
  type OfflineRoute,
} from "./routeStorage";
import {
  canModifyDownloadedMap,
  downloadedMapState,
  formatMapSize,
} from "./downloadedMapUtils.mjs";

type Entry = { route: OfflineRoute; status: OfflineCartographyStatus };
type Props = {
  webUrl: string;
  activeRouteId?: string;
  onBack: () => void;
  onOpen: (route: OfflineRoute) => void;
  onChanged: (routes: OfflineRoute[]) => void;
};

const emptyStatus: OfflineCartographyStatus = {
  exists: false,
  complete: false,
  percentage: 0,
  completedResourceSize: 0,
  completedResourceCount: 0,
  requiredResourceCount: 0,
};

export default function DownloadedMapsManager({
  webUrl,
  activeRouteId,
  onBack,
  onOpen,
  onChanged,
}: Props) {
  const [entries, setEntries] = useState<Entry[]>([]),
    [loading, setLoading] = useState(true),
    [working, setWorking] = useState<string | null>(null),
    [progress, setProgress] = useState(0),
    [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const routes = await listOfflineRoutes(),
        items = await Promise.all(
          routes.map(async (route) => {
            try {
              return {
                route,
                status: await offlineCartographyStatus(
                  route.id,
                  route.packName,
                ),
              };
            } catch {
              return { route, status: emptyStatus };
            }
          }),
        );
      setEntries(items);
      onChanged(routes);
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se han podido leer los mapas descargados.",
      );
    } finally {
      setLoading(false);
    }
  }, [onChanged]);
  useEffect(() => {
    load();
  }, [load]);
  const totalSize = useMemo(
    () =>
      entries.reduce(
        (total, item) => total + item.status.completedResourceSize,
        0,
      ),
    [entries],
  );
  function askDelete(entry: Entry) {
    if (!canModifyDownloadedMap(entry.route.id, activeRouteId))
      return setMessage(
        "No puedes eliminar el mapa de una ruta que está en marcha.",
      );
    Alert.alert(
      "Eliminar mapa descargado",
      `¿Eliminar “${entry.route.name}” y su cartografía offline?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => remove(entry.route),
        },
      ],
    );
  }
  async function remove(route: OfflineRoute) {
    setWorking(route.id);
    setMessage("");
    try {
      await removeOfflineRoute(route.id);
      await load();
      setMessage("Mapa eliminado del dispositivo.");
    } catch (error) {
      await load();
      setMessage(
        error instanceof Error
          ? error.message
          : "No se ha podido eliminar el mapa.",
      );
    } finally {
      setWorking(null);
    }
  }
  async function update(route: OfflineRoute) {
    if (!canModifyDownloadedMap(route.id, activeRouteId))
      return setMessage("Finaliza la ruta antes de actualizar este mapa.");
    setWorking(route.id);
    setProgress(0);
    setMessage("Actualizando trazado y cartografía…");
    try {
      await refreshOfflineRoute(webUrl, route, setProgress);
      await load();
      setMessage("Mapa actualizado y comprobado.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "La actualización no ha podido completarse.",
      );
    } finally {
      setWorking(null);
      setProgress(0);
    }
  }
  return (
    <View style={styles.full}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityLabel="Volver">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View>
          <Text style={styles.eyebrow}>USO SIN CONEXIÓN</Text>
          <Text style={styles.title}>Mapas descargados</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summary}>
          <Text style={styles.summaryNumber}>{entries.length}</Text>
          <View>
            <Text style={styles.summaryTitle}>
              {entries.length === 1 ? "mapa guardado" : "mapas guardados"}
            </Text>
            <Text style={styles.summaryDetail}>
              {formatMapSize(totalSize)} ocupados por cartografía
            </Text>
          </View>
        </View>
        {loading && <ActivityIndicator color="#e4b84f" size="large" />}
        {!loading && !entries.length && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>⌖</Text>
            <Text style={styles.emptyTitle}>Todavía no hay mapas</Text>
            <Text style={styles.detail}>
              Al iniciar una ruta, su trazado y cartografía se guardarán aquí
              para utilizarlos sin cobertura.
            </Text>
          </View>
        )}
        {entries.map((entry) => {
          const state = downloadedMapState(entry.status),
            locked = !canModifyDownloadedMap(entry.route.id, activeRouteId),
            busy = working === entry.route.id;
          return (
            <View style={styles.card} key={entry.route.id}>
              <View style={styles.cardTop}>
                <View style={styles.routeCopy}>
                  <Text style={styles.routeName}>{entry.route.name}</Text>
                  <Text style={styles.detail}>
                    {entry.route.distanceKm?.toFixed(1) ?? "—"} km
                    {entry.route.duration ? ` · ${entry.route.duration}` : ""}
                  </Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    state.tone === "ready" ? styles.ready : styles.warning,
                  ]}
                >
                  <Text style={styles.badgeText}>{state.label}</Text>
                </View>
              </View>
              <View style={styles.metadata}>
                <Text style={styles.meta}>
                  {formatMapSize(entry.status.completedResourceSize)}
                </Text>
                <Text style={styles.meta}>
                  Guardado{" "}
                  {new Date(entry.route.savedAt).toLocaleDateString("es-ES")}
                </Text>
              </View>
              {locked && (
                <Text style={styles.locked}>● En uso por la ruta activa</Text>
              )}
              {busy && (
                <View style={styles.progress}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.max(4, progress)}%` },
                    ]}
                  />
                </View>
              )}
              <View style={styles.actions}>
                <Pressable
                  style={styles.open}
                  onPress={() => onOpen(entry.route)}
                  disabled={busy}
                >
                  <Text style={styles.openText}>Abrir mapa</Text>
                </Pressable>
                <Pressable
                  style={styles.update}
                  onPress={() => update(entry.route)}
                  disabled={busy || locked}
                >
                  <Text style={styles.updateText}>Actualizar</Text>
                </Pressable>
                <Pressable
                  style={styles.delete}
                  onPress={() => askDelete(entry)}
                  disabled={busy || locked}
                >
                  <Text style={styles.deleteText}>Eliminar</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
        {message && <Text style={styles.message}>{message}</Text>}
        <Text style={styles.note}>
          El tamaño mostrado corresponde al paquete cartográfico de Mapbox. El
          trazado GPS ocupa una cantidad adicional mínima.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1, backgroundColor: "#edf3ef" },
  header: {
    paddingTop: 18,
    paddingHorizontal: 14,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#063d2d",
  },
  back: { width: 42, color: "#fff", fontSize: 38, textAlign: "center" },
  eyebrow: {
    color: "#e4b84f",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  title: { color: "#fff", fontSize: 25, fontWeight: "900" },
  content: { padding: 16, paddingBottom: 40, gap: 13 },
  summary: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#0a6748",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  summaryNumber: { color: "#f0c45d", fontSize: 38, fontWeight: "900" },
  summaryTitle: { color: "#fff", fontSize: 17, fontWeight: "900" },
  summaryDetail: { color: "#d8ece4", fontSize: 11, marginTop: 2 },
  empty: {
    padding: 30,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    gap: 8,
  },
  emptyIcon: { fontSize: 42, color: "#0a6748" },
  emptyTitle: { fontSize: 19, fontWeight: "900", color: "#083f2e" },
  card: {
    padding: 16,
    borderRadius: 19,
    backgroundColor: "#fff",
    gap: 11,
    shadowColor: "#092d21",
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTop: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  routeCopy: { flex: 1 },
  routeName: { color: "#083f2e", fontSize: 16, fontWeight: "900" },
  detail: { color: "#5e746b", fontSize: 12, lineHeight: 18, marginTop: 3 },
  badge: {
    maxWidth: 120,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ready: { backgroundColor: "#dff2e6" },
  warning: { backgroundColor: "#fff0c9" },
  badgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#24543f",
    textAlign: "center",
  },
  metadata: { flexDirection: "row", justifyContent: "space-between" },
  meta: { color: "#6e8079", fontSize: 10, fontWeight: "700" },
  locked: { color: "#a96d00", fontSize: 10, fontWeight: "900" },
  progress: {
    height: 7,
    borderRadius: 5,
    backgroundColor: "#e5ece8",
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 5, backgroundColor: "#e4b84f" },
  actions: { flexDirection: "row", gap: 7 },
  open: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 11,
    backgroundColor: "#086144",
    alignItems: "center",
  },
  openText: { color: "#fff", fontSize: 11, fontWeight: "900" },
  update: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#0b6847",
    alignItems: "center",
  },
  updateText: { color: "#0b6847", fontSize: 11, fontWeight: "900" },
  delete: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 11,
    backgroundColor: "#f7e2df",
    alignItems: "center",
  },
  deleteText: { color: "#a8322b", fontSize: 11, fontWeight: "900" },
  message: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fff4d8",
    color: "#735615",
    textAlign: "center",
    fontWeight: "700",
  },
  note: {
    color: "#6e8079",
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
    paddingHorizontal: 14,
  },
});
