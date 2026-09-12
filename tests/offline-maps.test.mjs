import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {mapBounds,mapURL,pixel,downloadMap,readMap,removeMap,saveMap,trackKey,SIZE} from '../public/offline/maps.mjs';
const track={id:'offline-test-one',name:'Test',points:[{lat:38.4,lon:-0.5},{lat:38.41,lon:-0.48}]};
const opts={fetcher:async()=>new Response(new Blob(['image'],{type:'image/jpeg'}),{headers:{'content-type':'image/jpeg'}}),validateImage:async()=>{}};
test('Mercator bounds include all points with margin and fixed WMS source',()=>{
 const b=mapBounds(track),url=new URL(mapURL(b));assert.equal(url.hostname,'www.ign.es');assert.equal(url.searchParams.get('CRS'),'EPSG:3857');assert.equal(url.searchParams.get('LAYERS'),'mtn_rasterizado');
 for(const point of track.points){const p=pixel(point,b);assert.ok(p.x>0&&p.x<SIZE&&p.y>0&&p.y<SIZE);}
 assert.throws(()=>mapBounds({...track,points:[{lat:NaN,lon:0},{lat:0,lon:0}]}));
 assert.throws(()=>mapBounds({...track,points:[{lat:28,lon:-17},{lat:43,lon:3}]}));
});
test('a completed map survives connection loss, cancellation and corrupt replacement',async()=>{
 const original=await downloadMap(track,opts);assert.equal((await readMap(track.id)).key,trackKey(track));
 await assert.rejects(downloadMap(track,{...opts,fetcher:async()=>{throw Error('network lost');}}));
 const abort=new AbortController();abort.abort();await assert.rejects(downloadMap(track,{...opts,signal:abort.signal}));
 await assert.rejects(downloadMap(track,{...opts,validateImage:async()=>{throw Error('bad JPEG');}}));
 await assert.rejects(downloadMap(track,{...opts,fetcher:async()=>new Response('<xml>error</xml>',{headers:{'content-type':'text/xml'}})}));
 assert.equal((await readMap(track.id)).savedAt,original.savedAt);
});
test('several route maps survive reopening IndexedDB; deleting one preserves the others',async()=>{
 const second={...track,id:'offline-test-two'};await downloadMap(second,opts);
 assert.ok(await readMap(track.id));assert.ok(await readMap(second.id));
 await removeMap(second.id);assert.equal(await readMap(second.id),undefined);assert.ok(await readMap(track.id));
});
test('empty/oversized images rejected; changed tracks have a different fingerprint',async()=>{
 await assert.rejects(saveMap({id:'empty',blob:new Blob([],{type:'image/jpeg'})}));
 await assert.rejects(saveMap({id:'big',blob:new Blob([new Uint8Array(10*1024*1024+1)],{type:'image/jpeg'})}));
 assert.notEqual(trackKey(track),trackKey({...track,points:[...track.points,{lat:38.42,lon:-0.47}]}));
});
