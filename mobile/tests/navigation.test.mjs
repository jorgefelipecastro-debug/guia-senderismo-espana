import test from "node:test";
import assert from "node:assert/strict";
import {
  breadcrumbReturn,
  distanceMetres,
  nearestTrackPoint,
  normalizeHeading,
  smoothHeading,
} from "../src/navigation/geometry.mjs";
test("calcula distancias GPS razonables", () => {
  const metres = distanceMetres(
    { lat: 40.4168, lon: -3.7038 },
    { lat: 40.4177, lon: -3.7038 },
  );
  assert.ok(metres > 95 && metres < 105);
});
test("elige el punto más cercano del trazado", () => {
  const result = nearestTrackPoint({ lat: 40, lon: -3 }, [
    { lat: 41, lon: -3 },
    { lat: 40.0001, lon: -3 },
    { lat: 39, lon: -3 },
  ]);
  assert.equal(result.index, 1);
  assert.ok(result.distance < 20);
});
test("mide contra el segmento completo y no solo contra sus extremos", () => {
  const result = nearestTrackPoint({ lat: 40.001, lon: -3 }, [
    { lat: 40, lon: -4 },
    { lat: 40, lon: -2 },
  ]);
  assert.ok(result.distance > 100 && result.distance < 120);
  assert.ok(Math.abs(result.point.lon + 3) < 1e-6);
});
test("normaliza y suaviza el rumbo sin saltar al cruzar el norte", () => {
  assert.equal(normalizeHeading(-10), 350);
  const heading = smoothHeading(355, 5, 0.5);
  assert.ok(heading < 1 || heading > 359);
});
test("recorta las migas de retorno cuando vuelven a tocar el sendero", () => {
  const track = [
      { lat: 0, lon: 0 },
      { lat: 0, lon: 0.01 },
    ],
    breadcrumbs = [
      { lat: 0, lon: 0.002 },
      { lat: 0.001, lon: 0.003 },
      { lat: 0.002, lon: 0.004 },
    ],
    result = breadcrumbReturn(
      { lat: 0.0021, lon: 0.0041 },
      breadcrumbs,
      track,
      30,
    );
  assert.deepEqual(result.at(-1), breadcrumbs[0]);
});
