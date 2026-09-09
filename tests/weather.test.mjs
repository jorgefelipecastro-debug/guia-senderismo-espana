import test from 'node:test';
import assert from 'node:assert/strict';
import {weatherCoordinates,normalizeWeather,weatherAdvice,weatherLabel,validWeatherCache,daylightHours} from '../lib/weather.js';
import {rateLimitPolicy} from '../lib/api-rate-limit.js';
test('weather rejects empty or impossible coordinates and rounds to a shared forecast cell',()=>{
 for(const [a,b] of [[null,0],['',0],[91,0],[0,181],['bad',0]])assert.equal(weatherCoordinates(a,b),null);
 assert.deepEqual(weatherCoordinates(38.34567,-.48321),{lat:38.35,lon:-.48});
 assert.deepEqual(weatherCoordinates(0,0),{lat:0,lon:0});
});
test('weather preserves missing measurements instead of inventing zeroes',()=>{
 const result=normalizeWeather({hourly:{time:['2026-09-09T08:00'],temperature_2m:[null]},daily:{time:['2026-09-09']}},'2026-09-09T06:00:00Z');
 assert.equal(result.hours[0].temperature,null);
 assert.deepEqual(weatherAdvice(result.hours),[]);
 assert.equal(result.fetchedAt,'2026-09-09T06:00:00Z');
 assert.throws(()=>normalizeWeather({hourly:{time:[]}}));
});
test('hiking advice detects storms, gusts, rain, snow, heat and low visibility',()=>{
 const advice=weatherAdvice([{code:95,gust:50,rainProbability:80,snow:1,feels:32,visibility:400}]);
 assert.equal(advice.length,6);
 assert.equal(weatherLabel(0),'Despejado');
 assert.equal(weatherLabel(null),'Sin datos');
});
test('both weather APIs fail closed when the shared rate limiter is unavailable',()=>{
 for(const path of ['/api/weather','/api/weather/places'])assert.equal(rateLimitPolicy(path).failClosed,true);
});
test('rejects corrupt offline forecasts and keeps the original retrieval timestamp',()=>{
 assert.equal(validWeatherCache({}),false);
 assert.equal(validWeatherCache({fetchedAt:'bad',hours:[],days:[]}),false);
 const data=normalizeWeather({hourly:{time:['2026-09-09T08:00']},daily:{time:['2026-09-09']}},'2026-09-08T12:00:00Z');
 assert.equal(validWeatherCache(JSON.parse(JSON.stringify(data))),true);
 assert.equal(data.fetchedAt,'2026-09-08T12:00:00Z');
 assert.equal(daylightHours('2026-09-09T07:00','2026-09-09T20:30'),13.5);
 assert.equal(daylightHours(null,null),null);
});
