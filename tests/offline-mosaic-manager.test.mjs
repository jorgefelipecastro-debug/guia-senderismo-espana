import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {countryOfflinePackSpec,downloadOfflinePack,estimateOfflinePackBytes,offlineTilesForBounds,readBestOfflineTile,removeOfflinePack} from '../lib/offline-mosaic.js';
import {GET as offlineMapGET} from '../app/api/maps/offline/route.js';

test('España completa usa una pirámide base contenida',()=>{
  const spec=countryOfflinePackSpec(),tiles=offlineTilesForBounds(spec.bounds,spec.minZoom,spec.maxZoom);
  assert.equal(spec.minZoom,5);
  assert.equal(spec.maxZoom,9);
  assert.ok(tiles.length>500);
  assert.ok(tiles.length<2000);
  assert.ok(estimateOfflinePackBytes(spec.bounds,spec.minZoom,spec.maxZoom)<150*1024*1024);
});

test('las zonas comparten teselas y no se borran mientras otro paquete las use',async()=>{
  const bounds=[-0.55,38.32,-0.45,38.42],tiles=offlineTilesForBounds(bounds,8,8),first=tiles[0];
  let fetches=0;
  const fetcher=async()=>{fetches++;return new Response(new Blob(['jpeg'],{type:'image/jpeg'}),{status:200,headers:{'content-type':'image/jpeg'}})};
  await downloadOfflinePack({id:'test-pack-a',name:'A',kind:'province',bounds,minZoom:8,maxZoom:8},{fetcher});
  const firstFetches=fetches;
  await downloadOfflinePack({id:'test-pack-b',name:'B',kind:'province',bounds,minZoom:8,maxZoom:8},{fetcher});
  assert.equal(fetches,firstFetches);
  assert.ok(await readBestOfflineTile(first.z,first.x,first.y));
  await removeOfflinePack('test-pack-a');
  assert.ok(await readBestOfflineTile(first.z,first.x,first.y));
  await removeOfflinePack('test-pack-b');
  assert.equal(await readBestOfflineTile(first.z,first.x,first.y),null);
});

test('el proxy mantiene raster legado y añade teselas IGN cacheables',async()=>{
  const original=globalThis.fetch;
  let upstream='';
  globalThis.fetch=async url=>{upstream=String(url);return new Response(new Uint8Array([0xff,0xd8,0xff,0xd9]),{status:200,headers:{'content-type':'image/jpeg'}})};
  try{
    const tile=await offlineMapGET(new Request('https://encumbrate.test/api/maps/offline?z=8&x=127&y=97&size=256'));
    assert.equal(tile.status,200);
    assert.equal(tile.headers.get('x-encumbrate-offline-tile'),'1');
    assert.match(upstream,/www\.ign\.es\/wms-inspire\/mapa-raster/);
    assert.match(upstream,/WIDTH=256/);
    const invalid=await offlineMapGET(new Request('https://encumbrate.test/api/maps/offline?z=20&x=1&y=1&size=256'));
    assert.equal(invalid.status,400);
  } finally { globalThis.fetch=original; }
});
