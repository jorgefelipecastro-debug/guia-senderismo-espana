import { OFFLINE_MAP_PROFILES, SPAIN_OFFLINE_BOUNDS, isKnownOfflineRegion, offlineRegionId } from '../../../../../lib/offline-regions';

export const dynamic = 'force-dynamic';

function expandBounds(bounds, ratio=.015) {
  const [west,south,east,north]=bounds,lonPad=Math.max(.01,(east-west)*ratio),latPad=Math.max(.01,(north-south)*ratio);
  return [Math.max(-18.5,west-lonPad),Math.max(27.3,south-latPad),Math.min(4.7,east+lonPad),Math.min(44.1,north+latPad)];
}

function area(bounds) { return Math.max(0,bounds[2]-bounds[0])*Math.max(0,bounds[3]-bounds[1]); }

function parseNominatimBounds(item) {
  const box=item?.boundingbox;
  if(!Array.isArray(box)||box.length!==4) return null;
  const [south,north,west,east]=box.map(Number);
  if(![west,south,east,north].every(Number.isFinite)||east<=west||north<=south) return null;
  return [west,south,east,north];
}

async function geocodeAdministrativeArea(name) {
  const url=new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q',`${name}, España`);
  url.searchParams.set('format','jsonv2');
  url.searchParams.set('limit','8');
  url.searchParams.set('countrycodes','es');
  url.searchParams.set('addressdetails','1');
  const response=await fetch(url,{headers:{Accept:'application/json','Accept-Language':'es','User-Agent':'Encumbrate/1.0 (https://www.encumbrate.es)'},signal:AbortSignal.timeout(12000),next:{revalidate:2592000}});
  if(!response.ok) throw Error(`Nominatim ${response.status}`);
  const rows=await response.json();
  const candidates=(Array.isArray(rows)?rows:[]).map(item=>({item,bounds:parseNominatimBounds(item)})).filter(entry=>entry.bounds);
  candidates.sort((a,b)=>area(b.bounds)-area(a.bounds));
  return candidates[0]?.bounds || null;
}

export async function GET(request) {
  const params=new URL(request.url).searchParams,kind=params.get('kind')||'',name=String(params.get('name')||'').trim();
  if(kind==='country' && (!name || name.toLocaleLowerCase('es')==='españa')){
    return Response.json({id:offlineRegionId('country','España'),name:'España completa',kind:'country',bounds:SPAIN_OFFLINE_BOUNDS,...OFFLINE_MAP_PROFILES.country},{headers:{'Cache-Control':'public, max-age=86400, stale-while-revalidate=604800'}});
  }
  if(!['community','province'].includes(kind)||!isKnownOfflineRegion(kind,name)) return Response.json({error:'Zona offline no válida.'},{status:400});
  try {
    const raw=await geocodeAdministrativeArea(name);
    if(!raw) return Response.json({error:'No se han podido obtener los límites de esta zona.'},{status:404});
    return Response.json({id:offlineRegionId(kind,name),name,kind,bounds:expandBounds(raw),...OFFLINE_MAP_PROFILES[kind]},{headers:{'Cache-Control':'public, max-age=86400, stale-while-revalidate=2592000'}});
  } catch(error) {
    console.error('Offline region bounds failed',error);
    return Response.json({error:'No se han podido preparar los límites de la descarga.'},{status:502,headers:{'Cache-Control':'no-store'}});
  }
}
