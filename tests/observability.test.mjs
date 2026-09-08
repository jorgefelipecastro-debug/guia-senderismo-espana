import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('la monitorización captura fallos globales de cliente y servidor', () => {
  const client = read('app/ClientMonitoring.js');
  const server = read('instrumentation.js');
  const boundary = read('app/global-error.js');
  assert.match(client, /unhandledrejection/);
  assert.match(client, /sendBeacon/);
  assert.match(server, /onRequestError/);
  assert.match(server, /recordServerError/);
  assert.match(boundary, /\/api\/monitoring\/error/);
});

test('el registro privado agrupa incidencias y aplica retención', () => {
  const sql = read('supabase/migrations/20260908_application_observability.sql');
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /revoke all on public\.application_errors from public,anon,authenticated/i);
  assert.match(sql, /on conflict\(fingerprint\) do update/i);
  assert.match(sql, /occurrences=public\.application_errors\.occurrences\+1/i);
  assert.match(sql, /application_errors_reviewed_by_idx/i);
  assert.match(sql, /interval '90 days'/i);
});

test('la API de salud comprueba la base de datos y no expone detalles internos', () => {
  const health = read('app/api/health/route.js');
  assert.match(health, /from\('hiking_routes'\)/);
  assert.match(health, /status:503/);
  assert.doesNotMatch(health, /error\.stack/);
});

test('los errores solo son consultables y gestionables por administradores', () => {
  const admin = read('app/api/admin/monitoring/route.js');
  assert.match(admin, /app_metadata\?\.role!=='admin'/);
  assert.match(admin, /neq\('status','resolved'\)/);
  assert.match(admin, /\['acknowledged','resolved'\]/);
});

test('los datos sensibles se redactan antes de registrar una incidencia', () => {
  const monitoring = read('lib/monitoring.js');
  assert.match(monitoring, /Bearer \[REDACTADO\]/);
  assert.match(monitoring, /\[CORREO\]/);
  assert.match(monitoring, /token\|key\|secret\|code/);
});
