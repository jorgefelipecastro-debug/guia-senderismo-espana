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


test('operationalFetch cae a Vercel cuando Railway responde 503',async()=>{
  const {operationalFetch}=await import('../lib/operational-api.js');
  const calls=[];
  const fakeFetch=async(url,options)=>{
    calls.push({url:String(url),credentials:options?.credentials});
    if(String(url).startsWith('https://encumbrate-web-production.up.railway.app'))
      return new Response('railway missing secret',{status:503});
    return new Response('vercel fallback',{status:200});
  };
  const response=await operationalFetch('/api/navigation/return',{method:'POST'},fakeFetch);
  assert.equal(response.status,200);
  assert.equal(calls.length,2);
  assert.match(calls[0].url,/railway\.app\/api\/navigation\/return/);
  assert.equal(calls[1].url,'/api/navigation/return');
});

test('routing peatonal acepta CORS operativo y OPTIONS',async()=>{
  const source=await readFile(new URL('../app/api/navigation/return/route.js',import.meta.url),'utf8');
  assert.match(source,/withOperationalCors/);
  assert.match(source,/export async function OPTIONS/);
  assert.match(source,/POST, OPTIONS/);
  assert.match(source,/MAPBOX_ACCESS_TOKEN/);
});
