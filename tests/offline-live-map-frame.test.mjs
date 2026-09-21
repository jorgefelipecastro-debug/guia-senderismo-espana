import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('el mapa offline ocupa el contenedor sin dejar hueco vertical', async()=>{
  const html=await readFile(new URL('../public/offline.html',import.meta.url),'utf8');
  assert.match(html,/id="gpsMapCanvas"/);
  assert.match(html,/overflow:hidden/);
  assert.match(html,/id="accuracyRing"/);
  assert.match(html,/class="mapActions"/);
});

test('el GPS reencuadra aunque la guía esté en reposo', async()=>{
  const viewer=await readFile(new URL('../public/offline/viewer.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(viewer,/navMode==='idle'\|\|viewBusy/);
  assert.match(viewer,/if\(navMode==='idle'\)points=\[position,metrics\.point\]/);
  assert.match(viewer,/const outside=!bounds\|\|!boundsContainPoint/);
  assert.match(viewer,/ensureNavigationFrame\(outside\)/);
});

test('centrar GPS recompone la vista y el punto incluye precisión', async()=>{
  const viewer=await readFile(new URL('../public/offline/viewer.mjs',import.meta.url),'utf8');
  assert.match(viewer,/liveMap\.recenter\(\{zoom:14\}\)/);
  assert.match(viewer,/accuracyRing/);
  assert.match(viewer,/metresPerCanvas/);
});
