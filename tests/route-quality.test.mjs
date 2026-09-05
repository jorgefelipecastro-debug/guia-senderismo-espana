import test from 'node:test';
import assert from 'node:assert/strict';
import {hasAltitudeProfile,hasCoreMetrics,hasRequiredMetrics} from '../lib/route-quality.js';

test('oculta rutas sin distancia o duración',()=>{
  assert.equal(hasCoreMetrics({distanceKm:null,duration:null}),false);
  assert.equal(hasCoreMetrics({distanceKm:4.2,duration:null}),false);
  assert.equal(hasCoreMetrics({distanceKm:4.2,duration:'1 h'}),true);
});

test('solo considera completo un perfil de altitud coherente',()=>{
  assert.equal(hasAltitudeProfile({minAltitudeM:null,maxAltitudeM:900}),false);
  assert.equal(hasAltitudeProfile({minAltitudeM:900,maxAltitudeM:400}),false);
  assert.equal(hasAltitudeProfile({minAltitudeM:400,maxAltitudeM:900}),true);
});

test('solo publica rutas con todas las métricas esenciales',()=>{
  const complete={distanceKm:8.4,duration:'2 h 30 min',ascentM:430,minAltitudeM:210,maxAltitudeM:640};
  assert.equal(hasRequiredMetrics(complete),true);
  assert.equal(hasRequiredMetrics({...complete,ascentM:null}),false);
  assert.equal(hasRequiredMetrics({...complete,minAltitudeM:null}),false);
});
