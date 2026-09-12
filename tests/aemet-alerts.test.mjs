import test from 'node:test';
import assert from 'node:assert/strict';
import {aemetAlertAreaCode,extractAemetAlertLinks,parseAemetCap,pointInPolygon,routeIntersectsPolygon,alertsForRoute} from '../lib/aemet-alerts.js';

const CAP=`<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
<identifier>ES-AEMET-2026-1</identifier><sent>2026-09-12T10:00:00+02:00</sent><status>Actual</status><msgType>Alert</msgType>
<info><language>es-ES</language><event>Tormentas nivel naranja</event><severity>Severe</severity><certainty>Likely</certainty><effective>2026-09-12T12:00:00+02:00</effective><onset>2026-09-12T14:00:00+02:00</onset><expires>2026-09-12T22:00:00+02:00</expires>
<headline>Aviso por tormentas</headline><instruction>Evite zonas expuestas.</instruction>
<eventCode><valueName>AEMET-Meteoalerta fenómeno</valueName><value>1;Tormentas</value></eventCode>
<parameter><valueName>AEMET-Meteoalerta nivel</valueName><value>naranja</value></parameter>
<parameter><valueName>AEMET-Meteoalerta probabilidad</valueName><value>40%-70%</value></parameter>
<area><areaDesc>Interior de Alicante</areaDesc><polygon>38.10,-0.80 38.50,-0.80 38.50,-0.20 38.10,-0.20 38.10,-0.80</polygon><geocode><valueName>AEMET-Meteoalerta zona</valueName><value>0304</value></geocode></area>
</info></alert>`;

test('maps Spanish autonomous communities to AEMET warning area codes',()=>{
 assert.equal(aemetAlertAreaCode('Comunidad Valenciana'),'77');
 assert.equal(aemetAlertAreaCode('Principado de Asturias'),'63');
 assert.equal(aemetAlertAreaCode('desconocida'),null);
});
test('extracts only trusted regional CAP links from AEMET RSS',()=>{
 const rss='<rss><channel><item><link>http://www.aemet.es/documentos_d/eltiempo/prediccion/avisos/cap_AFAZ77_test.xml</link></item><item><link>https://evil.example/cap_AFAZ77.xml</link></item><item><link>https://www.aemet.es/documentos_d/eltiempo/prediccion/avisos/cap_AFAZ73_test.xml</link></item></channel></rss>';
 assert.deepEqual(extractAemetAlertLinks(rss,'77'),['https://www.aemet.es/documentos_d/eltiempo/prediccion/avisos/cap_AFAZ77_test.xml']);
});
test('parses current CAP alert and preserves official validity data',()=>{
 const [alert]=parseAemetCap(CAP,Date.parse('2026-09-12T13:00:00+02:00'));
 assert.equal(alert.level,'naranja');
 assert.equal(alert.rank,2);
 assert.equal(alert.phenomenon,'Tormentas');
 assert.equal(alert.zone,'Interior de Alicante');
 assert.equal(alert.probability,'40%-70%');
 assert.equal(alert.polygons.length,1);
 assert.equal(parseAemetCap(CAP,Date.parse('2026-09-12T23:00:00+02:00')).length,0);
});
test('detects a route crossing an AEMET warning polygon even when endpoints lie outside',()=>{
 const polygon=[{lat:38.1,lon:-.8},{lat:38.5,lon:-.8},{lat:38.5,lon:-.2},{lat:38.1,lon:-.2},{lat:38.1,lon:-.8}];
 assert.equal(pointInPolygon({lat:38.3,lon:-.5},polygon),true);
 assert.equal(routeIntersectsPolygon([{lat:38.3,lon:-1},{lat:38.3,lon:0}],polygon),true);
 assert.equal(routeIntersectsPolygon([{lat:37.5,lon:-1},{lat:37.5,lon:0}],polygon),false);
});
test('returns only active alerts intersecting the route',()=>{
 const alerts=parseAemetCap(CAP,Date.parse('2026-09-12T13:00:00+02:00'));
 assert.equal(alertsForRoute(alerts,[{lat:38.3,lon:-1},{lat:38.3,lon:0}]).length,1);
 assert.equal(alertsForRoute(alerts,[{lat:37.5,lon:-1},{lat:37.5,lon:0}]).length,0);
});
