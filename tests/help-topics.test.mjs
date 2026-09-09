import test from 'node:test';
import assert from 'node:assert/strict';
import { searchHelp, HELP_TOPICS } from '../lib/help-topics.js';
test('Ayuda encuentra búsquedas sin tildes y con mayúsculas',()=>{
 assert.ok(searchHelp('BRUJULA').some(topic=>topic.id==='compass'));
 assert.ok(searchHelp('  sin conexion ').some(topic=>topic.id==='offline'));
});
test('Ayuda permite recuperar todos los temas y reconoce búsquedas sin resultados',()=>{
 assert.equal(searchHelp(' ').length,HELP_TOPICS.length);
 assert.deepEqual(searchHelp('zzzzzzzz'),[]);
});
