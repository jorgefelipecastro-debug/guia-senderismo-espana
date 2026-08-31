import AsyncStorage from '@react-native-async-storage/async-storage';

export const ACTIVE_SESSION_KEY = 'encumbrate:native-active-session';
const PENDING_POINTS_KEY = 'encumbrate:native-pending-points';

export type NativeRouteSession = {
  id: string;
  userId: string;
  routeId: string;
  routeName: string;
  sequence: number;
  startedAt: string;
};

export type PendingPoint = {
  sequence: number;
  at: string;
  lat: number;
  lon: number;
  accuracy: number | null;
  altitude: number | null;
};

export async function readSession() {
  const value = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
  return value ? (JSON.parse(value) as NativeRouteSession) : null;
}

export async function writeSession(session: NativeRouteSession) {
  await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
}

export async function readPending() {
  const value = await AsyncStorage.getItem(PENDING_POINTS_KEY);
  return value ? (JSON.parse(value) as PendingPoint[]) : [];
}

export async function appendPending(points: PendingPoint[]) {
  const current = await readPending();
  const merged = [...current, ...points];
  if (merged.length > 20000) {
    throw new Error('Almacenamiento GPS lleno: conecta el dispositivo antes de continuar.');
  }
  await AsyncStorage.setItem(PENDING_POINTS_KEY, JSON.stringify(merged));
  return merged.length;
}

export async function removePending(count: number) {
  const current = await readPending();
  await AsyncStorage.setItem(PENDING_POINTS_KEY, JSON.stringify(current.slice(count)));
}

export async function clearTrackingStorage() {
  await AsyncStorage.multiRemove([ACTIVE_SESSION_KEY, PENDING_POINTS_KEY]);
}
