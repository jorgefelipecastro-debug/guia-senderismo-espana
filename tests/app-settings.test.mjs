import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSettings, DEFAULT_SETTINGS } from '../lib/app-settings.js';
test('las preferencias corruptas recuperan valores válidos',()=>{
  assert.deepEqual(normalizeSettings(null), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings({level:'admin',maxDistance:-1,largeText:'true',reducedMotion:1}), DEFAULT_SETTINGS);
});
test('las preferencias válidas conservan filtros y accesibilidad',()=>{
  const settings={level:'intermedio',maxDistance:15,largeText:true,reducedMotion:true};
  assert.deepEqual(normalizeSettings(settings),settings);
});
