import test from "node:test";
import assert from "node:assert/strict";
import { buildMaterialList, COMMERCE_READINESS, preparationSummary } from "../lib/material-planner.js";

test("la lista se adapta a distancia, desnivel, condiciones y mascota", () => {
  const list = buildMaterialList({ distanceKm: 15, ascentM: 800, maxAltitudeM: 2100, level: "intermedio", duration: "5 h 30 m" }, { rain: true, night: true, pet: true });
  for (const id of ["water", "power", "poles", "rain", "cold", "headlamp", "pet-kit"])
    assert.ok(list.some(item => item.id === id), `falta ${id}`);
});

test("el resumen separa preparación y esenciales pendientes", () => {
  const list = buildMaterialList();
  const packed = Object.fromEntries(list.slice(0, 3).map(item => [item.id, "packed"]));
  const summary = preparationSummary(list, packed);
  assert.equal(summary.prepared, 3);
  assert.equal(summary.missingEssential, list.length - 3);
});

test("la futura tienda permanece desactivada hasta completar seguridad comercial", () => {
  assert.equal(COMMERCE_READINESS.checkoutEnabled, false);
  assert.equal(COMMERCE_READINESS.affiliateLinksEnabled, false);
  assert.equal(COMMERCE_READINESS.sellerOfRecord, false);
  for (const gate of ["supplier_verified", "sample_tested", "eu_responsible_person", "traceability", "returns_ready"])
    assert.ok(COMMERCE_READINESS.requiredBeforeSale.includes(gate));
});
