import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("la API delega distancia, ordenación y paginación en PostGIS", async () => {
  const source = await read("app/api/routes/route.js");
  assert.match(source, /rpc\('search_hiking_routes_postgis'/);
  assert.match(source, /item\.distance_m/);
  assert.doesNotMatch(source, /const rows = \[\]/);
  assert.doesNotMatch(source, /memberships\.push/);
});

test("la migración usa geography, GiST, ST_DWithin y orden KNN", async () => {
  const sql = await read("supabase/migrations/20260908_postgis_route_catalog_query.sql");
  assert.match(sql, /geography\(Point,4326\)/);
  assert.match(sql, /using gist\(location\)/);
  assert.match(sql, /st_dwithin/i);
  assert.match(sql, /operator\(extensions\.<->\)/);
  assert.match(sql, /offset p_offset limit p_limit/);
  assert.match(sql, /grant execute[^;]+service_role/);
  assert.match(sql, /security invoker/);
});
