import test from 'node:test';
import assert from 'node:assert/strict';
import {configuredAemetExpiry,aemetKeyLifecycle,probeAemetCredential,AEMET_LEGACY_CUTOFF} from '../lib/aemet-key-health.js';
import {readFile} from 'node:fs/promises';

test('AEMET expiry can be derived from a creation date using three calendar months',()=>{
 const result=configuredAemetExpiry({AEMET_API_KEY_CREATED_AT:'2026-08-10'});
 assert.equal(result.source,'created_at');
 assert.equal(result.expiresAt.slice(0,10),'2026-11-10');
});

test('AEMET lifecycle warns at 30 days and becomes critical at 7 days',()=>{
 const warning=aemetKeyLifecycle({keyPresent:true,expiresAt:'2026-10-10T23:59:59Z',now:new Date('2026-09-12T00:00:00Z')});
 assert.equal(warning.state,'expiring-soon');
 assert.equal(warning.severity,'warning');
 const urgent=aemetKeyLifecycle({keyPresent:true,expiresAt:'2026-09-18T23:59:59Z',now:new Date('2026-09-12T00:00:00Z')});
 assert.equal(urgent.state,'expiring-urgent');
 assert.equal(urgent.severity,'critical');
});

test('unknown expiry explicitly preserves the legacy AEMET cutoff',()=>{
 const status=aemetKeyLifecycle({keyPresent:true,now:new Date('2026-09-12T00:00:00Z')});
 assert.equal(status.state,'unknown-expiry');
 assert.equal(status.legacyCutoff,AEMET_LEGACY_CUTOFF);
 assert.equal(AEMET_LEGACY_CUTOFF,'2026-10-15');
});

test('credential probe classifies HTTP and envelope 401 as unauthorized',async()=>{
 const http=await probeAemetCredential({key:'x',fetcher:async()=>({status:401,ok:false,json:async()=>({estado:401})})});
 assert.equal(http.status,'unauthorized');
 const envelope=await probeAemetCredential({key:'x',fetcher:async()=>({status:200,ok:true,json:async()=>({estado:401})})});
 assert.equal(envelope.status,'unauthorized');
});

test('runtime weather client records AEMET_AUTH as a critical health incident',async()=>{
 const source=await readFile(new URL('../lib/aemet-client.js',import.meta.url),'utf8');
 assert.match(source,/response\.status===401/);
 assert.match(source,/new Error\('AEMET_AUTH'\)/);
 assert.match(source,/severity:'critical'/);
 assert.match(source,/recordServerError/);
});

test('admin status endpoint is protected and never exposes the key',async()=>{
 const source=await readFile(new URL('../app/api/admin/aemet-status/route.js',import.meta.url),'utf8');
 assert.match(source,/app_metadata\?\.role !== 'admin'/);
 assert.match(source,/Cache-Control.*no-store/);
 assert.doesNotMatch(source,/AEMET_API_KEY\s*[:,]/);
});
