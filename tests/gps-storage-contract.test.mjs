import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { IDBFactory } from "fake-indexeddb";

const webStorage = await readFile(
  new URL("../lib/gps-indexed-db.js", import.meta.url),
  "utf8",
);
const catalog = await readFile(
  new URL("../app/RouteCatalog.js", import.meta.url),
  "utf8",
);
const nativeStorage = await readFile(
  new URL("../mobile/src/gps/storage.ts", import.meta.url),
  "utf8",
);

test("la grabación web usa IndexedDB y migra la sesión local anterior", () => {
  assert.match(webStorage, /indexedDB\.open/);
  assert.match(webStorage, /createObjectStore\("points"/);
  assert.match(webStorage, /transaction\(\["state", "points"\], "readwrite"\)/);
  assert.match(webStorage, /LEGACY_GPS_SESSION_KEY/);
  assert.match(webStorage, /localStorage\.removeItem\(LEGACY_GPS_SESSION_KEY\)/);
  assert.match(catalog, /appendGpsPoint/);
  assert.doesNotMatch(catalog, /localStorage\.getItem\([^)]*active-gps-session/);
});

test("Android persiste el GPS en SQLite con WAL y transacciones exclusivas", () => {
  assert.match(nativeStorage, /from 'expo-sqlite'/);
  assert.match(nativeStorage, /PRAGMA journal_mode = WAL/);
  assert.match(nativeStorage, /CREATE TABLE IF NOT EXISTS gps_points/);
  assert.match(nativeStorage, /withExclusiveTransactionAsync/);
  assert.match(nativeStorage, /AsyncStorage\.multiGet/);
  assert.match(nativeStorage, /AsyncStorage\.multiRemove/);
});

test("IndexedDB migra, confirma lotes y recupera una sesión tras reiniciar", async () => {
  globalThis.indexedDB = new IDBFactory();
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
  const first = { lat: 38, lon: -1, at: "2026-01-01T00:00:00Z", sequence: 1 },
    second = { lat: 38.001, lon: -1, at: "2026-01-01T00:00:05Z", sequence: 2 },
    legacy = {
      id: "local-test",
      routeId: "route-test",
      sequence: 2,
      points: [first, second],
      pending: [second],
    };
  values.set("encumbrate:active-gps-session", JSON.stringify(legacy));
  const storage = await import("../lib/gps-indexed-db.js");
  const migrated = await storage.readGpsSession();
  assert.equal(migrated.id, legacy.id);
  assert.deepEqual(migrated.pending.map((point) => point.sequence), [2]);
  assert.equal(values.has("encumbrate:active-gps-session"), false);

  await storage.appendGpsPoint(migrated, {
    lat: 38.002,
    lon: -1,
    at: "2026-01-01T00:00:10Z",
    sequence: 3,
  });
  await storage.markPendingGpsPointsSent(legacy.id, 1);
  const recovered = await storage.readGpsSession();
  assert.deepEqual(recovered.points.map((point) => point.sequence), [1, 2, 3]);
  assert.deepEqual(recovered.pending.map((point) => point.sequence), [3]);
  await storage.clearGpsSession();
  assert.equal(await storage.readGpsSession(), null);
});
