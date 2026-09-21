import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {squareBoundsForPoints,boundsContainPoint} from '../public/offline/maps.mjs';

test('encuadre dinámico contiene posición y sendero aunque estén lejos',()=>{
  const user={lat:38.43,lon:-0.40},trail={lat:38.31,lon:-0.52};
  const bounds=squareBoundsForPoints([user,trail],{paddingRatio:.2,maxSpan:65000});
  assert.equal(boundsContainPoint(bounds,user),true);
  assert.equal(boundsContainPoint(bounds,trail),true);
  assert.ok(bounds[2]-bounds[0]>10000);
});

test('el visor ofrece mapa grande, centrado GPS y pantalla completa',async()=>{
  const html=await readFile(new URL('../public/offline.html',import.meta.url),'utf8');
  assert.match(html,/id="centerGps"/);
  assert.match(html,/id="fullscreen"/);
  assert.match(html,/id="gpsMapCanvas"/);
  assert.match(html,/height:min\(68vh,680px\)/);
  assert.match(html,/Descargar detalle de esta ruta/);
});

test('el visor reencuadra la navegación y oculta progreso cuando está fuera',async()=>{
  const viewer=await readFile(new URL('../public/offline/viewer.mjs',import.meta.url),'utf8');
  assert.match(viewer,/ensureNavigationFrame/);
  assert.match(viewer,/squareBoundsForPoints/);
  assert.match(viewer,/navProgress'\)\.textContent=onRoute/);
  assert.match(viewer,/No hay un retorno offline seguro calculado/);
  assert.doesNotMatch(viewer,/La línea roja señala directamente el punto más cercano/);
});
