import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  breadcrumbReturn,
  nearestPolylinePoint,
  simplifyTrack,
  validateReturnRoute,
} from "../lib/navigation-geometry.js";

test("proyecta la posición sobre el segmento aunque esté lejos de sus vértices", () => {
  const result = nearestPolylinePoint({ lat: 0.001, lon: 0.5 }, [
    { lat: 0, lon: 0 },
    { lat: 0, lon: 1 },
  ]);
  assert.ok(result.distance > 100 && result.distance < 120);
  assert.ok(Math.abs(result.point.lon - 0.5) < 1e-6);
});

test("la simplificación conserva una curva pronunciada", () => {
  const points = [
    { lat: 0, lon: 0 },
    { lat: 0, lon: 0.01 },
    { lat: 0.01, lon: 0.01 },
    { lat: 0.01, lon: 0.02 },
  ];
  const simplified = simplifyTrack(points, 3);
  assert.equal(simplified.length, 3);
  assert.ok(simplified.slice(1, -1).some((point) => point.lat || point.lon));
});

test("limita trazados largos sin perder inicio y final", () => {
  const points = Array.from({ length: 5000 }, (_, i) => ({
      lat: 38 + Math.sin(i / 20) * 0.001,
      lon: -1 + i / 100000,
    })),
    simplified = simplifyTrack(points, 600);
  assert.ok(simplified.length <= 600);
  assert.deepEqual(simplified[0], points[0]);
  assert.deepEqual(simplified.at(-1), points.at(-1));
});

test("rechaza retornos mal anclados o con rodeos desproporcionados", () => {
  const from = { lat: 38, lon: -1 },
    to = { lat: 38.001, lon: -1 };
  assert.equal(
    validateReturnRoute({
      from,
      to,
      points: [{ lat: 39, lon: -1 }, to],
      distanceM: 100,
    }).safe,
    false,
  );
  assert.equal(
    validateReturnRoute({ from, to, points: [from, to], distanceM: 10000 })
      .safe,
    false,
  );
  assert.equal(
    validateReturnRoute({ from, to, points: [from, to], distanceM: 130 }).safe,
    true,
  );
});

test("el retorno por migas termina al recuperar el sendero", () => {
  const track = [
      { lat: 0, lon: 0 },
      { lat: 0, lon: 0.01 },
    ],
    breadcrumbs = [
      { lat: 0, lon: 0.002 },
      { lat: 0.001, lon: 0.003 },
      { lat: 0.002, lon: 0.004 },
    ],
    position = { lat: 0.0021, lon: 0.0041 },
    result = breadcrumbReturn(position, breadcrumbs, track, 30);
  assert.deepEqual(result.at(-1), breadcrumbs[0]);
  assert.equal(result.length, 4);
});

test("el retorno online se valida y se presenta solo como alternativa orientativa", async () => {
  const source = await readFile(
    new URL("../app/api/navigation/return/route.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /mapbox\/walking/);
  assert.match(source, /overview.*full/);
  assert.match(source, /exclude.*ferry/);
  assert.match(source, /radiuses.*50;50/);
  assert.match(source, /validateReturnRoute/);
  assert.match(source, /verified:\s*false/);
});

test("la descarga conserva hasta 2000 puntos adaptativos", async () => {
  const source = await readFile(
    new URL("../app/api/routes/track/route.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /simplifyTrack/);
  assert.match(source, /max\s*=\s*2000/);
});
