import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { supabase } from '../lib/supabase';
import { appendPending, readPending, readSession, removePending, writeSession } from './storage';

export const BACKGROUND_LOCATION_TASK = 'encumbrate-background-location';

async function flushPoints() {
  const session = await readSession();
  if (!session) return 0;
  const pending = await readPending();
  let sent = 0;
  while (sent < pending.length) {
    const batch = pending.slice(sent, sent + 200);
    const { error } = await supabase.rpc('append_offline_gps_points', {
      p_activity_id: session.id,
      p_points: batch,
    });
    if (error) break;
    await removePending(batch.length);
    sent += batch.length;
  }
  return sent;
}

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data) return;
  const session = await readSession();
  if (!session) return;
  const locations = (data as { locations: Location.LocationObject[] }).locations ?? [];
  const accepted = locations
    .filter(item => (item.coords.accuracy ?? 999) <= 100)
    .map((item, index) => ({
      sequence: session.sequence + index + 1,
      at: new Date(item.timestamp).toISOString(),
      lat: item.coords.latitude,
      lon: item.coords.longitude,
      accuracy: item.coords.accuracy,
      altitude: item.coords.altitude,
    }));
  if (!accepted.length) return;
  await appendPending(accepted);
  await writeSession({ ...session, sequence: accepted[accepted.length - 1]!.sequence });
  await flushPoints();
});

export async function requestTrackingPermissions() {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') throw new Error('Necesitamos permiso de ubicación para guiarte.');
  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== 'granted') throw new Error('Activa “Permitir siempre” para grabar con la pantalla apagada.');
}

export async function beginNativeTracking(route: { id: string; name: string; level?: string; distanceKm?: number }) {
  await requestTrackingPermissions();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Inicia sesión antes de comenzar una ruta.');
  const { data, error } = await supabase.rpc('start_external_route_activity', {
    p_route_key: route.id,
    p_route_name: route.name,
    p_route_difficulty: route.level ?? 'intermedio',
    p_planned_distance_km: route.distanceKm ?? null,
  });
  if (error) throw error;
  const activity = Array.isArray(data) ? data[0] : data;
  if (!activity?.id) throw new Error('No se ha podido crear la grabación.');
  const session = {
    id: activity.id as string,
    userId: auth.user.id,
    routeId: route.id,
    routeName: route.name,
    sequence: 0,
    startedAt: activity.started_at ?? new Date().toISOString(),
  };
  await writeSession(session);
  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, trackingOptions);
  return session;
}

export async function resumeNativeTracking() {
  if (await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)) return;
  const session = await readSession();
  if (!session) throw new Error('No hay ninguna ruta activa que reanudar.');
  await requestTrackingPermissions();
  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, trackingOptions);
}

const trackingOptions: Location.LocationTaskOptions = {
  accuracy: Location.Accuracy.BestForNavigation,
  activityType: Location.ActivityType.Fitness,
  distanceInterval: 5,
  timeInterval: 5000,
  deferredUpdatesDistance: 20,
  deferredUpdatesInterval: 15000,
  pausesUpdatesAutomatically: false,
  showsBackgroundLocationIndicator: true,
  foregroundService: {
    notificationTitle: 'Encúmbrate · ruta en marcha',
    notificationBody: 'Seguimos guardando tu recorrido GPS.',
    notificationColor: '#08633f',
  },
};

export async function stopNativeTracking() {
  if (await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
  await flushPoints();
}

export { flushPoints };
