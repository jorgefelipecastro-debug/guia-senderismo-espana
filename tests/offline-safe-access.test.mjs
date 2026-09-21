import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('Ir al inicio usa un acceso peatonal guardado y no una recta GPS-inicio',async()=>{
  const viewer=await readFile(new URL('../public/offline/viewer.mjs',import.meta.url),'utf8');
  assert.match(viewer,/encumbrate:offline-access:/);
  assert.match(viewer,/accessPathState/);
  assert.match(viewer,/Sigue la línea azul del acceso peatonal guardado/);
  assert.match(viewer,/Sin conexión. La última ruta válida permanece visible en azul/);
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


test('Ir al inicio recalcula automaticamente al apartarse del acceso con conexion',async()=>{
  const viewer=await readFile(new URL('../public/offline/viewer.mjs',import.meta.url),'utf8');
  assert.match(viewer,/maybeRecalculateAccess/);
  assert.match(viewer,/calculateAccessNow\(\{force:false\}\)/);
  assert.match(viewer,/navMode!=='toStart'/);
  assert.match(viewer,/navigator\.onLine/);
  assert.match(viewer,/lastAccessRecalcAt/);
  assert.match(viewer,/moved<50/);
  assert.match(viewer,/Recalculando acceso peatonal desde tu posición actual/);
});

test('sin conexion nunca sustituye el acceso por una linea recta',async()=>{
  const viewer=await readFile(new URL('../public/offline/viewer.mjs',import.meta.url),'utf8');
  assert.match(viewer,/Sin conexión. La última ruta válida permanece visible en azul/);
  assert.doesNotMatch(viewer,/bluePoints=\[position,track\.points\[0\]\]/);
});


test('sin conexion mantiene visible el ultimo acceso valido y muestra distancia hasta el',async()=>{
  const viewer=await readFile(new URL('../public/offline/viewer.mjs',import.meta.url),'utf8');
  assert.match(viewer,/última ruta válida permanece visible en azul/);
  assert.match(viewer,/de su punto más cercano/);
  assert.match(viewer,/bluePoints=accessRoute\.points/);
  assert.match(viewer,/fitPoints\(\[position,\.\.\.accessRoute\.points\],64\)/);
  assert.doesNotMatch(viewer,/bluePoints=\[position,track\.points\[0\]\]/);
});
