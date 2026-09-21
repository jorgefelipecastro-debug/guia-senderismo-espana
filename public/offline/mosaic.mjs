const DB_NAME='encumbrate-offline-mosaic';
const DB_VERSION=1;
const TILE_STORE='tiles';
const PACK_STORE='packs';
const R=6378137;
const WORLD=2*Math.PI*R;
const TILE_SIZE=256;

const req=request=>new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});

function openMosaic(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,DB_VERSION);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains(TILE_STORE))db.createObjectStore(TILE_STORE,{keyPath:'key'});
      if(!db.objectStoreNames.contains(PACK_STORE))db.createObjectStore(PACK_STORE,{keyPath:'id'});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
    request.onblocked=()=>reject(Error('Cierra otras pestañas para abrir los mapas territoriales.'));
  });
}
export const offlineTileKey=(z,x,y)=>`${z}/${x}/${y}`;

function clampTile(value,z){
  return Math.max(0,Math.min(2**z-1,Math.floor(value)));
}
export function targetZoomForBounds(bounds,size=2048){
  const width=Math.max(1,Number(bounds?.[2])-Number(bounds?.[0]));
  const ideal=Math.log2((WORLD*Math.max(256,size))/(TILE_SIZE*width));
  return Math.max(5,Math.min(15,Math.round(ideal)));
}
export function tileRangeForMercatorBounds(bounds,z){
  const [west,south,east,north]=bounds.map(Number),span=WORLD/(2**z);
  const minX=clampTile((west+WORLD/2)/span,z);
  const maxX=clampTile((east+WORLD/2-1e-7)/span,z);
  const minY=clampTile((WORLD/2-north)/span,z);
  const maxY=clampTile((WORLD/2-south-1e-7)/span,z);
  const tiles=[];
  for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++)tiles.push({z,x,y,key:offlineTileKey(z,x,y)});
  return tiles;
}
function mercatorBoundsForTile(z,x,y){
  const span=WORLD/(2**z),west=-WORLD/2+x*span,east=west+span,north=WORLD/2-y*span,south=north-span;
  return [west,south,east,north];
}
function allCandidateKeys(tiles){
  const keys=new Set();
  for(const tile of tiles){
    for(let z=tile.z;z>=5;z--){
      const factor=2**(tile.z-z);
      keys.add(offlineTileKey(z,Math.floor(tile.x/factor),Math.floor(tile.y/factor)));
    }
  }
  return [...keys];
}
async function readCandidates(keys){
  const db=await openMosaic();
  try{
    const tx=db.transaction([TILE_STORE,PACK_STORE],'readonly'),tilesStore=tx.objectStore(TILE_STORE),packsStore=tx.objectStore(PACK_STORE);
    const tilePromises=keys.map(key=>req(tilesStore.get(key)).then(record=>[key,record]));
    const packsPromise=req(packsStore.getAll());
    const [entries,packs]=await Promise.all([Promise.all(tilePromises),packsPromise]);
    return{records:new Map(entries.filter(([,record])=>record?.blob?.size)),packs:Array.isArray(packs)?packs:[]};
  }finally{db.close();}
}
function bestRecord(records,tile){
  for(let sourceZoom=tile.z;sourceZoom>=5;sourceZoom--){
    const factor=2**(tile.z-sourceZoom),sourceX=Math.floor(tile.x/factor),sourceY=Math.floor(tile.y/factor);
    const record=records.get(offlineTileKey(sourceZoom,sourceX,sourceY));
    if(record?.blob?.size)return{record,sourceZoom,factor,subX:tile.x-sourceX*factor,subY:tile.y-sourceY*factor};
  }
  return null;
}
function canvasBlob(canvas){
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?.size?resolve(blob):reject(Error('No se pudo componer el mapa offline.')),'image/jpeg',0.92));
}
export async function renderMosaicForBounds(bounds,{size=2048,createCanvas=()=>document.createElement('canvas'),createBitmap=createImageBitmap}={}){
  if(!Array.isArray(bounds)||bounds.length!==4||!bounds.every(Number.isFinite))return null;
  const z=targetZoomForBounds(bounds,size),targets=tileRangeForMercatorBounds(bounds,z);
  if(!targets.length||targets.length>256)return null;
  const {records,packs}=await readCandidates(allCandidateKeys(targets));
  if(!records.size)return null;
  const canvas=createCanvas();canvas.width=size;canvas.height=size;
  const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return null;
  ctx.fillStyle='#e9eddf';ctx.fillRect(0,0,size,size);
  const bitmaps=new Map(),usedPacks=new Set();
  let drawn=0;
  try{
    for(const tile of targets){
      const hit=bestRecord(records,tile);if(!hit)continue;
      let bitmap=bitmaps.get(hit.record.key);
      if(!bitmap){bitmap=await createBitmap(hit.record.blob);bitmaps.set(hit.record.key,bitmap);}
      const crop=TILE_SIZE/hit.factor,sx=hit.subX*crop,sy=hit.subY*crop;
      const tb=mercatorBoundsForTile(tile.z,tile.x,tile.y);
      const dx=(tb[0]-bounds[0])/(bounds[2]-bounds[0])*size;
      const dy=(bounds[3]-tb[3])/(bounds[3]-bounds[1])*size;
      const dw=(tb[2]-tb[0])/(bounds[2]-bounds[0])*size;
      const dh=(tb[3]-tb[1])/(bounds[3]-bounds[1])*size;
      ctx.drawImage(bitmap,sx,sy,crop,crop,dx,dy,dw,dh);
      for(const id of hit.record.packIds||[])usedPacks.add(String(id));
      drawn++;
    }
    if(!drawn)return null;
    const blob=await canvasBlob(canvas),packNames=packs.filter(pack=>usedPacks.has(String(pack.id))&&pack.status==='ready').map(pack=>pack.name).filter(Boolean);
    return{blob,bounds:[...bounds],packNames:[...new Set(packNames)],coverage:drawn/targets.length,drawn,total:targets.length,targetZoom:z};
  }finally{
    for(const bitmap of bitmaps.values())bitmap?.close?.();
  }
}


const routeDetailTileUrl=tile=>`/api/maps/offline?z=${tile.z}&x=${tile.x}&y=${tile.y}&size=256`;
const txDone=tx=>new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error||Error('No se pudo guardar la cartografía.'));});
async function getRecord(db,store,key){return req(db.transaction(store,'readonly').objectStore(store).get(key));}
async function putRecord(db,store,value){const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value);await txDone(tx);}

export async function downloadRouteDetail(track,{signal,onProgress,fetcher=fetch}={}){
  if(!track?.id||!Array.isArray(track.points)||track.points.length<2)throw Error('La ruta no contiene un trazado válido.');
  const projected=track.points.map(p=>({x:R*p.lon*Math.PI/180,y:R*Math.log(Math.tan(Math.PI/4+p.lat*Math.PI/360))}));
  let west=Infinity,east=-Infinity,south=Infinity,north=-Infinity;
  for(const p of projected){west=Math.min(west,p.x);east=Math.max(east,p.x);south=Math.min(south,p.y);north=Math.max(north,p.y);}
  const pad=1800,bounds=[west-pad,south-pad,east+pad,north+pad];
  const tiles=[...tileRangeForMercatorBounds(bounds,14),...tileRangeForMercatorBounds(bounds,15)];
  if(!tiles.length)throw Error('No se ha podido calcular el detalle de esta ruta.');
  if(tiles.length>2500)throw Error('Esta ruta es demasiado extensa para descargar detalle 14–15 de una sola vez.');
  const db=await openMosaic(),packId=`route-detail:${track.id}`,savedAt=new Date().toISOString();
  let done=0,bytes=0;
  try{
    for(const tile of tiles){
      if(signal?.aborted)throw Error('Descarga cancelada.');
      let record=await getRecord(db,TILE_STORE,tile.key);
      if(record?.blob?.size){
        const packIds=[...new Set([...(record.packIds||[]),packId])];
        if(packIds.length!==(record.packIds||[]).length)await putRecord(db,TILE_STORE,{...record,packIds});
        bytes+=record.blob.size;
      }else{
        const response=await fetcher(routeDetailTileUrl(tile),{cache:'no-store',credentials:'same-origin',signal});
        if(!response.ok||!response.headers.get('content-type')?.startsWith('image/'))throw Error(`No se ha podido descargar una parte del detalle (HTTP ${response.status||'desconocido'}).`);
        const blob=await response.blob();
        if(!blob.size||blob.size>1024*1024)throw Error('Una tesela del detalle no es válida.');
        await putRecord(db,TILE_STORE,{...tile,blob,bytes:blob.size,packIds:[packId],savedAt});
        bytes+=blob.size;
      }
      done++;
      onProgress?.({completed:done,total:tiles.length,percentage:Math.round(done/tiles.length*100),bytes});
    }
    const pack={id:packId,name:`${track.name||'Ruta'} · detalle`,kind:'route-detail',bounds,minZoom:14,maxZoom:15,totalTiles:tiles.length,completedTiles:tiles.length,totalBytes:bytes,status:'ready',savedAt,tileKeys:tiles.map(t=>t.key)};
    await putRecord(db,PACK_STORE,pack);
    window.dispatchEvent(new CustomEvent('encumbrate:offline-mosaic',{detail:pack}));
    return pack;
  }finally{db.close();}
}
