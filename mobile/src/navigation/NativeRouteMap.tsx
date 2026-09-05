import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Mapbox, {
  Camera,
  LineLayer,
  MapView,
  MarkerView,
  ShapeSource,
} from "@rnmapbox/maps";
import * as Location from "expo-location";
import {
  breadcrumbReturn,
  nearestTrackPoint,
  smoothHeading,
} from "./geometry.mjs";
import type { GeoPoint, OfflineRoute } from "./routeStorage";
import { readBreadcrumbs } from "../gps/storage";

type Position = GeoPoint & { heading: number; accuracy: number };
type Props = {
  track: OfflineRoute;
  lost: boolean;
  webUrl?: string;
  onBack: () => void;
  onLost: () => void;
  onRecovered?: () => void;
  onFinish: () => void;
  viewOnly?: boolean;
};
const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
if (token) Mapbox.setAccessToken(token);
const line = (points: GeoPoint[]) =>
  ({
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: points.map((point) => [point.lon, point.lat]),
    },
  }) as any;

export default function NativeRouteMap({
  track,
  lost,
  webUrl = process.env.EXPO_PUBLIC_WEB_URL ?? "https://www.encumbrate.es",
  onBack,
  onLost,
  onRecovered,
  onFinish,
  viewOnly = false,
}: Props) {
  const camera = useRef<Camera>(null),
    recoveredSamples = useRef(0),
    [position, setPosition] = useState<Position | null>(null),
    [message, setMessage] = useState("Buscando tu posición GPS…"),
    [returnPath, setReturnPath] = useState<GeoPoint[]>([]),
    [breadcrumbs, setBreadcrumbs] = useState<GeoPoint[]>([]),
    [routing, setRouting] = useState("");
  const nearest = useMemo(
      () => (position ? nearestTrackPoint(position, track.points) : null),
      [position, track.points],
    ),
    safeReturn = useMemo(
      () => breadcrumbReturn(position, breadcrumbs, track.points),
      [position, breadcrumbs, track.points],
    ),
    trailShape = useMemo(() => line(track.points), [track.points]),
    returnShape = useMemo(() => line(returnPath), [returnPath]),
    breadcrumbShape = useMemo(() => line(safeReturn), [safeReturn]),
    initial = track.points[0] || { lat: 40.4168, lon: -3.7038 };
  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;
    (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setMessage("Activa el permiso de ubicación para utilizar la guía.");
        return;
      }
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 3,
          timeInterval: 2500,
        },
        (item) => {
          const accuracy = Number(item.coords.accuracy || 999);
          if (accuracy > 60) return;
          setPosition((previous) => {
            const measured =
                typeof item.coords.heading === "number" &&
                item.coords.heading >= 0 &&
                Number(item.coords.speed || 0) > 0.8
                  ? item.coords.heading
                  : null,
              heading =
                measured === null
                  ? previous?.heading || 0
                  : smoothHeading(previous?.heading || measured, measured),
              next = {
                lat: item.coords.latitude,
                lon: item.coords.longitude,
                heading,
                accuracy,
              };
            const distance =
                nearestTrackPoint(next, track.points)?.distance ?? Infinity,
              close = distance <= Math.max(18, Math.min(35, accuracy * 1.5));
            if (lost && close) {
              recoveredSamples.current += 1;
              if (recoveredSamples.current >= 3) {
                setMessage("¡Ya estás en marcha otra vez!");
                onRecovered?.();
              }
            } else {
              recoveredSamples.current = 0;
              setMessage(
                lost
                  ? "Sigue la línea roja hasta volver al sendero."
                  : "Sigue tu posición y el trazado señalizado.",
              );
            }
            camera.current?.setCamera({
              centerCoordinate: [next.lon, next.lat],
              zoomLevel: 17,
              heading: next.heading,
              animationDuration: 350,
            });
            return next;
          });
        },
      );
    })();
    return () => subscription?.remove();
  }, [track.id, track.points, lost, onRecovered]);
  useEffect(() => {
    if (!lost || !position || !nearest) {
      setReturnPath([]);
      setRouting("");
      return;
    }
    const controller = new AbortController(),
      timer = setTimeout(async () => {
        setRouting(
          "Prioridad: vuelve por tus pasos. Buscando una alternativa cartografiada…",
        );
        try {
          const response = await fetch(`${webUrl}/api/navigation/return`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ from: position, to: nearest.point }),
              signal: controller.signal,
            }),
            body = await response.json();
          if (
            !response.ok ||
            !Array.isArray(body.points) ||
            body.points.length < 2
          )
            throw new Error(body.error);
          setReturnPath(body.points);
          setRouting(
            `Tus pasos en rojo · alternativa orientativa de ${Math.round(body.distanceM)} m en ámbar`,
          );
        } catch (error) {
          if (!controller.signal.aborted) {
            setReturnPath([]);
            setRouting(
              safeReturn.length > 1
                ? "Retorno recomendado por tus propios pasos."
                : "Detente y comprueba el terreno; no hay un retorno verificado disponible.",
            );
          }
        }
      }, 1200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    lost,
    position?.lat,
    position?.lon,
    nearest?.point.lat,
    nearest?.point.lon,
    webUrl,
    safeReturn.length,
  ]);
  useEffect(() => {
    if (!lost) return;
    let active = true;
    const load = async () => {
      const saved = await readBreadcrumbs();
      if (active) setBreadcrumbs(saved.map(({ lat, lon }) => ({ lat, lon })));
    };
    load();
    const timer = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [lost]);
  if (!token)
    return (
      <View style={styles.configuration}>
        <Text style={styles.statusTitle}>Mapa pendiente de activación</Text>
        <Text>
          Configura EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN para habilitar cartografía y
          descargas offline.
        </Text>
        <Pressable style={styles.finish} onPress={onBack}>
          <Text style={styles.white}>Volver</Text>
        </Pressable>
      </View>
    );
  return (
    <View style={styles.full}>
      <MapView
        style={StyleSheet.absoluteFill}
        styleURL={Mapbox.StyleURL.Outdoors}
        compassEnabled
        scaleBarEnabled
      >
        <Camera
          ref={camera}
          defaultSettings={{
            centerCoordinate: [initial.lon, initial.lat],
            zoomLevel: 14,
          }}
        />
        <ShapeSource id="trail" shape={trailShape}>
          <LineLayer
            id="trail-shadow"
            style={{ lineColor: "#073d2d", lineWidth: 10, lineOpacity: 0.72 }}
          />
          <LineLayer
            id="trail-line"
            style={{ lineColor: "#68d447", lineWidth: 6 }}
          />
        </ShapeSource>
        {lost && returnPath.length > 1 && (
          <ShapeSource id="mapbox-alternative" shape={returnShape}>
            <LineLayer
              id="mapbox-alternative-line"
              style={{
                lineColor: "#e3a323",
                lineWidth: 5,
                lineDasharray: [2, 1],
              }}
            />
          </ShapeSource>
        )}
        {lost && safeReturn.length > 1 && (
          <ShapeSource id="breadcrumb-return" shape={breadcrumbShape}>
            <LineLayer
              id="breadcrumb-return-line"
              style={{ lineColor: "#dc342d", lineWidth: 7 }}
            />
          </ShapeSource>
        )}
        {position && (
          <MarkerView
            coordinate={[position.lon, position.lat]}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View
              style={[
                styles.arrow,
                { transform: [{ rotate: `${position.heading}deg` }] },
              ]}
            >
              <Text style={styles.arrowText}>▲</Text>
            </View>
          </MarkerView>
        )}
      </MapView>
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View>
          <Text style={styles.eyebrow}>
            {lost ? "VOLVER AL CAMINO" : "NAVEGACIÓN ACTIVA"}
          </Text>
          <Text numberOfLines={1} style={styles.name}>
            {track.name}
          </Text>
        </View>
      </View>
      <View style={[styles.status, viewOnly && styles.statusViewOnly]}>
        <Text style={styles.statusTitle}>{message}</Text>
        <Text style={styles.statusText}>
          {nearest
            ? `${Math.round(nearest.distance)} m del sendero`
            : track.source || "Trazado descargado"}
          {position ? ` · precisión ±${Math.round(position.accuracy)} m` : ""}
        </Text>
        {lost && (
          <Text style={safeReturn.length > 1 ? styles.safe : styles.warning}>
            {routing ||
              (safeReturn.length > 1
                ? "Retorno por tus propios pasos."
                : "Esperando una posición precisa…")}
          </Text>
        )}
      </View>
      {!viewOnly && (
        <View style={styles.actions}>
          {!lost && (
            <Pressable style={styles.lost} onPress={onLost}>
              <Text>⚠ Estoy perdido</Text>
            </Pressable>
          )}
          <Pressable style={styles.finish} onPress={onFinish}>
            <Text style={styles.white}>Finalizar ruta</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1, backgroundColor: "#dce8df" },
  configuration: {
    flex: 1,
    justifyContent: "center",
    gap: 16,
    padding: 28,
    backgroundColor: "#f6f4ed",
  },
  header: {
    position: "absolute",
    top: 18,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 11,
    borderRadius: 16,
    backgroundColor: "#063d2cee",
  },
  back: { width: 42, color: "#fff", fontSize: 38, textAlign: "center" },
  eyebrow: { color: "#a9df54", fontSize: 10, fontWeight: "900" },
  name: { maxWidth: 280, color: "#fff", fontSize: 15, fontWeight: "900" },
  status: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 86,
    padding: 13,
    borderRadius: 15,
    backgroundColor: "#fff",
  },
  statusTitle: { color: "#123e2d", fontWeight: "900" },
  statusText: { marginTop: 3, color: "#687b72", fontSize: 11 },
  statusViewOnly: { bottom: 18 },
  warning: { marginTop: 7, color: "#9c2c24", fontSize: 10, fontWeight: "700" },
  safe: { marginTop: 7, color: "#08704e", fontSize: 10, fontWeight: "800" },
  actions: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 18,
    flexDirection: "row",
    gap: 8,
  },
  lost: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#edae28",
  },
  finish: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#a8322b",
  },
  white: { color: "#fff", fontWeight: "900" },
  arrow: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: "#1682ea",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: { color: "#fff", fontSize: 22 },
});
