import test from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../app/api/release/route.js';

test('la API identifica el commit servido en Vercel', async () => {
  const old = process.env.VERCEL_GIT_COMMIT_SHA;
  const oldRailway = process.env.RAILWAY_GIT_COMMIT_SHA;
  try {
    delete process.env.RAILWAY_GIT_COMMIT_SHA;
    process.env.VERCEL_GIT_COMMIT_SHA = '0123456789abcdef';
    const response = await GET();
    assert.equal((await response.json()).release, '0123456789ab');
    assert.equal(response.headers.get('X-Release'), '0123456789ab');
  } finally {
    if (old === undefined) delete process.env.VERCEL_GIT_COMMIT_SHA;
    else process.env.VERCEL_GIT_COMMIT_SHA = old;
    if (oldRailway === undefined) delete process.env.RAILWAY_GIT_COMMIT_SHA;
    else process.env.RAILWAY_GIT_COMMIT_SHA = oldRailway;
  }
});
