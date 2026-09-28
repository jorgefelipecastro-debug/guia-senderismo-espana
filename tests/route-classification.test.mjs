import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyHikingRoute } from '../lib/route-classification.js';

test('prioriza la dificultad alta declarada por el autor del recorrido', () => {
  assert.equal(classifyHikingRoute(12.32, 894, 'muy_alta'), 'experto');
  assert.equal(classifyHikingRoute(29.1, 3390, 'alta'), 'experto');
});

test('conserva la clasificación por métricas cuando no hay alerta oficial', () => {
  assert.equal(classifyHikingRoute(8.38, 574, 'facil'), 'intermedio');
  assert.equal(classifyHikingRoute(5, 300), 'principiante');
  assert.equal(classifyHikingRoute(null, 300), 'sin_clasificar');
});
