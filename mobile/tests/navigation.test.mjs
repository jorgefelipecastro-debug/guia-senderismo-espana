import test from 'node:test';
import assert from 'node:assert/strict';
import {distanceMetres,nearestTrackPoint} from '../src/navigation/geometry.mjs';
test('calcula distancias GPS razonables',()=>{const metres=distanceMetres({lat:40.4168,lon:-3.7038},{lat:40.4177,lon:-3.7038});assert.ok(metres>95&&metres<105)});
test('elige el punto más cercano del trazado',()=>{const result=nearestTrackPoint({lat:40,lon:-3},[{lat:41,lon:-3},{lat:40.0001,lon:-3},{lat:39,lon:-3}]);assert.equal(result.index,1);assert.ok(result.distance<20)});
