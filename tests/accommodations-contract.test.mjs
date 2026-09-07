import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const api = await readFile(new URL("../app/api/accommodations/route.js", import.meta.url), "utf8");
const importer = await readFile(new URL("../lib/accommodation-import.js", import.meta.url), "utf8");
const migration = await readFile(new URL("../supabase/migrations/20260907_persistent_accommodation_catalog.sql", import.meta.url), "utf8");
const screen = await readFile(new URL("../app/Accommodations.js", import.meta.url), "utf8");
const map = await readFile(new URL("../app/RouteMapExplorer.js", import.meta.url), "utf8");

test("el catálogo consulta las categorías senderistas previstas", () => {
  for (const type of ["alpine_hut", "wilderness_hut", "camp_site", "hostel", "guest_house", "chalet", "hotel"])
    assert.match(api, new RegExp(type));
});

test("la API limita ubicación y radio y evita enlaces con protocolos inseguros", () => {
  assert.match(api, /lat\s*<\s*35\s*\|\|\s*lat\s*>\s*44\.5/);
  assert.match(api, /Math\.min\(50000,\s*Math\.max\(5000/);
  assert.match(api, /\["http:",\s*"https:"\]\.includes\(url\.protocol\)/);
});

test("los alojamientos aparecen en su pantalla y como marcadores del mapa", () => {
  assert.match(screen, /\/api\/accommodations/);
  assert.match(screen, /Refugios y alojamientos/);
  assert.match(map, /loadAccommodations\(start\)/);
  assert.match(map, /stays\.forEach/);
  assert.match(map, /Alojamiento/);
});

test("las consultas de usuarios solo leen el catálogo propio", () => {
  assert.doesNotMatch(api, /overpass/i);
  assert.match(api, /nearby_accommodations/);
  assert.match(api, /s-maxage=900/);
  assert.match(importer, /OVERPASS_ENDPOINTS/);
});

test("el catálogo usa búsqueda espacial privada e indexada", () => {
  assert.match(migration, /using gist\(location\) where active/i);
  assert.match(migration, /st_dwithin/i);
  assert.match(migration, /revoke all on public\.accommodations from public,anon,authenticated/i);
  assert.match(migration, /grant execute on function public\.nearby_accommodations[\s\S]*to service_role/i);
});
