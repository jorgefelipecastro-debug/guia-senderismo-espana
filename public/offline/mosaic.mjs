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
