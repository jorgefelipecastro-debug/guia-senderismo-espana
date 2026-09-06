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
const nativeCrypto = await readFile(
  new URL("../mobile/src/security/encryptedStorage.ts", import.meta.url),
  "utf8",
);
const webCrypto = await readFile(
  new URL("../lib/encrypted-browser-storage.js", import.meta.url),
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
  assert.match(nativeStorage, /PRAGMA secure_delete = ON/);
  assert.match(nativeStorage, /gps_points_secure/);
  assert.match(nativeStorage, /encryptJson\(point\)/);
  assert.match(nativeCrypto, /AESEncryptionKey/);
  assert.match(nativeCrypto, /aesEncryptAsync/);
  assert.match(nativeCrypto, /SecureStore\.AFTER_FIRST_UNLOCK/);
});

test("la sesión web usa AES-GCM y migra fuera de localStorage", async () => {
  assert.match(webCrypto, /AES-GCM/);
  assert.match(webCrypto, /256}, false, \["encrypt", "decrypt"\]/);
  globalThis.indexedDB = new IDBFactory();
  const sessionValues = new Map();
  globalThis.localStorage = {
    getItem: key => sessionValues.get(key) ?? null,
    setItem: (key, value) => sessionValues.set(key, String(value)),
    removeItem: key => sessionValues.delete(key),
  };
  const sessionKey = "sb-test-auth-token", plaintext = '{"access_token":"secreto-prueba"}';
  globalThis.localStorage.setItem(sessionKey, plaintext);
  const {encryptedBrowserStorage} = await import("../lib/encrypted-browser-storage.js");
  assert.equal(await encryptedBrowserStorage.getItem(sessionKey), plaintext);
  assert.equal(globalThis.localStorage.getItem(sessionKey), null);
  const request = globalThis.indexedDB.open("encumbrate-secure", 1), db = await new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }), transaction = db.transaction("vault", "readonly"),
    recordRequest = transaction.objectStore("vault").get(sessionKey),
    record = await new Promise((resolve, reject) => {
      recordRequest.onsuccess = () => resolve(recordRequest.result);
      recordRequest.onerror = () => reject(recordRequest.error);
    });
  assert.match(record.value, /^enc:v1:/);
  assert.doesNotMatch(record.value, /secreto-prueba/);
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
  const rawRequest = globalThis.indexedDB.open("encumbrate-gps", 2), rawDb = await new Promise((resolve, reject) => {
    rawRequest.onsuccess = () => resolve(rawRequest.result);
    rawRequest.onerror = () => reject(rawRequest.error);
  }), rawTransaction = rawDb.transaction(["state", "points"], "readonly"),
    rawStateRequest = rawTransaction.objectStore("state").get("active-session"),
    rawPointsRequest = rawTransaction.objectStore("points").getAll(),
    [rawState, rawPoints] = await Promise.all([
      new Promise((resolve, reject) => { rawStateRequest.onsuccess = () => resolve(rawStateRequest.result); rawStateRequest.onerror = () => reject(rawStateRequest.error); }),
      new Promise((resolve, reject) => { rawPointsRequest.onsuccess = () => resolve(rawPointsRequest.result); rawPointsRequest.onerror = () => reject(rawPointsRequest.error); }),
    ]);
  assert.match(rawState.payload, /^enc:v1:/);
  assert.equal("session" in rawState, false);
  assert.ok(rawPoints.every(point => typeof point.payload === "string" && !("lat" in point) && !("lon" in point)));

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
