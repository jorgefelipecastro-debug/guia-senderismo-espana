import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./src/lib/supabase";
import {
  beginNativeTracking,
  flushPoints,
  stopNativeTracking,
} from "./src/gps/backgroundLocation";
import {
  clearTrackingStorage,
  readPending,
  readSession,
  type NativeRouteSession,
} from "./src/gps/storage";
import {
  downloadRoute,
  readOfflineRoute,
  type OfflineRoute,
} from "./src/navigation/routeStorage";
import NativeRouteMap from "./src/navigation/NativeRouteMap";
type Route = {
  id: string;
  name: string;
  level?: string;
  distanceKm?: number;
  duration?: string;
  ascentM?: number;
  lat?: number;
  lon?: number;
};
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? "https://www.encumbrate.es";
export default function App() {
  const [auth, setAuth] = useState<Session | null>(null),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [routes, setRoutes] = useState<Route[]>([]),
    [active, setActive] = useState<NativeRouteSession | null>(null),
    [track, setTrack] = useState<OfflineRoute | null>(null),
    [guide, setGuide] = useState(false),
    [lost, setLost] = useState(false),
    [pending, setPending] = useState(0),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuth(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setAuth(session),
    );
    restore();
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (auth) loadNearbyRoutes();
  }, [auth]);
  async function restore() {
    const session = await readSession();
    setActive(session);
    setPending((await readPending()).length);
    if (session) setTrack(await readOfflineRoute(session.routeId));
  }
  async function login() {
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) setMessage("Correo o contraseña incorrectos.");
  }
  async function loadNearbyRoutes() {
    try {
      const permission = await Location.requestForegroundPermissionsAsync(),
        position =
          permission.status === "granted"
            ? await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              })
            : null,
        lat = position?.coords.latitude ?? 38.3452,
        lon = position?.coords.longitude ?? -0.4815,
        response = await fetch(
          `${WEB_URL}/api/routes?lat=${lat}&lon=${lon}&radius=20000&limit=20`,
        ),
        body = await response.json();
      setRoutes(body.routes ?? []);
    } catch {
      setMessage("No hemos podido cargar las rutas cercanas.");
    }
  }
  async function start(route: Route) {
    setBusy(true);
    setMessage("Descargando el trazado…");
    try {
      const saved = await downloadRoute(WEB_URL, route, (percentage) =>
        setMessage(`Descargando mapa offline… ${Math.round(percentage)} %`),
      );
      setTrack(saved);
      const session = await beginNativeTracking(route);
      setActive(session);
      setGuide(true);
      setMessage("Ruta descargada y seguimiento permanente activado.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se ha podido iniciar la ruta.",
      );
    } finally {
      setBusy(false);
      await restore();
    }
  }
  async function openGoogleAccess(route: Route) {
    if (!Number.isFinite(route.lat) || !Number.isFinite(route.lon)) {
      setMessage("Esta ruta no tiene un acceso geográfico verificado.");
      return;
    }
    await Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${route.lat},${route.lon}&travelmode=driving`,
    );
  }
  async function sync() {
    setBusy(true);
    await flushPoints();
    await restore();
    setBusy(false);
  }
  async function finish() {
    if (!active) return;
    setBusy(true);
    try {
      await stopNativeTracking();
      if ((await readPending()).length)
        throw new Error(
          "Aún hay puntos sin cobertura. Sincronízalos antes de finalizar.",
        );
      const { error } = await supabase.rpc("finalize_external_route_activity", {
        p_activity_id: active.id,
      });
      if (error) throw error;
      await clearTrackingStorage();
      setActive(null);
      setTrack(null);
      setGuide(false);
      setLost(false);
      setPending(0);
      setMessage("Ruta finalizada y guardada.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se ha podido finalizar.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!auth)
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <View style={styles.login}>
          <Text style={styles.brand}>ENCÚMBRATE</Text>
          <Text style={styles.title}>
            Tu guía continúa con la pantalla apagada
          </Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Correo"
          />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Contraseña"
          />
          <Pressable style={styles.primary} onPress={login} disabled={busy}>
            <Text>{busy ? "Entrando…" : "Entrar"}</Text>
          </Pressable>
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </SafeAreaView>
    );
  if (guide && track)
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <NativeRouteMap
          track={track}
          lost={lost}
          onBack={() => {
            setGuide(false);
            setLost(false);
          }}
          onLost={() => setLost(true)}
          onFinish={finish}
        />
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.brand}>ENCÚMBRATE</Text>
        <Text style={styles.title}>Seguimiento GPS nativo</Text>
        {active ? (
          <View style={styles.active}>
            <Text style={styles.live}>● RUTA EN MARCHA</Text>
            <Text style={styles.routeName}>{active.routeName}</Text>
            <Text style={styles.detail}>
              La posición continúa registrándose con la pantalla apagada.
            </Text>
            <Text style={styles.pending}>
              {pending
                ? `${pending} puntos esperando conexión`
                : "Todos los puntos sincronizados"}
            </Text>
            {track && (
              <Pressable style={styles.primary} onPress={() => setGuide(true)}>
                <Text>Abrir mapa y guía</Text>
              </Pressable>
            )}
            <Pressable
              style={styles.lost}
              onPress={() => {
                setLost(true);
                setGuide(true);
              }}
              disabled={!track}
            >
              <Text>⚠ Estoy perdido</Text>
            </Pressable>
            <Pressable style={styles.primary} onPress={sync} disabled={busy}>
              <Text>Sincronizar ahora</Text>
            </Pressable>
            <Pressable style={styles.danger} onPress={finish} disabled={busy}>
              <Text style={styles.white}>Finalizar y guardar</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.section}>Rutas verificadas cerca de ti</Text>
            {routes.map((route) => (
              <View style={styles.card} key={route.id}>
                <View style={styles.routeCopy}>
                  <Text style={styles.routeName}>{route.name}</Text>
                  <Text style={styles.detail}>
                    {route.distanceKm?.toFixed(1)} km · {route.duration}
                    {Number.isFinite(route.ascentM)
                      ? ` · +${route.ascentM} m`
                      : ""}
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.access}
                    onPress={() => openGoogleAccess(route)}
                  >
                    <Text style={styles.accessText}>Cómo llegar</Text>
                  </Pressable>
                  <Pressable
                    style={styles.start}
                    onPress={() => start(route)}
                    disabled={busy}
                  >
                    <Text style={styles.white}>Iniciar</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        )}
        {busy && <ActivityIndicator color="#d6aa45" size="large" />}
        {message && <Text style={styles.message}>{message}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#063d2d" },
  page: { padding: 20, paddingBottom: 50, gap: 14 },
  login: { flex: 1, padding: 24, justifyContent: "center", gap: 14 },
  brand: {
    color: "#e5bd58",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
  },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 35,
    marginBottom: 12,
  },
  section: { color: "#dcece5", fontSize: 18, fontWeight: "800" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
  },
  primary: {
    backgroundColor: "#e4b84f",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  danger: {
    backgroundColor: "#c93931",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  message: { color: "#fff", textAlign: "center", lineHeight: 21 },
  active: {
    backgroundColor: "#f7fbf8",
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  live: { color: "#b16f00", fontWeight: "900" },
  routeName: { color: "#083f2e", fontSize: 17, fontWeight: "900" },
  routeCopy: { flex: 1 },
  detail: { color: "#5a7168", lineHeight: 19 },
  pending: { color: "#8d6514", fontWeight: "800" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  start: {
    backgroundColor: "#0b6847",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  cardActions: { gap: 7 },
  access: {
    borderWidth: 1,
    borderColor: "#0b6847",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  accessText: { color: "#0b6847", fontWeight: "800", textAlign: "center" },
  lost: {
    backgroundColor: "#edae28",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  white: { color: "#fff", fontWeight: "900" },
});
