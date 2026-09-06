import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import {decryptJson, encryptJson, isEncryptedValue} from '../security/encryptedStorage';
import {MAX_STORED_POINTS} from './offlineState.mjs';

export const ACTIVE_SESSION_KEY = 'encumbrate:native-active-session';
const PENDING_POINTS_KEY = 'encumbrate:native-pending-points';
const BREADCRUMBS_KEY = 'encumbrate:native-breadcrumbs';
const ASYNC_MIGRATION_KEY = 'async-storage-v1';
const ENCRYPTION_MIGRATION_KEY = 'encrypted-storage-v2';

export type NativeRouteSession = {
  id: string;
  remoteId?: string;
  userId: string;
  routeId: string;
  routeName: string;
  sequence: number;
  startedAt: string;
  routeLevel?: string;
  distanceKm?: number;
  finishRequested?: boolean;
};

export type PendingPoint = {
  sequence: number;
  at: string;
  lat: number;
  lon: number;
  accuracy: number | null;
  altitude: number | null;
};

type SecurePointRow = {sequence: number; payload: string; pending: number};
type LegacyPointRow = PendingPoint & {pending: number};
let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openDatabase() {
  if (databasePromise) return databasePromise;
  databasePromise = (async () => {
    const database = await SQLite.openDatabaseAsync('encumbrate-gps.db');
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      PRAGMA secure_delete = ON;
      CREATE TABLE IF NOT EXISTS gps_state (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS gps_points (
        sequence INTEGER PRIMARY KEY NOT NULL,
        at TEXT NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        accuracy REAL,
        altitude REAL,
        pending INTEGER NOT NULL DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS gps_points_secure (
        sequence INTEGER PRIMARY KEY NOT NULL,
        payload TEXT NOT NULL,
        pending INTEGER NOT NULL DEFAULT 1
      );
      CREATE INDEX IF NOT EXISTS gps_points_secure_pending
        ON gps_points_secure (pending, sequence);
    `);
    await migrateAsyncStorage(database);
    await migratePlaintextStorage(database);
    return database;
  })();
  return databasePromise;
}

async function migrateAsyncStorage(database: SQLite.SQLiteDatabase) {
  const marker = await database.getFirstAsync<{value: string}>(
    'SELECT value FROM gps_state WHERE key = ?', ASYNC_MIGRATION_KEY,
  );
  if (marker) return;
  const [sessionValue = [ACTIVE_SESSION_KEY, null], pendingValue = [PENDING_POINTS_KEY, null],
    breadcrumbValue = [BREADCRUMBS_KEY, null]] = await AsyncStorage.multiGet([
    ACTIVE_SESSION_KEY, PENDING_POINTS_KEY, BREADCRUMBS_KEY,
  ]);
  const session = sessionValue[1] ? JSON.parse(sessionValue[1]) as NativeRouteSession : null,
    pending = pendingValue[1] ? JSON.parse(pendingValue[1]) as PendingPoint[] : [],
    breadcrumbs = breadcrumbValue[1] ? JSON.parse(breadcrumbValue[1]) as PendingPoint[] : [],
    pendingSequences = new Set(pending.map(point => point.sequence)),
    merged = new Map<number, PendingPoint>();
  for (const point of [...breadcrumbs, ...pending]) merged.set(point.sequence, point);
  const encryptedSession = session ? await encryptJson(session) : null;
  const encryptedPoints = await Promise.all(
    [...merged.values()].sort((a,b) => a.sequence-b.sequence).slice(-MAX_STORED_POINTS)
      .map(async point => ({point, payload: await encryptJson(point)})),
  );
  await database.withExclusiveTransactionAsync(async transaction => {
    if (encryptedSession)
      await transaction.runAsync(
        'INSERT OR REPLACE INTO gps_state (key, value) VALUES (?, ?)',
        ACTIVE_SESSION_KEY, encryptedSession,
      );
    for (const {point, payload} of encryptedPoints)
      await transaction.runAsync(
        'INSERT OR REPLACE INTO gps_points_secure (sequence, payload, pending) VALUES (?, ?, ?)',
        point.sequence, payload, pendingSequences.has(point.sequence) ? 1 : 0,
      );
    await transaction.runAsync(
      'INSERT OR REPLACE INTO gps_state (key, value) VALUES (?, ?)',
      ASYNC_MIGRATION_KEY, new Date().toISOString(),
    );
  });
  await AsyncStorage.multiRemove([ACTIVE_SESSION_KEY, PENDING_POINTS_KEY, BREADCRUMBS_KEY]);
}

async function migratePlaintextStorage(database: SQLite.SQLiteDatabase) {
  const marker = await database.getFirstAsync<{value: string}>(
    'SELECT value FROM gps_state WHERE key = ?', ENCRYPTION_MIGRATION_KEY,
  );
  if (marker) return;
  const sessionRow = await database.getFirstAsync<{value: string}>(
      'SELECT value FROM gps_state WHERE key = ?', ACTIVE_SESSION_KEY,
    ),
    legacyPoints = await database.getAllAsync<LegacyPointRow>(
      'SELECT sequence, at, lat, lon, accuracy, altitude, pending FROM gps_points ORDER BY sequence',
    ),
    encryptedSession = sessionRow && !isEncryptedValue(sessionRow.value)
      ? await encryptJson(JSON.parse(sessionRow.value)) : null,
    encryptedPoints = await Promise.all(legacyPoints.map(async point => ({
      sequence: point.sequence,
      pending: point.pending,
      payload: await encryptJson({
        sequence: point.sequence, at: point.at, lat: point.lat, lon: point.lon,
        accuracy: point.accuracy, altitude: point.altitude,
      } satisfies PendingPoint),
    })));
  await database.withExclusiveTransactionAsync(async transaction => {
    if (encryptedSession)
      await transaction.runAsync(
        'UPDATE gps_state SET value = ? WHERE key = ?', encryptedSession, ACTIVE_SESSION_KEY,
      );
    for (const point of encryptedPoints)
      await transaction.runAsync(
        'INSERT OR REPLACE INTO gps_points_secure (sequence, payload, pending) VALUES (?, ?, ?)',
        point.sequence, point.payload, point.pending,
      );
    await transaction.runAsync('DELETE FROM gps_points');
    await transaction.runAsync(
      'INSERT OR REPLACE INTO gps_state (key, value) VALUES (?, ?)',
      ENCRYPTION_MIGRATION_KEY, new Date().toISOString(),
    );
  });
  if (legacyPoints.length) await database.execAsync('PRAGMA wal_checkpoint(TRUNCATE); VACUUM;');
}

async function rowsToPoints(rows: SecurePointRow[]) {
  return Promise.all(rows.map(row => decryptJson<PendingPoint>(row.payload)));
}

export async function readSession() {
  const database = await openDatabase(), row = await database.getFirstAsync<{value: string}>(
    'SELECT value FROM gps_state WHERE key = ?', ACTIVE_SESSION_KEY,
  );
  return row ? decryptJson<NativeRouteSession>(row.value) : null;
}

export async function writeSession(session: NativeRouteSession) {
  const database = await openDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO gps_state (key, value) VALUES (?, ?)',
    ACTIVE_SESSION_KEY, await encryptJson(session),
  );
}

export async function readPending() {
  const database = await openDatabase(), rows = await database.getAllAsync<SecurePointRow>(
    'SELECT sequence, payload, pending FROM gps_points_secure WHERE pending = 1 ORDER BY sequence',
  );
  return rowsToPoints(rows);
}

export async function appendPending(points: PendingPoint[]) {
  if (!points.length) return (await readPending()).length;
  const encrypted = await Promise.all(points.map(async point => ({point, payload: await encryptJson(point)})));
  const database = await openDatabase();
  await database.withExclusiveTransactionAsync(async transaction => {
    for (const {point, payload} of encrypted)
      await transaction.runAsync(
        `INSERT INTO gps_points_secure (sequence, payload, pending) VALUES (?, ?, 1)
         ON CONFLICT(sequence) DO UPDATE SET payload=excluded.payload, pending=1`,
        point.sequence, payload,
      );
    const row = await transaction.getFirstAsync<{count: number}>(
      'SELECT COUNT(*) AS count FROM gps_points_secure WHERE pending = 1',
    );
    if ((row?.count || 0) > MAX_STORED_POINTS)
      throw new Error('Almacenamiento GPS lleno: conecta el dispositivo antes de continuar.');
  });
  const row = await database.getFirstAsync<{count: number}>(
    'SELECT COUNT(*) AS count FROM gps_points_secure WHERE pending = 1',
  );
  return row?.count || 0;
}

export async function readBreadcrumbs() {
  const database = await openDatabase(), rows = await database.getAllAsync<SecurePointRow>(
    'SELECT sequence, payload, pending FROM gps_points_secure ORDER BY sequence',
  );
  return rowsToPoints(rows);
}

export async function appendBreadcrumbs(points: PendingPoint[]) {
  if (!points.length) return (await readBreadcrumbs()).length;
  const encrypted = await Promise.all(points.map(async point => ({point, payload: await encryptJson(point)})));
  const database = await openDatabase();
  await database.withExclusiveTransactionAsync(async transaction => {
    for (const {point, payload} of encrypted)
      await transaction.runAsync(
        'INSERT OR IGNORE INTO gps_points_secure (sequence, payload, pending) VALUES (?, ?, 0)',
        point.sequence, payload,
      );
    await transaction.runAsync(
      `DELETE FROM gps_points_secure WHERE sequence NOT IN
        (SELECT sequence FROM gps_points_secure ORDER BY sequence DESC LIMIT ?)`,
      MAX_STORED_POINTS,
    );
  });
  const row = await database.getFirstAsync<{count: number}>(
    'SELECT COUNT(*) AS count FROM gps_points_secure',
  );
  return row?.count || 0;
}

export async function removePending(count: number) {
  if (count <= 0) return;
  const database = await openDatabase();
  await database.runAsync(
    `UPDATE gps_points_secure SET pending = 0 WHERE sequence IN
      (SELECT sequence FROM gps_points_secure WHERE pending = 1 ORDER BY sequence LIMIT ?)`, count,
  );
}

export async function clearTrackingStorage() {
  const database = await openDatabase();
  await database.withExclusiveTransactionAsync(async transaction => {
    await transaction.runAsync('DELETE FROM gps_points_secure');
    await transaction.runAsync('DELETE FROM gps_state WHERE key = ?', ACTIVE_SESSION_KEY);
  });
}
