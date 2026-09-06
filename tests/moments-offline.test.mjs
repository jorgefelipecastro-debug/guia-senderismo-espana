import test from "node:test";
import assert from "node:assert/strict";
import { indexedDB } from "fake-indexeddb";

globalThis.indexedDB = indexedDB;
const { readPendingMoments, removePendingMoment, savePendingMoment } = await import("../lib/moments-offline.js");

test("conserva fotos pendientes y las elimina después de recuperarlas", async () => {
  const item = { id: crypto.randomUUID(), file: new Blob(["foto"], { type: "image/jpeg" }), capturedAt: new Date().toISOString() };
  await savePendingMoment(item);
  const queued = await readPendingMoments();
  assert.equal(queued.some(candidate => candidate.id === item.id), true);
  assert.equal(queued.find(candidate => candidate.id === item.id).file.type, "image/jpeg");
  await removePendingMoment(item.id);
  assert.equal((await readPendingMoments()).some(candidate => candidate.id === item.id), false);
});

test("la migración protege álbumes privados mediante propiedad y RLS", async () => {
  const { readFile } = await import("node:fs/promises");
  const sql = await readFile(new URL("../supabase/migrations/20260906_moments_private_gallery.sql", import.meta.url), "utf8");
  assert.match(sql, /alter table public\.moments enable row level security/i);
  assert.match(sql, /default 'private'/i);
  assert.match(sql, /auth\.uid\(\)\) = user_id/i);
  assert.match(sql, /bucket_id='moments'/i);
});
