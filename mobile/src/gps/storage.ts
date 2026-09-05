import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import {MAX_STORED_POINTS} from './offlineState.mjs';

export const ACTIVE_SESSION_KEY = 'encumbrate:native-active-session';
const PENDING_POINTS_KEY = 'encumbrate:native-pending-points';
const BREADCRUMBS_KEY = 'encumbrate:native-breadcrumbs';
const MIGRATION_KEY = 'async-storage-v1';

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

type PointRow = PendingPoint & {pending: number};
let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openDatabase() {
  if (databasePromise) return databasePromise;
  databasePromise = (async () => {
    const database = await SQLite.openDatabaseAsync('encumbrate-gps.db');
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
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
      CREATE INDEX IF NOT EXISTS gps_points_pending
        ON gps_points (pending, sequence);
    `);
    await migrateAsyncStorage(database);
    return database;
  })();
  return databasePromise;
}

async function migrateAsyncStorage(database: SQLite.SQLiteDatabase) {
  const marker = await database.getFirstAsync<{value: string}>(
    'SELECT value FROM gps_state WHERE key = ?', MIGRATION_KEY,
  );
  if (marker) return;
  const [sessionValue = [ACTIVE_SESSION_KEY, null],
    pendingValue = [PENDING_POINTS_KEY, null],
    breadcrumbValue = [BREADCRUMBS_KEY, null]] = await AsyncStorage.multiGet([
    ACTIVE_SESSION_KEY, PENDING_POINTS_KEY, BREADCRUMBS_KEY,
  ]);
  const session = sessionValue[1] ? JSON.parse(sessionValue[1]) as NativeRouteSession : null,
    pending = pendingValue[1] ? JSON.parse(pendingValue[1]) as PendingPoint[] : [],
    breadcrumbs = breadcrumbValue[1] ? JSON.parse(breadcrumbValue[1]) as PendingPoint[] : [],
    pendingSequences = new Set(pending.map(point => point.sequence)),
    merged = new Map<number, PendingPoint>();
  for (const point of [...breadcrumbs, ...pending]) merged.set(point.sequence, point);
  await database.withExclusiveTransactionAsync(async (transaction: SQLite.SQLiteDatabase) => {
    if (session)
      await transaction.runAsync(
        'INSERT OR REPLACE INTO gps_state (key, value) VALUES (?, ?)',
        ACTIVE_SESSION_KEY, JSON.stringify(session),
      );
    for (const point of [...merged.values()].sort((a,b) => a.sequence-b.sequence).slice(-MAX_STORED_POINTS))
      await transaction.runAsync(
        `INSERT OR REPLACE INTO gps_points
          (sequence, at, lat, lon, accuracy, altitude, pending)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
        point.sequence, point.at, point.lat, point.lon,
        point.accuracy, point.altitude, pendingSequences.has(point.sequence) ? 1 : 0,
      );
    await transaction.runAsync(
      'INSERT OR REPLACE INTO gps_state (key, value) VALUES (?, ?)',
      MIGRATION_KEY, new Date().toISOString(),
    );
  });
  await AsyncStorage.multiRemove([ACTIVE_SESSION_KEY, PENDING_POINTS_KEY, BREADCRUMBS_KEY]);
}

export async function readSession() {
  const database = await openDatabase(),
    row = await database.getFirstAsync<{value: string}>(
      'SELECT value FROM gps_state WHERE key = ?', ACTIVE_SESSION_KEY,
    );
  return row ? JSON.parse(row.value) as NativeRouteSession : null;
}

export async function writeSession(session: NativeRouteSession) {
  const database = await openDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO gps_state (key, value) VALUES (?, ?)',
    ACTIVE_SESSION_KEY, JSON.stringify(session),
  );
}

const rowsToPoints = (rows: PointRow[]) => rows.map(({pending, ...point}) => point);

export async function readPending() {
  const database = await openDatabase(),
    rows = await database.getAllAsync<PointRow>(
      'SELECT sequence, at, lat, lon, accuracy, altitude, pending FROM gps_points WHERE pending = 1 ORDER BY sequence',
    );
  return rowsToPoints(rows);
}

export async function appendPending(points: PendingPoint[]) {
  if (!points.length) return (await readPending()).length;
  const database = await openDatabase();
  await database.withExclusiveTransactionAsync(async (transaction: SQLite.SQLiteDatabase) => {
    for (const point of points)
      await transaction.runAsync(
        `INSERT INTO gps_points (sequence, at, lat, lon, accuracy, altitude, pending)
         VALUES (?, ?, ?, ?, ?, ?, 1)
         ON CONFLICT(sequence) DO UPDATE SET
           at=excluded.at, lat=excluded.lat, lon=excluded.lon,
           accuracy=excluded.accuracy, altitude=excluded.altitude, pending=1`,
        point.sequence, point.at, point.lat, point.lon, point.accuracy, point.altitude,
      );
    const row = await transaction.getFirstAsync<{count: number}>(
      'SELECT COUNT(*) AS count FROM gps_points WHERE pending = 1',
    );
    if ((row?.count || 0) > MAX_STORED_POINTS)
      throw new Error('Almacenamiento GPS lleno: conecta el dispositivo antes de continuar.');
  });
  const row = await database.getFirstAsync<{count: number}>(
    'SELECT COUNT(*) AS count FROM gps_points WHERE pending = 1',
  );
  return row?.count || 0;
}

export async function readBreadcrumbs() {
  const database = await openDatabase(),
    rows = await database.getAllAsync<PointRow>(
      'SELECT sequence, at, lat, lon, accuracy, altitude, pending FROM gps_points ORDER BY sequence',
    );
  return rowsToPoints(rows);
}

export async function appendBreadcrumbs(points: PendingPoint[]) {
  if (!points.length) return (await readBreadcrumbs()).length;
  const database = await openDatabase();
  await database.withExclusiveTransactionAsync(async (transaction: SQLite.SQLiteDatabase) => {
    for (const point of points)
      await transaction.runAsync(
        `INSERT OR IGNORE INTO gps_points
          (sequence, at, lat, lon, accuracy, altitude, pending)
          VALUES (?, ?, ?, ?, ?, ?, 0)`,
        point.sequence, point.at, point.lat, point.lon, point.accuracy, point.altitude,
      );
    await transaction.runAsync(
      `DELETE FROM gps_points WHERE sequence NOT IN
        (SELECT sequence FROM gps_points ORDER BY sequence DESC LIMIT ?)`,
      MAX_STORED_POINTS,
    );
  });
  const row = await database.getFirstAsync<{count: number}>('SELECT COUNT(*) AS count FROM gps_points');
  return row?.count || 0;
}

export async function removePending(count: number) {
  if (count <= 0) return;
  const database = await openDatabase();
  await database.runAsync(
    `UPDATE gps_points SET pending = 0 WHERE sequence IN
      (SELECT sequence FROM gps_points WHERE pending = 1 ORDER BY sequence LIMIT ?)`,
    count,
  );
}

export async function clearTrackingStorage() {
  const database = await openDatabase();
  await database.withExclusiveTransactionAsync(async (transaction: SQLite.SQLiteDatabase) => {
    await transaction.runAsync('DELETE FROM gps_points');
    await transaction.runAsync('DELETE FROM gps_state WHERE key = ?', ACTIVE_SESSION_KEY);
  });
}
