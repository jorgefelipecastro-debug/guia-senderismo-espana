import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const home=await readFile(new URL('../app/page.js',import.meta.url),'utf8');
const routes=await readFile(new URL('../app/RouteCatalog.js',import.meta.url),'utf8');
const preparation=await readFile(new URL('../app/RoutePreparation.js',import.meta.url),'utf8');

test('Material del menú abre el planificador y cierra el menú',()=>{
 assert.match(home,/item\[1\]==='Material'\?onMaterial/);
 assert.match(home,/onMaterial=\{\(\)=>\{setMenu\(false\);setMaterialRoute\(null\);setMaterialOpen\(true\)\}\}/);
 assert.match(home,/materialOpen&&<MaterialPlanner/);
});

test('el detalle de ruta abre Material con la ruta seleccionada',()=>{
 assert.match(routes,/RoutePreparation[^\n]*route=\{shown\}/);
 assert.match(preparation,/encumbrate:open-material/);
 assert.match(preparation,/detail:\s*route/);
 assert.match(home,/setMaterialRoute\(event\.detail\|\|null\);setMaterialOpen\(true\)/);
});
