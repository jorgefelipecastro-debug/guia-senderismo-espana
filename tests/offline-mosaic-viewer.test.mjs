import test from 'node:test';
import assert from 'node:assert/strict';
import {mapBounds} from '../public/offline/maps.mjs';
import {targetZoomForBounds,tileRangeForMercatorBounds} from '../public/offline/mosaic.mjs';

const track={id:'viewer-route',name:'Ruta prueba',points:[{lat:38.40,lon:-0.52},{lat:38.405,lon:-0.50},{lat:38.41,lon:-0.49}]};

test('el visor territorial selecciona un zoom útil para una ruta',()=>{
  const bounds=mapBounds(track),zoom=targetZoomForBounds(bounds);
  assert.ok(zoom>=10);
  assert.ok(zoom<=15);
  const tiles=tileRangeForMercatorBounds(bounds,zoom);
  assert.ok(tiles.length>0);
  assert.ok(tiles.length<=256);
  assert.ok(tiles.every(tile=>tile.z===zoom && tile.key===`${tile.z}/${tile.x}/${tile.y}`));
});

test('una vista más amplia reduce el zoom objetivo',()=>{
  const narrow=mapBounds(track);
  const wide=[narrow[0]-30000,narrow[1]-30000,narrow[2]+30000,narrow[3]+30000];
  assert.ok(targetZoomForBounds(wide)<targetZoomForBounds(narrow));
});
