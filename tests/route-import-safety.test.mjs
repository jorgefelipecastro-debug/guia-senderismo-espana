import test from 'node:test';
import assert from 'node:assert/strict';
import { suspiciousRouteImport } from '../lib/route-import-safety.js';

test('una respuesta vacía o una caída brusca no retira el catálogo publicado', () => {
  assert.equal(suspiciousRouteImport(46, 0), true);
  assert.equal(suspiciousRouteImport(46, 20), true);
  assert.equal(suspiciousRouteImport(46, 40), false);
  assert.equal(suspiciousRouteImport(1, 0), true);
  assert.equal(suspiciousRouteImport(0, 0), false);
});

test('compara importaciones con la última ejecución, no con rutas compartidas de provincias vecinas', () => {
  // Granada tiene 374 rutas asociadas y 47 importadas en su última ejecución.
  assert.equal(suspiciousRouteImport(47, 47), false);
  assert.equal(suspiciousRouteImport(374, 47), true);
});
