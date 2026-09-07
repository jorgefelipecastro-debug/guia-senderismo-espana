import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { clientAddress, rateLimitPolicy } from "../lib/api-rate-limit.js";

test("todas las APIs quedan cubiertas por una política por defecto", () => {
  assert.deepEqual(rateLimitPolicy("/api/accommodations", "GET"), {
    scope: "api-read", limit: 120, windowSeconds: 60, failClosed: false,
  });
  assert.equal(rateLimitPolicy("/api/future-write", "POST").scope, "api-write");
});

test("las operaciones sensibles tienen límites más estrictos", () => {
  assert.equal(rateLimitPolicy("/api/account/delete", "POST").limit, 3);
  assert.equal(rateLimitPolicy("/api/admin/moderation", "GET").failClosed, true);
  assert.equal(rateLimitPolicy("/api/navigation/return", "POST").windowSeconds, 300);
});

test("usa primero la IP no falsificable proporcionada por Vercel", () => {
  const headers = new Headers({
    "x-vercel-forwarded-for": "203.0.113.4",
    "x-forwarded-for": "198.51.100.9",
  });
  assert.equal(clientAddress(headers), "203.0.113.4");
});

test("el proxy protege todo el árbol API por IP y usuario", async () => {
  const [proxy, migration] = await Promise.all([
    readFile(new URL("../proxy.js", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/20260907_distributed_api_rate_limits.sql", import.meta.url), "utf8"),
  ]);
  assert.match(proxy, /matcher:\s*["']\/api\/:path\*["']/);
  assert.match(proxy, /admin\.auth\.getUser\(token\)/);
  assert.match(proxy, /p_ip_hash:/);
  assert.match(proxy, /p_user_hash:/);
  assert.match(proxy, /p_ip_limit:\s*userHash\s*\?\s*policy\.limit\s*\*\s*5/);
  assert.match(migration, /on conflict[\s\S]+request_count\s*=\s*private\.api_rate_limits\.request_count\s*\+\s*1/i);
  assert.match(migration, /revoke all on function[\s\S]+public, anon, authenticated/i);
});
