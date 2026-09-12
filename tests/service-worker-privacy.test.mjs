import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
const origin = 'https://www.encumbrate.es';
function harness() {
  const listeners = {}, stores = new Map(), calls = [];
  const key = r => new URL(typeof r === 'string' ? r : r.url, origin).href;
  const caches = {
    async keys() { return [...stores.keys()]; },
    async delete(n) { return stores.delete(n); },
    async open(n) {
      if (!stores.has(n)) stores.set(n, new Map());
      const entries = stores.get(n);
      return {
        async put(r, s) { entries.set(key(r), s.clone()); },
        async match(r) { return entries.get(key(r))?.clone(); },
        async delete(r) { return entries.delete(key(r)); },
        async keys() { return [...entries.keys()].map(url => new Request(url)); },
      };
    },
  };
  const h = {caches, stores, calls, offline: false, response: () => new Response('public', {headers: {'cache-control':'public, max-age=60'}})};
  vm.runInNewContext(source, {URL, Request, Response, caches,
    self: {location:{origin}, addEventListener:(n,f)=>listeners[n]=f, skipWaiting:async()=>{}, clients:{claim:async()=>{h.claimed = true;}}},
    fetch: async (r, options) => {calls.push({r,options}); if(h.offline) throw Error('offline'); return h.response(r);},
  });
  h.dispatch = async (name, request) => {
    const waits=[]; let result;
    listeners[name]({request, waitUntil:p=>waits.push(p), respondWith:p=>{result=p;}});
    const response=await result;
    await Promise.all(waits);
    return response;
  };
  return h;
}
const req = (path, headers={}) => new Request(new URL(path,origin), {headers});
test('upgrade purges owned legacy caches and preserves other apps', async()=>{
  const h=harness();
  for(const name of ['encumbrate-v13','encumbrate-v12','cumbre-v1','allzone-v1','encumbrate-public-v14']) await h.caches.open(name);
  await h.dispatch('activate');
  assert.deepEqual(await h.caches.keys(), ['allzone-v1','encumbrate-public-v14']); assert.equal(h.claimed,true);
});
test('shell is anonymous, public and never copied from user navigation', async()=>{
  const h=harness(); await h.dispatch('install');
  assert.ok(h.calls.every(c=>c.options.credentials==='omit' && c.options.redirect==='error'));
  h.response=()=>new Response('private page');
  await h.dispatch('fetch', {...req('/'), url:origin+'/', method:'GET',mode:'navigate',headers:new Headers()});
  h.offline=true;
  const response=await h.dispatch('fetch',{url:origin+'/',method:'GET',mode:'navigate',headers:new Headers()});
  assert.equal(await response.text(),'public');
});
test('private shell does not block activation and is never cached',async()=>{
  const h=harness();h.response=()=>new Response('secret',{headers:{'cache-control':'private, no-store'}});
  await h.dispatch('install');assert.equal(h.stores.get('encumbrate-public-v14').size,0);
});
test('APIs, cross-origin media, tokens and RSC never use cached responses even across account changes',async()=>{
  const h=harness(), cache=await h.caches.open('encumbrate-v13');
  for(const path of ['/api/profile','https://project.supabase.co/rest/v1/profiles','https://project.supabase.co/storage/v1/object/sign/photo?token=secret','/?_rsc=abc','/auth/callback?code=secret','/_next/static/test.js?token=secret']) {
    await cache.put(req(path),new Response('previous account'));
    h.offline=false; await h.dispatch('fetch',req(path));
    h.offline=true; assert.equal((await h.dispatch('fetch',req(path))).type,'error');
  }
  assert.equal(h.stores.size,1);
});
test('public static assets work offline, authenticated requests do not reuse them',async()=>{
  const h=harness();await h.dispatch('fetch',req('/_next/static/chunk.js'));h.offline=true;
  assert.equal(await (await h.dispatch('fetch',req('/_next/static/chunk.js'))).text(),'public');
  assert.equal((await h.dispatch('fetch',req('/_next/static/chunk.js',{Authorization:'Bearer test'}))).type,'error');
});
test('private, no-store, cookie and varying auth responses are rejected and old copies removed',async()=>{
  for(const headers of [{'cache-control':'private'},{'cache-control':'no-store'},{'set-cookie':'session=test'},{vary:'Cookie'},{vary:'Authorization'},{vary:'*'}]) {
    const h=harness();await h.dispatch('fetch',req('/_next/static/chunk.js'));
    h.response=()=>new Response('secret',{headers});await h.dispatch('fetch',req('/_next/static/chunk.js'));h.offline=true;
    assert.equal((await h.dispatch('fetch',req('/_next/static/chunk.js'))).type,'error');
  }
});
test('cache quota failure does not turn a successful request into failure',async()=>{
  const h=harness();h.caches.open=async()=>{throw Error('quota');};
  assert.equal(await (await h.dispatch('fetch',req('/_next/static/chunk.js'))).text(),'public');
});
test('asset limit preserves the anonymous shell',async()=>{
  const h=harness();await h.dispatch('install');
  for(let i=0;i<165;i++) await h.dispatch('fetch',req(`/_next/static/${i}.js`));
  const c=await h.caches.open('encumbrate-public-v14');assert.equal((await c.keys()).length,165);assert.ok(await c.match('/'));
});
