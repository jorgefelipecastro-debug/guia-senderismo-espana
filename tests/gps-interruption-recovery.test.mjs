import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {IDBFactory} from "fake-indexeddb";

function installDeviceStorage() {
  globalThis.indexedDB = new IDBFactory();
  const values = new Map();
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
}

const point = sequence => ({
  sequence,
  at: `2026-09-06T10:00:${String(sequence).padStart(2, "0")}Z`,
  lat: 38.35 + sequence / 10000,
  lon: -0.48,
  accuracy: 8,
  altitude: 120 + sequence,
});

test("recupera tras cerrar la app durante un corte de red", async () => {
  installDeviceStorage();
  const firstProcess = await import(`../lib/gps-indexed-db.js?boot=${Date.now()}`);
  const session = {
    id: "local-interrupted",
    remoteId: "remote-interrupted",
    userId: "user-1",
    routeId: "route-1",
    sequence: 0,
    points: [],
    pending: [],
  };
  await firstProcess.writeGpsSession(session, {replace: true});
  await firstProcess.appendGpsPoint(session, point(1));
  await firstProcess.appendGpsPoint({...session, sequence: 1}, point(2));

  // Una importación nueva representa un proceso nuevo después de cerrar la app.
  const restarted = await import(`../lib/gps-indexed-db.js?restart=${Date.now()}`);
  let recovered = await restarted.readGpsSession();
  assert.deepEqual(recovered.points.map(item => item.sequence), [1, 2]);
  assert.deepEqual(recovered.pending.map(item => item.sequence), [1, 2]);

  // El servidor acepta el lote, pero la conexión cae antes del acuse local.
  const server = new Map();
  for (const item of recovered.pending) server.set(item.sequence, item);
  assert.equal((await restarted.readGpsSession()).pending.length, 2);

  // Tras otro reinicio se reenvía el mismo lote. La clave actividad+secuencia
  // hace el reintento idempotente y solo entonces se confirma localmente.
  const secondRestart = await import(`../lib/gps-indexed-db.js?restart2=${Date.now()}`);
  recovered = await secondRestart.readGpsSession();
  for (const item of recovered.pending) server.set(item.sequence, item);
  await secondRestart.markPendingGpsPointsSent(recovered.id, recovered.pending.length);

  const stable = await secondRestart.readGpsSession();
  assert.deepEqual([...server.keys()], [1, 2]);
  assert.deepEqual(stable.points.map(item => item.sequence), [1, 2]);
  assert.deepEqual(stable.pending, []);
});

test("conserva la petición de finalizar hasta vaciar la cola recuperada", async () => {
  installDeviceStorage();
  const storage = await import(`../lib/gps-indexed-db.js?finish=${Date.now()}`);
  const session = {
    id: "local-finish",
    remoteId: "remote-finish",
    userId: "user-1",
    routeId: "route-1",
    sequence: 1,
    finishRequested: true,
    points: [point(1)],
    pending: [point(1)],
  };
  await storage.writeGpsSession(session, {replace: true});
  const restarted = await import(`../lib/gps-indexed-db.js?finishRestart=${Date.now()}`);
  const recovered = await restarted.readGpsSession();
  assert.equal(recovered.finishRequested, true);
  assert.deepEqual(recovered.pending.map(item => item.sequence), [1]);
});

test("la base remota vuelve a impedir duplicados durante reintentos", async () => {
  const [restore, cleanup, guarantee] = await Promise.all([
    readFile(new URL("../supabase/migrations/20260906_restore_gps_retry_idempotency.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/20260906_remove_redundant_gps_retry_index.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/20260906_enforce_gps_sequence_constraint.sql", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(restore, /delete from public\.activity_gps_points/);
  assert.match(cleanup, /drop index if exists public\.activity_gps_points_activity_sequence_unique/);
  assert.match(guarantee, /activity_gps_points_activity_id_sequence_number_key/);
  assert.match(guarantee, /unique \(activity_id, sequence_number\)/);
});
