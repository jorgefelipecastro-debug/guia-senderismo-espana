import test from 'node:test';
import assert from 'node:assert/strict';
import {aemetNumber,normalizeMunicipalities,nearestMunicipality,searchMunicipalities,normalizeAemetWeather} from '../lib/aemet-weather.js';
const place={id:'03014',name:'Alacant/Alicante',lat:38.35,lon:-.48,elevation:3};
const daily=[{elaborado:'2026-09-09T06:00:00',prediccion:{dia:[{fecha:'2026-09-09T00:00:00',temperatura:{minima:20,maxima:29},estadoCielo:[{periodo:'00-24',value:'11'}],probPrecipitacion:[{value:0}],uvMax:7}]}}];
const hourly=[{prediccion:{dia:[{fecha:'2026-09-09T00:00:00',orto:'07:30',ocaso:'20:20',temperatura:[{periodo:'08',value:'22'}],sensTermica:[{periodo:'08',value:'21'}],estadoCielo:[{periodo:'08',value:'11'}],probPrecipitacion:[{periodo:'0612',value:'60'}],precipitacion:[{periodo:'08',value:'0'}],vientoAndRachaMax:[{periodo:'08',direccion:['NE'],velocidad:['10']},{periodo:'08',value:'35'}]}]}}];
test('AEMET keeps missing values distinct from zero',()=>{assert.equal(aemetNumber(''),null);assert.equal(aemetNumber(null),null);assert.equal(aemetNumber(['0']),0);});
test('AEMET preserves codes with leading zeroes and resolves reference municipality',()=>{
 const ps=normalizeMunicipalities([{id:'id03014',nombre:place.name,latitud_dec:'38.35',longitud_dec:'-.48',altitud:'3'}]);
 assert.equal(ps[0].id,'03014');assert.equal(nearestMunicipality(ps,place).distanceKm,0);assert.equal(nearestMunicipality(ps,{lat:50,lon:10}),null);assert.equal(searchMunicipalities(ps,'alicante').length,1);
});
test('AEMET hourly values preserve rain block and direction while missing fields remain empty',()=>{
 const d=normalizeAemetWeather(daily,hourly,place,'2026-09-09T06:00:00Z',new Date('2026-09-09T06:00:00Z'));
 assert.equal(d.current.temperature,22);assert.equal(d.hours[0].rainPeriod,'0612');assert.equal(d.hours[0].rain,0);assert.equal(d.hours[0].gust,35);assert.equal(d.hours[0].windDirection,45);assert.equal(d.hours[0].visibility,null);assert.equal(d.days[0].uv,7);assert.equal(d.days[0].sunset,'2026-09-09T20:20');
});
test('daily weather still works when hourly provider fails and Canary hours are local',()=>{
 const d=normalizeAemetWeather(daily,[],{...place,id:'38038'});
 assert.equal(d.days.length,1);assert.equal(d.hourlyAvailable,false);assert.equal(d.current.temperature,null);assert.equal(d.timezone,'Atlantic/Canary');assert.throws(()=>normalizeAemetWeather([],[],place));
});
