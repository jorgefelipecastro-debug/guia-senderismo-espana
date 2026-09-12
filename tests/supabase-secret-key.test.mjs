import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../lib/supabase-admin.js', import.meta.url),'utf8');

test('backend prefers modern Supabase secret key with legacy fallback',()=>{
  assert.match(source,/process\.env\.SUPABASE_SECRET_KEY\s*\|\|\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(source,/NEXT_PUBLIC_SUPABASE_SECRET_KEY/);
});
