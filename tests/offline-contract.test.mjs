import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const routeCatalog=await readFile(new URL('../app/RouteCatalog.js',import.meta.url),'utf8');
const worker=await readFile(new URL('../public/sw.js',import.meta.url),'utf8');

test('la web guarda cada trazado bajo una clave distinta',()=>{
 assert.match(routeCatalog,/encumbrate:offline-route:/);
 assert.match(routeCatalog,/offlineRouteKey\(route\.id\)/);
 assert.doesNotMatch(routeCatalog,/setItem\(OFFLINE_ROUTE_KEY/);
});

test('la sesión web admite inicio y finalización diferidos',()=>{
 assert.match(routeCatalog,/id:\s*`local-/);
 assert.match(routeCatalog,/finishRequested\s*=\s*true/);
 assert.match(routeCatalog,/session\.remoteId\s*=\s*activity\.id/);
});

test('el service worker precarga la entrada y ofrece fallback de navegación',()=>{
 assert.match(worker,/APP_SHELL = \['\/'/);
 assert.match(worker,/caches\.match\('\/'\)/);
 assert.match(worker,/encumbrate-v12/);
});
