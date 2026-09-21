import test from 'node:test';
import assert from 'node:assert/strict';
import {accessPathState,bearingDegrees,breadcrumbReturn,distanceMetres,routeMetrics,routeMetricsSegments,shouldSaveBreadcrumb} from '../public/offline/nav.mjs';

test('calcula distancia y rumbo al inicio sin internet',()=>{
  const from={lat:38.35,lon:-0.50},to={lat:38.36,lon:-0.49};
  const distance=distanceMetres(from,to),bearing=bearingDegrees(from,to);
  assert.ok(distance>1300&&distance<1500);
  assert.ok(bearing>30&&bearing<60);
});

test('progreso y distancia al sendero se calculan sobre segmentos reales',()=>{
  const route=[{lat:38,lon:-1},{lat:38,lon:-0.99},{lat:38,lon:-0.98}];
  const result=routeMetrics({lat:38.0001,lon:-0.99},route,10);
  assert.ok(result.distance<20);
  assert.ok(result.progress>.45&&result.progress<.55);
  assert.equal(result.status,'on-track');
});

test('marca salida de ruta cuando la posición es precisa y está lejos',()=>{
  const route=[{lat:38,lon:-1},{lat:38,lon:-0.99}];
  const result=routeMetrics({lat:38.002,lon:-0.995},route,8);
  assert.equal(result.status,'off-route');
  assert.ok(result.distance>150);
});

test('retorno offline usa las migas reales en orden inverso',()=>{
  const route=[{lat:38,lon:-1},{lat:38,lon:-0.99}];
  const crumbs=[
    {lat:38,lon:-0.999},
    {lat:38.001,lon:-0.998},
    {lat:38.002,lon:-0.997},
  ];
  const current={lat:38.0021,lon:-0.9969};
  const back=breadcrumbReturn(current,crumbs,route,35);
  assert.ok(back.length>=3);
  assert.deepEqual(back[0],current);
});

test('no guarda migas GPS duplicadas cada pocos metros',()=>{
  const a={lat:38,lon:-1},near={lat:38.00001,lon:-1},far={lat:38.0001,lon:-1};
  assert.equal(shouldSaveBreadcrumb(a,near,8),false);
  assert.equal(shouldSaveBreadcrumb(a,far,8),true);
});


test('los tramos separados no crean un sendero imaginario entre ellos',()=>{
  const segments=[[{lat:38,lon:-1},{lat:38,lon:-0.999}],[{lat:38.01,lon:-0.99},{lat:38.01,lon:-0.989}]];
  const between={lat:38.005,lon:-0.9945};
  const result=routeMetricsSegments(between,segments,10);
  assert.ok(result.distance>500);
});


test('acceso peatonal offline conserva el camino guardado y calcula lo restante',()=>{
  const path=[
    {lat:38.4000,lon:-0.5000},
    {lat:38.4010,lon:-0.5000},
    {lat:38.4020,lon:-0.4990},
    {lat:38.4030,lon:-0.4980},
  ];
  const current={lat:38.40105,lon:-0.50002};
  const state=accessPathState(current,path,10);
  assert.equal(state.valid,true);
  assert.ok(state.remaining.length>=3);
  assert.ok(state.remainingM>150);
});

test('acceso peatonal offline rechaza posiciones alejadas y no inventa un atajo',()=>{
  const path=[
    {lat:38.4000,lon:-0.5000},
    {lat:38.4010,lon:-0.5000},
    {lat:38.4020,lon:-0.4990},
  ];
  const far={lat:38.4100,lon:-0.4900};
  const state=accessPathState(far,path,10);
  assert.equal(state.valid,false);
  assert.ok(state.nearest.distance>100);
});
