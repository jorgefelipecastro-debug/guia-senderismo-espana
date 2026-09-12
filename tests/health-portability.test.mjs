import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../app/api/health/route.js',import.meta.url),'utf8');

test('health endpoint no longer depends on Vercel runtime identifiers',()=>{
 assert.doesNotMatch(source,/x-vercel-id/i);
 assert.doesNotMatch(source,/VERCEL_GIT_COMMIT_SHA/);
});

test('health endpoint reports Railway release and emits a request id',()=>{
 assert.match(source,/RAILWAY_GIT_COMMIT_SHA/);
 assert.match(source,/X-Request-Id/);
 assert.match(source,/crypto\.randomUUID\(\)/);
});
