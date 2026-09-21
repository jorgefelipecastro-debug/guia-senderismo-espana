import { operationalOptions, withOperationalCors } from "../../../../lib/operational-cors";
const MAX_BYTES = 10 * 1024 * 1024;
const TILE_MAX_BYTES = 1024 * 1024;
const SIZE = 2048;
const TILE_SIZE = 256;
const R = 6378137;
const WORLD = 2 * Math.PI * R;
const SPAIN = [-18.5,27.3,4.7,44.1];
const IGN_ATTEMPTS = 4;
const IGN_TIMEOUT_MS = 15000;

function unproject(x, y) {
  return { lon: (x / R) * 180 / Math.PI, lat: (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * 180 / Math.PI };
}
function parseBounds(value) {
  const bounds=String(value||'').split(',').map(Number);
  if(bounds.length!==4||!bounds.every(Number.isFinite))throw Error('invalid bbox');
  const [west,south,east,north]=bounds;
  if(east<=west||north<=south||east-west>80000||north-south>80000)throw Error('invalid extent');
  const sw=unproject(west,south),ne=unproject(east,north);
  if(sw.lat<26||ne.lat>45.5||sw.lon<-19.5||ne.lon>5.5)throw Error('outside Spain');
  return bounds;
}
function tileBounds(z,x,y,size=TILE_SIZE) {
  const zoom=Number(z),tileX=Number(x),tileY=Number(y),tileSize=Number(size);
  if(!Number.isInteger(zoom)||zoom<5||zoom>16||!Number.isInteger(tileX)||!Number.isInteger(tileY)||tileSize!==256)throw Error('invalid tile');
  const n=2**zoom;
  if(tileX<0||tileY<0||tileX>=n||tileY>=n)throw Error('invalid tile');
  const span=WORLD/n,west=-WORLD/2+tileX*span,east=west+span,north=WORLD/2-tileY*span,south=north-span;
  const sw=unproject(west,south),ne=unproject(east,north);
  if(ne.lon<SPAIN[0]||sw.lon>SPAIN[2]||ne.lat<SPAIN[1]||sw.lat>SPAIN[3])throw Error('outside Spain');
  return [west,south,east,north];
}
function ignUrl(bounds,size) {
  const params=new URLSearchParams({SERVICE:'WMS',VERSION:'1.3.0',REQUEST:'GetMap',LAYERS:'mtn_rasterizado',STYLES:'',CRS:'EPSG:3857',BBOX:bounds.join(','),WIDTH:String(size),HEIGHT:String(size),FORMAT:'image/jpeg'});
  return `https://www.ign.es/wms-inspire/mapa-raster?${params}`;
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,Math.max(0,ms)));
function retryDelay(response,attempt){
  const raw=response?.headers?.get?.('retry-after');
  if(raw!==null&&raw!==undefined&&raw!==''){
    const seconds=Number(raw);
    if(Number.isFinite(seconds)&&seconds>=0)return Math.min(5000,seconds*1000);
  }
  return Math.min(3000,300*(2**attempt));
}
async function fetchIgnImage(bounds,size,maxBytes,label){
  let last={status:0,type:'',announced:0,reason:'unknown'};
  for(let attempt=0;attempt<IGN_ATTEMPTS;attempt++){
    let response=null;
    try{
      response=await fetch(ignUrl(bounds,size),{cache:'no-store',signal:AbortSignal.timeout(IGN_TIMEOUT_MS)});
      const type=response.headers.get('content-type')||'';
      const announced=Number(response.headers.get('content-length')||0);
      if(response.ok&&type.startsWith('image/')&&announced<=maxBytes){
        const bytes=await response.arrayBuffer();
        if(bytes.byteLength&&bytes.byteLength<=maxBytes)return{bytes,type,attempts:attempt+1};
        last={status:response.status,type,announced,reason:'invalid-image-size'};
      }else{
        last={status:response.status,type,announced,reason:!response.ok?'upstream-status':!type.startsWith('image/')?'non-image':'image-too-large'};
      }
    }catch(error){
      last={status:0,type:'',announced:0,reason:error?.name==='TimeoutError'?'timeout':'network-error'};
    }
    if(attempt<IGN_ATTEMPTS-1){
      const delay=retryDelay(response,attempt);
      console.warn('Offline map upstream retry',{label,attempt:attempt+1,...last,delay});
      await sleep(delay);
    }
  }
  const error=Error('invalid IGN response');
  error.details={label,...last,attempts:IGN_ATTEMPTS};
  throw error;
}
export async function GET(request) {
  const params=new URL(request.url).searchParams;
  let bounds,size=SIZE,maxBytes=MAX_BYTES,isTile=false,label='legacy-raster';
  try {
    if(params.has('z')){
      size=Number(params.get('size')||TILE_SIZE);
      const z=params.get('z'),x=params.get('x'),y=params.get('y');
      bounds=tileBounds(z,x,y,size);
      maxBytes=TILE_MAX_BYTES;
      isTile=true;
      label=`z${z}/x${x}/y${y}`;
    } else bounds=parseBounds(params.get('bbox'));
  } catch { return withOperationalCors(request,Response.json({error:'Zona de mapa no valida.'},{status:400}),'GET, OPTIONS'); }
  try {
    const {bytes,type,attempts}=await fetchIgnImage(bounds,size,maxBytes,label);
    return withOperationalCors(request,new Response(bytes,{status:200,headers:{'Content-Type':type,'Content-Length':String(bytes.byteLength),'Cache-Control':isTile?'public, max-age=2592000, stale-while-revalidate=7776000':'public, max-age=86400, stale-while-revalidate=604800','X-Content-Type-Options':'nosniff','X-Encumbrate-IGN-Attempts':String(attempts),...(isTile?{'X-Encumbrate-Offline-Tile':'1'}:{})}}),'GET, OPTIONS');
  } catch(error) {
    console.error('Offline map proxy failed',error?.details||{label,message:error?.message});
    return withOperationalCors(request,Response.json({error:'El servidor cartografico esta respondiendo de forma temporalmente irregular. Encumbrate reintentara la descarga.'},{status:503,headers:{'Cache-Control':'no-store','Retry-After':'2'}}),'GET, OPTIONS');
  }
}

export async function OPTIONS(request) {
  return operationalOptions(request, 'GET, OPTIONS');
}
