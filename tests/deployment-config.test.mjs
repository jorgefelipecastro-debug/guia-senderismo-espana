import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('standalone se limita a Railway para no romper Vercel', async () => {
  const source = await readFile(new URL('../next.config.mjs', import.meta.url), 'utf8');
  assert.match(source, /RAILWAY_ENVIRONMENT_ID/);
  assert.match(source, /RAILWAY_PROJECT_ID/);
  assert.match(source, /RAILWAY_SERVICE_ID/);
  assert.match(source, /isRailway \? \{ output: 'standalone' \} : \{\}/);
  assert.doesNotMatch(source, /const nextConfig = \{\s*output: 'standalone'/);
});
