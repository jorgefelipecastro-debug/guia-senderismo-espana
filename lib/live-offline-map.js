const DB_NAME = 'encumbrate-offline-maps';
const STORE = 'maps';
const MAX_BYTES = 10 * 1024 * 1024;
const SIZE = 2048;
const R = 6378137;

const project = p => ({
  x: R * p.lon * Math.PI / 180,
  y: R * Math.log(Math.tan(Math.PI / 4 + p.lat * Math.PI / 360)),
});

const unproject = ({x,y}) => ({
  lon: x / R * 180 / Math.PI,
  lat: (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * 180 / Math.PI,
});

export function liveMapTrackKey(track) {
  let hash = 2166136261;
  for (const char of JSON.stringify(track?.points || []))
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return String(hash >>> 0);
}

export function liveMapBounds(track, extraPoints = []) {
  const points = track?.points;
  if (!Array.isArray(points) || points.length < 2)
    throw Error('El trazado no contiene coordenadas suficientes.');
  const extras = Array.isArray(extraPoints)
    ? extraPoints.filter(p => Number.isFinite(Number(p?.lat)) && Number.isFinite(Number(p?.lon)))
    : [];
  const projected = [...points, ...extras].map(project);
  let west=Infinity,east=-Infinity,south=Infinity,north=-Infinity;
  for (const p of projected) {
    west=Math.min(west,p.x);east=Math.max(east,p.x);
    south=Math.min(south,p.y);north=Math.max(north,p.y);
  }
  const span=Math.max(5000,east-west+4000,north-south+4000);
  if (span>80000) throw Error('La ruta es demasiado extensa para el mapa offline web.');
  const x=(west+east)/2,y=(south+north)/2;
  return [x-span/2,y-span/2,x+span/2,y+span/2];
}

export function liveMapUrl(bounds) {
  return `/api/maps/offline?bbox=${encodeURIComponent(bounds.join(','))}`;
}

export function leafletBoundsFromMercator(bounds) {
  if (!Array.isArray(bounds) || bounds.length !== 4 || !bounds.every(Number.isFinite))
    throw Error('Límites de mapa no válidos.');
  const southWest=unproject({x:bounds[0],y:bounds[1]}),
    northEast=unproject({x:bounds[2],y:bounds[3]});
  return [[southWest.lat,southWest.lon],[northEast.lat,northEast.lon]];
}

export function liveMapRecordCovers(record, point, marginMeters = 250) {
  if (!record?.bounds || !point || !Number.isFinite(Number(point.lat)) || !Number.isFinite(Number(point.lon))) return false;
  const p=project({lat:Number(point.lat),lon:Number(point.lon)}),[west,south,east,north]=record.bounds;
  return p.x>=west+marginMeters && p.x<=east-marginMeters && p.y>=south+marginMeters && p.y<=north-marginMeters;
}

function openDb() {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>{
      if(!request.result.objectStoreNames.contains(STORE))
        request.result.createObjectStore(STORE,{keyPath:'id'});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
    request.onblocked=()=>reject(Error('El almacén de mapas está ocupado.'));
  });
}

async function transact(mode,action) {
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,mode),request=action(tx.objectStore(STORE));
    tx.oncomplete=()=>{db.close();resolve(request.result);};
    tx.onerror=tx.onabort=()=>{db.close();reject(tx.error || Error('No se pudo acceder al mapa offline.'));};
  });
}

export async function readLiveOfflineMap(track) {
  if (!track?.id) return null;
  const record=await transact('readonly',store=>store.get(String(track.id)));
  return record?.key===liveMapTrackKey(track) && record?.blob instanceof Blob && record.blob.size>0 ? record : null;
}

async function saveLiveOfflineMap(record) {
  if (!(record.blob instanceof Blob) || !record.blob.size || record.blob.size>MAX_BYTES)
    throw Error('El mapa offline descargado no es válido.');
  await transact('readwrite',store=>store.put(record));
}

async function defaultValidateImage(blob) {
  if (typeof createImageBitmap !== 'function') return;
  const image=await createImageBitmap(blob);
  try {
    if (!image.width || !image.height) throw Error('La cartografía descargada no se puede representar.');
  } finally {
    image.close();
  }
}

export async function downloadLiveOfflineMap(track,{signal,fetcher=fetch,validateImage=defaultValidateImage,extraPoints=[]}={}) {
  if (!track?.id) throw Error('La ruta no tiene identificador.');
  const bounds=liveMapBounds(track,extraPoints),response=await fetcher(liveMapUrl(bounds),{
    credentials:'same-origin',cache:'no-store',signal,
  });
  if(!response.ok || !response.headers.get('content-type')?.startsWith('image/'))
    throw Error('No se pudo preparar el mapa offline del IGN.');
  const blob=await response.blob();
  if(!blob.size || blob.size>MAX_BYTES || !blob.type.startsWith('image/')) throw Error('El mapa offline no es válido.');
  await validateImage(blob);
  if(signal?.aborted) throw Error('Descarga cancelada.');
  const record={
    id:String(track.id),key:liveMapTrackKey(track),bounds,blob,
    savedAt:new Date().toISOString(),source:'CC BY 4.0 ign.es',width:SIZE,height:SIZE,
  };
  await saveLiveOfflineMap(record);
  const persisted=await readLiveOfflineMap(track);
  if(!persisted || persisted.key!==record.key || persisted.blob.size!==blob.size)
    throw Error('El mapa offline no ha quedado guardado correctamente.');
  await validateImage(persisted.blob);
  return persisted;
}
