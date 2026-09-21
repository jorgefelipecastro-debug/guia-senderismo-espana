const MAX_BYTES = 10 * 1024 * 1024;
const TILE_MAX_BYTES = 1024 * 1024;
const SIZE = 2048;
const TILE_SIZE = 256;
const R = 6378137;
const WORLD = 2 * Math.PI * R;
const SPAIN = [-18.5,27.3,4.7,44.1];

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
export async function GET(request) {
  const params=new URL(request.url).searchParams;
  let bounds,size=SIZE,maxBytes=MAX_BYTES,isTile=false;
  try {
    if(params.has('z')){size=Number(params.get('size')||TILE_SIZE);bounds=tileBounds(params.get('z'),params.get('x'),params.get('y'),size);maxBytes=TILE_MAX_BYTES;isTile=true;}
    else bounds=parseBounds(params.get('bbox'));
  } catch { return Response.json({error:'Zona de mapa no valida.'},{status:400}); }
  try {
    const response=await fetch(ignUrl(bounds,size),{cache:'no-store',signal:AbortSignal.timeout(20000)}),type=response.headers.get('content-type')||'',announced=Number(response.headers.get('content-length')||0);
    if(!response.ok||!type.startsWith('image/')||announced>maxBytes)throw Error('invalid IGN response');
    const bytes=await response.arrayBuffer();
    if(!bytes.byteLength||bytes.byteLength>maxBytes)throw Error('invalid image size');
    return new Response(bytes,{status:200,headers:{'Content-Type':type,'Content-Length':String(bytes.byteLength),'Cache-Control':isTile?'public, max-age=2592000, stale-while-revalidate=7776000':'public, max-age=86400, stale-while-revalidate=604800','X-Content-Type-Options':'nosniff',...(isTile?{'X-Encumbrate-Offline-Tile':'1'}:{})}});
  } catch(error) {
    console.error('Offline map proxy failed',error);
    return Response.json({error:'No se ha podido preparar la cartografia offline.'},{status:502,headers:{'Cache-Control':'no-store'}});
  }
}
