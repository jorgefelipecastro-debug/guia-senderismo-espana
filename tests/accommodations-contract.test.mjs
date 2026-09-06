import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const api = await readFile(new URL("../app/api/accommodations/route.js", import.meta.url), "utf8");
const screen = await readFile(new URL("../app/Accommodations.js", import.meta.url), "utf8");
const map = await readFile(new URL("../app/RouteMapExplorer.js", import.meta.url), "utf8");

test("el catálogo consulta las categorías senderistas previstas", () => {
  for (const type of ["alpine_hut", "wilderness_hut", "camp_site", "hostel", "guest_house", "chalet", "hotel"])
    assert.match(api, new RegExp(type));
});

test("la API limita ubicación y radio y evita enlaces con protocolos inseguros", () => {
  assert.match(api, /lat<35\|\|lat>44\.5/);
  assert.match(api, /Math\.min\(50000,Math\.max\(5000/);
  assert.match(api, /\["http:","https:"\]\.includes\(url\.protocol\)/);
});

test("los alojamientos aparecen en su pantalla y como marcadores del mapa", () => {
  assert.match(screen, /\/api\/accommodations/);
  assert.match(screen, /Refugios y alojamientos/);
  assert.match(map, /loadAccommodations\(start\)/);
  assert.match(map, /stays\.forEach/);
  assert.match(map, /Alojamiento/);
});
