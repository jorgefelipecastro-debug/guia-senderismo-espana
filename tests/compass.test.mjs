import test from 'node:test';
import assert from 'node:assert/strict';
import {adaptiveHeading,angleDifference,calibrationWarning,circularMean,circularSpread,headingFromQuaternion,nextCalibrationState,normalizeHeading,shouldUseHeadingSource,smoothHeading} from '../app/compassMath.js';

test('normaliza cualquier rumbo al intervalo de la brújula',()=>{
 assert.equal(normalizeHeading(360),0);
 assert.equal(normalizeHeading(-10),350);
 assert.equal(normalizeHeading(725),5);
});

test('promedia correctamente al cruzar de 359 a 0 grados',()=>{
 const mean=circularMean([358,359,0,1,2]);
 assert.ok(mean<1||mean>359);
 assert.ok(circularSpread([358,359,0,1,2],mean)<=3);
});

test('suaviza por el camino corto y limita los saltos visuales',()=>{
 const next=smoothHeading(358,4,{factor:.5,maxStep:3,deadband:0});
 assert.equal(next,1);
 assert.equal(angleDifference(4,next),3);
 assert.equal(smoothHeading(25,25.3,{deadband:.6}),25);
});

test('responde deprisa a un giro real sin temblar cuando está quieta',()=>{
 assert.equal(adaptiveHeading(0,120),90);
 assert.equal(adaptiveHeading(359,359.5),359);
 assert.equal(adaptiveHeading(100,101.4),100);
 assert.ok(adaptiveHeading(100,108)>103&&adaptiveHeading(100,108)<105);
 const corrected=adaptiveHeading(350,20);
 assert.ok(corrected>350||corrected<20);
 assert.ok(Math.abs(angleDifference(20,corrected))<8);
});

test('mantiene estable el estado ante ruido intermedio y recalibra solo si es alto',()=>{
 assert.equal(nextCalibrationState('calibrating',9,true),'stable');
 assert.equal(nextCalibrationState('stable',15,true),'stable');
 assert.equal(nextCalibrationState('stable',19,true),'calibrating');
 assert.equal(nextCalibrationState('stable',5,false),'calibrating');
});

test('convierte el cuaternión Android usando la parte superior del móvil',()=>{
 const half=Math.SQRT1_2;
 assert.equal(headingFromQuaternion([0,0,0,1]),0);
 assert.ok(Math.abs(headingFromQuaternion([0,0,-half,half])-90)<.0001);
 assert.ok(Math.abs(headingFromQuaternion([0,0,half,half])-270)<.0001);
 assert.equal(headingFromQuaternion(null),null);
});

test('el sensor Android avanzado sustituye al origen compatible congelado',()=>{
 assert.equal(shouldUseHeadingSource('Sensor Android','Sensor Android avanzado'),true);
 assert.equal(shouldUseHeadingSource('Sensor Android avanzado','Sensor Android'),false);
 assert.equal(shouldUseHeadingSource('','Sensor Android'),true);
});

test('el aviso magnético no reaparece después de pulsar Entendido',()=>{
 assert.match(calibrationWarning(false,{spread:30}),/inestable/);
 assert.equal(calibrationWarning(true,{spread:30}),'');
});
