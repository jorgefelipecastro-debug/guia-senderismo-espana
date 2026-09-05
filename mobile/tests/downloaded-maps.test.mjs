import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  canModifyDownloadedMap,
  downloadedMapState,
  formatMapSize,
} from "../src/navigation/downloadedMapUtils.mjs";

test("presenta el tamaño cartográfico en unidades legibles", () => {
  assert.equal(formatMapSize(0), "0 MB");
  assert.equal(formatMapSize(1024), "1 KB");
  assert.equal(formatMapSize(10 * 1024 * 1024), "10 MB");
});

test("distingue mapas completos, parciales y sin paquete", () => {
  assert.deepEqual(
    downloadedMapState({ exists: true, complete: true, percentage: 100 }),
    { label: "Disponible sin conexión", tone: "ready" },
  );
  assert.deepEqual(
    downloadedMapState({ exists: true, complete: false, percentage: 52.6 }),
    { label: "Descarga al 53 %", tone: "warning" },
  );
  assert.deepEqual(
    downloadedMapState({ exists: false, complete: false, percentage: 0 }),
    { label: "Cartografía incompleta", tone: "warning" },
  );
});

test("impide modificar el mapa que utiliza la ruta activa", () => {
  assert.equal(canModifyDownloadedMap("ruta-1", "ruta-1"), false);
  assert.equal(canModifyDownloadedMap("ruta-2", "ruta-1"), true);
  assert.equal(canModifyDownloadedMap("ruta-2"), true);
});

test("una actualización conserva el paquete anterior hasta guardar el nuevo", async () => {
  const source = await readFile(
    new URL("../src/navigation/routeStorage.ts", import.meta.url),
    "utf8",
  );
  const refresh = source.slice(
    source.indexOf("export async function refreshOfflineRoute"),
  );
  assert.match(refresh, /newPackName\s*=\s*`encumbrate-/);
  assert.ok(
    refresh.indexOf("saveOfflineRoute") <
      refresh.indexOf("removeOfflineCartographySafe"),
  );
});
