import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('Ir al inicio usa un acceso peatonal guardado y no una recta GPS-inicio',async()=>{
  const viewer=await readFile(new URL('../public/offline/viewer.mjs',import.meta.url),'utf8');
  assert.match(viewer,/encumbrate:offline-access:/);
  assert.match(viewer,/accessPathState/);
  assert.match(viewer,/Sigue la línea azul del acceso peatonal guardado/);
  assert.match(viewer,/Encúmbrate no dibuja un atajo/);
  assert.doesNotMatch(viewer,/bluePoints=\[position,track\.points\[0\]\]/);
  assert.doesNotMatch(viewer,/points=\[position,track\.points\[0\]\]/);
});

test('Preparar mi salida permite guardar un acceso peatonal desde el GPS actual',async()=>{
  const source=await readFile(new URL('../app/RoutePreparation.js',import.meta.url),'utf8');
  assert.match(source,/Preparar acceso offline al inicio/);
  assert.match(source,/\/api\/navigation\/return/);
  assert.match(source,/encumbrate:offline-access:/);
  assert.match(source,/Mapbox Walking/);
});
