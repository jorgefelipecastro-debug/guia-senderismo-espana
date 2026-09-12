// Public cartography only. No account, session, GPS history or private media here.
export const DB_NAME = 'encumbrate-offline-maps';
export const MAX_BYTES = 10 * 1024 * 1024;
export const SIZE = 2048;
const R = 6378137;
export const project = p => ({x: R * p.lon * Math.PI / 180, y: R * Math.log(Math.tan(Math.PI / 4 + p.lat * Math.PI / 360))});
export function validTrack(track) {
  return track && typeof track.id === 'string' && Array.isArray(track.points) && track.points.length >= 2 && track.points.length <= 20000 && track.points.every(p => Number.isFinite(p.lat) && Number.isFinite(p.lon) && p.lat >= 27 && p.lat <= 45 && p.lon >= -19 && p.lon <= 5);
}
export function trackKey(track) {
  let hash = 2166136261;
  for (const char of JSON.stringify(track.points)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return String(hash >>> 0);
}
export function mapBounds(track) {
  if (!validTrack(track)) throw Error('El trazado no contiene coordenadas válidas de España.');
  const points = track.points.map(project);
  let west=Infinity,east=-Infinity,south=Infinity,north=-Infinity;
  for (const p of points) {west=Math.min(west,p.x);east=Math.max(east,p.x);south=Math.min(south,p.y);north=Math.max(north,p.y);}
  const span = Math.max(2000, east-west+1000, north-south+1000);
  if (span > 80000) throw Error('Esta ruta es demasiado extensa para un mapa de zona. El trazado sigue disponible; usa la cartografía por zonas de Android.');
  const x=(west+east)/2,y=(south+north)/2;
  return [x-span/2,y-span/2,x+span/2,y+span/2];
}
export function mapURL(bounds) {
  const params = new URLSearchParams({SERVICE:'WMS',VERSION:'1.3.0',REQUEST:'GetMap',LAYERS:'mtn_rasterizado',STYLES:'',CRS:'EPSG:3857',BBOX:bounds.join(','),WIDTH:String(SIZE),HEIGHT:String(SIZE),FORMAT:'image/jpeg'});
  return `https://www.ign.es/wms-inspire/mapa-raster?${params}`;
}
export function pixel(point,bounds) {
  const p=project(point);
  return {x:(p.x-bounds[0])/(bounds[2]-bounds[0])*SIZE,y:(bounds[3]-p.y)/(bounds[3]-bounds[1])*SIZE};
}
export function openMaps() {
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>req.result.createObjectStore('maps',{keyPath:'id'});
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    req.onblocked=()=>reject(Error('Cierra otras pestañas para abrir los mapas guardados.'));
  });
}
async function transact(mode,action) {
  const db=await openMaps();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('maps',mode), request=action(tx.objectStore('maps'));
    tx.oncomplete=()=>{db.close();resolve(request.result);};
    tx.onerror=tx.onabort=()=>{db.close();reject(tx.error || Error('No se pudo guardar el mapa.'));};
  });
}
export const readMap=id=>transact('readonly',s=>s.get(id));
export const removeMap=id=>transact('readwrite',s=>s.delete(id));
export async function saveMap(record) {
  if (!(record.blob instanceof Blob) || record.blob.size===0 || record.blob.size>MAX_BYTES || !record.blob.type.startsWith('image/')) throw Error('El mapa recibido no es una imagen válida.');
  return transact('readwrite',s=>s.put(record));
}
export async function downloadMap(track,{signal,fetcher=fetch,validateImage=async blob=>{const image=await createImageBitmap(blob);try {if(image.width!==SIZE || image.height!==SIZE) throw Error('Mapa incompleto.');}finally {image.close();}}}={}) {
  const bounds=mapBounds(track);
  const response=await fetcher(mapURL(bounds),{credentials:'omit',cache:'no-store',signal});
  if(!response.ok || !response.headers.get('content-type')?.startsWith('image/') || Number(response.headers.get('content-length')||0)>MAX_BYTES) throw Error('IGN no ha entregado el mapa. Reintenta con conexión.');
  const blob=await response.blob();
  if(blob.size===0 || blob.size>MAX_BYTES) throw Error('El mapa está vacío o supera el tamaño permitido.');
  await validateImage(blob);
  if(signal?.aborted) throw Error('Descarga cancelada.');
  const record={id:track.id,key:trackKey(track),bounds,blob,savedAt:new Date().toISOString(),source:'CC BY 4.0 ign.es',width:SIZE,height:SIZE};
  await saveMap(record); // A previous complete copy survives any interrupted download.
  return record;
}
