import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('el cliente operativo usa Railway como primario y Vercel como fallback',async()=>{
  const source=await readFile(new URL('../lib/operational-api.js',import.meta.url),'utf8');
  assert.match(source,/encumbrate-web-production\.up\.railway\.app/);
  assert.match(source,/operationalFetch/);
  assert.match(source,/return fetcher\(normalized/);
});

test('las descargas de mapas y trazados usan el backend operativo',async()=>{
  const [mosaic,catalog,viewer]=await Promise.all([
    readFile(new URL('../lib/offline-mosaic.js',import.meta.url),'utf8'),
    readFile(new URL('../app/RouteCatalog.js',import.meta.url),'utf8'),
    readFile(new URL('../public/offline/viewer.mjs',import.meta.url),'utf8'),
  ]);
  assert.match(mosaic,/operationalFetch/);
  assert.match(mosaic,/\/api\/maps\/offline/);
  assert.match(catalog,/operationalFetch/);
  assert.match(catalog,/\/api\/routes\/track/);
  assert.match(viewer,/operationalFetch/);
  assert.match(viewer,/\/api\/routes\/track/);
});

test('las APIs operativas permiten CORS limitado y no wildcard',async()=>{
  const cors=await readFile(new URL('../lib/operational-cors.js',import.meta.url),'utf8');
  assert.match(cors,/https:\/\/www\.encumbrate\.es/);
  assert.match(cors,/vercel/);
  assert.doesNotMatch(cors,/Access-Control-Allow-Origin[^\n]*\*/);
});

test('el modo offline cachea el cliente Railway v26',async()=>{
  const worker=await readFile(new URL('../public/sw.js',import.meta.url),'utf8');
  assert.match(worker,/encumbrate-public-v26/);
  assert.match(worker,/\/offline\/api\.mjs/);
});

test('el routing peatonal usa Railway como primario con fallback Vercel',async()=>{
  const prep=await readFile(new URL('../app/RoutePreparation.js',import.meta.url),'utf8');
  const viewer=await readFile(new URL('../public/offline/viewer.mjs',import.meta.url),'utf8');
  assert.match(prep,/operationalFetch\('\/api\/navigation\/return'/);
  assert.match(viewer,/operationalFetch\('\/api\/navigation\/return'/);
});
