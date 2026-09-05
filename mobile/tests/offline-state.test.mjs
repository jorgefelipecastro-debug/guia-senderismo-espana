import test from 'node:test';
import assert from 'node:assert/strict';
import {boundedMerge,breadcrumbMerge,canFinalize,createLocalSession} from '../src/gps/offlineState.mjs';
import {isPackComplete,offlineBounds} from '../src/navigation/offlineGeometry.mjs';

test('crea una sesión local que sobrevive sin identificador remoto',()=>{
 const session=createLocalSession({id:'ruta-1',name:'Ruta uno',level:'principiante',distanceKm:5},'usuario-1',1_700_000_000_000,.25);
 assert.equal(session.routeId,'ruta-1');
 assert.match(session.id,/^local-/);
 assert.equal(session.remoteId,undefined);
 assert.equal(session.sequence,0);
});

test('conserva en orden los puntos capturados durante un corte de red',()=>{
 const saved=boundedMerge([{sequence:1}],[{sequence:2},{sequence:3}],5);
 assert.deepEqual(saved.map(point=>point.sequence),[1,2,3]);
 assert.throws(()=>boundedMerge(saved,[{sequence:4},{sequence:5},{sequence:6}],5),/Almacenamiento GPS lleno/);
});

test('las migas de retorno conservan los puntos más recientes tras un reinicio',()=>{
 const restored=breadcrumbMerge([{sequence:1},{sequence:2}],[{sequence:3},{sequence:4}],3);
 assert.deepEqual(restored.map(point=>point.sequence),[2,3,4]);
});

test('solo finaliza en servidor después de crear actividad y vaciar la cola',()=>{
 assert.equal(canFinalize({finishRequested:true},0),false);
 assert.equal(canFinalize({finishRequested:true,remoteId:'remota'},2),false);
 assert.equal(canFinalize({finishRequested:true,remoteId:'remota'},0),true);
});

test('no declara descargado un paquete Mapbox vacío o incompleto',()=>{
 assert.equal(isPackComplete({percentage:100,requiredResourceCount:0}),false);
 assert.equal(isPackComplete({percentage:80,requiredResourceCount:100}),false);
 assert.equal(isPackComplete({percentage:100,requiredResourceCount:100}),true);
});

test('calcula límites offline y rechaza coordenadas corruptas',()=>{
 const result=offlineBounds([{lat:38,lon:-1},{lat:39,lon:0}],.01);
 assert.deepEqual(result,{ne:[.01,39.01],sw:[-1.01,37.99]});
 assert.throws(()=>offlineBounds([{lat:38,lon:-1},{lat:200,lon:0}]),/no válidas/);
});
