import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { supabase } from '../lib/supabase';
import { appendBreadcrumbs, appendPending, readPending, readSession, removePending, writeSession } from './storage';
import {canFinalize,createLocalSession} from './offlineState.mjs';

export const BACKGROUND_LOCATION_TASK = 'encumbrate-background-location';

let syncing: Promise<number> | null = null;

async function ensureRemoteSession() {
  let session = await readSession();
  if (!session) return null;
  if (session.remoteId) return session;
  const { data, error } = await supabase.rpc('start_external_route_activity', {
    p_route_key: session.routeId,
    p_route_name: session.routeName,
    p_route_difficulty: session.routeLevel ?? 'intermedio',
    p_planned_distance_km: session.distanceKm ?? null,
  });
  if (error) return null;
  const activity = Array.isArray(data) ? data[0] : data;
  if (!activity?.id) return null;
  session = {...session, remoteId: activity.id as string};
  await writeSession(session);
  return session;
}

async function performFlush() {
  const session = await ensureRemoteSession();
  if (!session) return 0;
  const pending = await readPending();
  let sent = 0;
  while (sent < pending.length) {
    const batch = pending.slice(sent, sent + 200);
    const { error } = await supabase.rpc('append_offline_gps_points', {
      p_activity_id: session.remoteId,
      p_points: batch,
    });
    if (error) break;
    await removePending(batch.length);
    sent += batch.length;
  }
  return sent;
}


async function flushPoints() {
  if (syncing) return syncing;
  syncing = performFlush().finally(() => { syncing = null; });
  return syncing;
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
  await appendBreadcrumbs(accepted);
  await writeSession({ ...session, sequence: accepted[accepted.length - 1]!.sequence });
  await flushPoints();
});

export async function requestTrackingPermissions() {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') throw new Error('Necesitamos permiso de ubicación para guiarte.');
  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== 'granted') throw new Error('Activa “Permitir siempre” para grabar con la pantalla apagada.');
}

export async function beginNativeTracking(route: { id: string; name: string; level?: string; distanceKm?: number }, userId: string) {
  await requestTrackingPermissions();
  const session = createLocalSession(route,userId);
  await writeSession(session);
  await ensureRemoteSession().catch(() => null);
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

export async function requestFinish() {
  const session = await readSession();
  if (!session) return false;
  await writeSession({...session, finishRequested: true});
  return true;
}

export async function synchronizeTracking() {
  await flushPoints();
  const session = await readSession();
  if (!session?.remoteId || !canFinalize(session,(await readPending()).length)) return false;
  const {error} = await supabase.rpc('finalize_external_route_activity', {p_activity_id: session.remoteId});
  if (error) return false;
  return true;
}

export { flushPoints };
