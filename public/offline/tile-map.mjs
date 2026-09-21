const DB='encumbrate-offline-mosaic';
const STORE='tiles';
const TILE=256;
const MIN_ZOOM=5;
const MAX_ZOOM=15;

const req=request=>new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const rad=value=>Number(value)*Math.PI/180;
const deg=value=>Number(value)*180/Math.PI;

function openDb(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB,1);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'key'});
      if(!db.objectStoreNames.contains('packs'))db.createObjectStore('packs',{keyPath:'id'});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}
function key(z,x,y){return `${z}/${x}/${y}`;}
function worldSize(z){return TILE*(2**z);}
export function latLonToWorld(point,z){
  const size=worldSize(z),lat=clamp(Number(point.lat),-85.05112878,85.05112878),lon=Number(point.lon);
  const x=(lon+180)/360*size;
  const sin=Math.sin(rad(lat));
  const y=(.5-Math.log((1+sin)/(1-sin))/(4*Math.PI))*size;
  return{x,y};
}
export function worldToLatLon(point,z){
  const size=worldSize(z),lon=point.x/size*360-180,n=Math.PI-2*Math.PI*point.y/size;
  return{lat:deg(Math.atan(Math.sinh(n))),lon};
}
export function metersPerPixel(lat,z){return 156543.03392*Math.cos(rad(lat))/2**z;}

async function readBest(db,z,x,y,cache){
  for(let sourceZoom=z;sourceZoom>=MIN_ZOOM;sourceZoom--){
    const factor=2**(z-sourceZoom),sx=Math.floor(x/factor),sy=Math.floor(y/factor),k=key(sourceZoom,sx,sy);
    let record=cache.get(k);
    if(record===undefined){
      record=await req(db.transaction(STORE,'readonly').objectStore(STORE).get(k));
      cache.set(k,record||null);
    }
    if(record?.blob?.size)return{record,sourceZoom,factor,subX:x-sx*factor,subY:y-sy*factor};
  }
  return null;
}

function svg(tag,attrs={}){
  const node=document.createElementNS('http://www.w3.org/2000/svg',tag);
  for(const [name,value] of Object.entries(attrs))node.setAttribute(name,String(value));
  return node;
}

export function fitZoomForPoints(points,width,height,padding=44){
  const valid=(Array.isArray(points)?points:[]).filter(p=>Number.isFinite(p?.lat)&&Number.isFinite(p?.lon));
  if(!valid.length)return{zoom:MIN_ZOOM,center:{lat:40,lon:-3}};
  for(let z=MAX_ZOOM;z>=MIN_ZOOM;z--){
    const worlds=valid.map(p=>latLonToWorld(p,z)),xs=worlds.map(p=>p.x),ys=worlds.map(p=>p.y);
    if(Math.max(...xs)-Math.min(...xs)<=Math.max(64,width-padding*2)&&Math.max(...ys)-Math.min(...ys)<=Math.max(64,height-padding*2)){
      const centerWorld={x:(Math.min(...xs)+Math.max(...xs))/2,y:(Math.min(...ys)+Math.max(...ys))/2};
      return{zoom:z,center:worldToLatLon(centerWorld,z)};
    }
  }
  const worlds=valid.map(p=>latLonToWorld(p,MIN_ZOOM));
  return{zoom:MIN_ZOOM,center:worldToLatLon({x:(Math.min(...worlds.map(p=>p.x))+Math.max(...worlds.map(p=>p.x)))/2,y:(Math.min(...worlds.map(p=>p.y))+Math.max(...worlds.map(p=>p.y)))/2},MIN_ZOOM)};
}

export async function createOfflineGpsMap({container,track,onFollowChange}){
  const db=await openDb(),tileCache=new Map(),bitmapCache=new Map(),tiles=new Map(),pointers=new Map();
  let destroyed=false,renderId=0,zoom=12,center=track?.points?.[0]||{lat:40,lon:-3},position=null,accuracy=0,heading=null,follow=false,blue=[],red=[],panStart=null,pinchStart=null;
  container.innerHTML='';
  container.classList.add('gpsMap');

  const tileLayer=document.createElement('div');tileLayer.className='gpsTileLayer';
  const overlay=svg('svg',{class:'gpsOverlay','aria-hidden':'true'});
  const routePath=svg('path',{class:'gpsRoute'});
  const bluePath=svg('path',{class:'gpsGuideBlue'});
  const redPath=svg('path',{class:'gpsGuideRed'});
  const accuracyCircle=svg('circle',{class:'gpsAccuracy',hidden:''});
  const marker=svg('g',{class:'gpsMarker',hidden:''});
  const markerCircle=svg('circle',{r:9,cx:0,cy:0});
  const headingArrow=svg('path',{d:'M 0 -18 L 6 -7 L 0 -10 L -6 -7 Z'});
  marker.append(markerCircle,headingArrow);
  const startMarker=svg('circle',{class:'gpsStart',r:7});
  overlay.append(routePath,bluePath,redPath,accuracyCircle,startMarker,marker);
  const missing=document.createElement('div');missing.className='gpsMapStatus';missing.textContent='';
  container.append(tileLayer,overlay,missing);

  const sampleTrack=()=>{
    const points=track?.points||[];
    if(points.length<=2500)return points;
    const step=Math.ceil(points.length/2500),out=[];
    for(let i=0;i<points.length;i+=step)out.push(points[i]);
    if(out.at(-1)!==points.at(-1))out.push(points.at(-1));
    return out;
  };

  function dimensions(){return{width:Math.max(1,container.clientWidth),height:Math.max(1,container.clientHeight)};}
  function origin(){
    const {width,height}=dimensions(),cw=latLonToWorld(center,zoom);
    return{x:cw.x-width/2,y:cw.y-height/2,width,height};
  }
  function screenPoint(point){
    const o=origin(),w=latLonToWorld(point,zoom);
    return{x:w.x-o.x,y:w.y-o.y};
  }
  function pathFor(points){
    return (points||[]).map((point,index)=>{const p=screenPoint(point);return`${index?'L':'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;}).join(' ');
  }
  function renderOverlay(){
    const {width,height}=dimensions();
    overlay.setAttribute('viewBox',`0 0 ${width} ${height}`);
    routePath.setAttribute('d',pathFor(sampleTrack()));
    bluePath.setAttribute('d',pathFor(blue));
    redPath.setAttribute('d',pathFor(red));
    if(track?.points?.[0]){
      const p=screenPoint(track.points[0]);startMarker.setAttribute('cx',p.x);startMarker.setAttribute('cy',p.y);
    }
    if(position){
      const p=screenPoint(position),visible=p.x>-30&&p.x<width+30&&p.y>-30&&p.y<height+30;
      marker.toggleAttribute('hidden',!visible);accuracyCircle.toggleAttribute('hidden',!visible);
      if(visible){
        marker.setAttribute('transform',`translate(${p.x} ${p.y}) rotate(${Number.isFinite(heading)?heading:0})`);
        const radius=clamp(Number(accuracy||0)/Math.max(.1,metersPerPixel(position.lat,zoom)),10,120);
        accuracyCircle.setAttribute('cx',p.x);accuracyCircle.setAttribute('cy',p.y);accuracyCircle.setAttribute('r',radius);
      }
    }else{marker.setAttribute('hidden','');accuracyCircle.setAttribute('hidden','');}
  }

  async function bitmapFor(record){
    const k=record.key;
    if(bitmapCache.has(k))return bitmapCache.get(k);
    const promise=createImageBitmap(record.blob);
    bitmapCache.set(k,promise);
    if(bitmapCache.size>96){
      const first=bitmapCache.keys().next().value;
      const old=bitmapCache.get(first);bitmapCache.delete(first);old?.then?.(image=>image.close?.()).catch(()=>{});
    }
    return promise;
  }
  async function drawTile(canvas,tileX,tileY,token){
    const hit=await readBest(db,zoom,tileX,tileY,tileCache);
    if(destroyed||token!==renderId)return;
    const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#e8ede5';ctx.fillRect(0,0,TILE,TILE);
    if(!hit){canvas.dataset.missing='1';return;}
    try{
      const image=await bitmapFor(hit.record);
      if(destroyed||token!==renderId)return;
      const crop=TILE/hit.factor,sx=hit.subX*crop,sy=hit.subY*crop;
      ctx.drawImage(image,sx,sy,crop,crop,0,0,TILE,TILE);
      canvas.dataset.missing='0';
    }catch{canvas.dataset.missing='1';}
  }
  function renderTiles(){
    const token=++renderId,o=origin(),n=2**zoom;
    const minX=Math.max(0,Math.floor(o.x/TILE)-1),maxX=Math.min(n-1,Math.floor((o.x+o.width)/TILE)+1);
    const minY=Math.max(0,Math.floor(o.y/TILE)-1),maxY=Math.min(n-1,Math.floor((o.y+o.height)/TILE)+1);
    const needed=new Set();
    let count=0;
    for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++){
      const k=`${zoom}:${x}:${y}`;needed.add(k);count++;
      let canvas=tiles.get(k);
      if(!canvas){
        canvas=document.createElement('canvas');canvas.width=TILE;canvas.height=TILE;canvas.className='gpsTile';canvas.dataset.key=k;
        tiles.set(k,canvas);tileLayer.append(canvas);
        void drawTile(canvas,x,y,token);
      }
      canvas.style.transform=`translate3d(${Math.round(x*TILE-o.x)}px,${Math.round(y*TILE-o.y)}px,0)`;
    }
    for(const [k,node] of tiles)if(!needed.has(k)){node.remove();tiles.delete(k);}
    missing.textContent=count?'':'Sin cartografía descargada para esta vista';
    renderOverlay();
  }
  let frame=0;
  function render(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;renderTiles();});}
  function setCenter(next,{user=false}={}){
    center={lat:clamp(Number(next.lat),-85,85),lon:clamp(Number(next.lon),-180,180)};
    if(user&&follow){follow=false;onFollowChange?.(false);}
    render();
  }
  function setZoom(next,anchor){
    const value=clamp(Math.round(next),MIN_ZOOM,MAX_ZOOM);if(value===zoom)return;
    const {width,height}=dimensions(),focus=anchor||{x:width/2,y:height/2},oldOrigin=origin();
    const anchorLatLon=worldToLatLon({x:oldOrigin.x+focus.x,y:oldOrigin.y+focus.y},zoom);
    zoom=value;
    const newAnchor=latLonToWorld(anchorLatLon,zoom),centerWorld={x:newAnchor.x-(focus.x-width/2),y:newAnchor.y-(focus.y-height/2)};
    center=worldToLatLon(centerWorld,zoom);render();
  }
  function fitPoints(points,padding=54){
    const {width,height}=dimensions(),fit=fitZoomForPoints(points,width,height,padding);
    zoom=fit.zoom;center=fit.center;render();
  }
  function fitTrack(){if(track?.points?.length)fitPoints(track.points,40);}
  function setPosition(next,{followUser=follow}={}){
    position=next?{...next}:null;accuracy=Number(next?.accuracy||0);heading=Number.isFinite(Number(next?.heading))?Number(next.heading):null;
    if(position&&followUser){center={lat:position.lat,lon:position.lon};}
    render();
  }
  function setGuide({bluePoints=[],redPoints=[]}={}){blue=bluePoints;red=redPoints;render();}
  function recenter({zoom:requestedZoom}={}){
    if(!position)return false;
    follow=true;onFollowChange?.(true);
    if(Number.isFinite(requestedZoom))zoom=clamp(Math.round(requestedZoom),MIN_ZOOM,MAX_ZOOM);
    center={lat:position.lat,lon:position.lon};render();return true;
  }

  function pointerDown(event){
    container.setPointerCapture?.(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointers.size===1){panStart={x:event.clientX,y:event.clientY,center:latLonToWorld(center,zoom)};}
    else if(pointers.size===2){const values=[...pointers.values()],dx=values[0].x-values[1].x,dy=values[0].y-values[1].y;pinchStart={distance:Math.hypot(dx,dy),zoom};}
  }
  function pointerMove(event){
    if(!pointers.has(event.pointerId))return;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointers.size===1&&panStart){
      const dx=event.clientX-panStart.x,dy=event.clientY-panStart.y;
      center=worldToLatLon({x:panStart.center.x-dx,y:panStart.center.y-dy},zoom);
      if(follow){follow=false;onFollowChange?.(false);}render();
    }else if(pointers.size===2&&pinchStart){
      const values=[...pointers.values()],dx=values[0].x-values[1].x,dy=values[0].y-values[1].y,ratio=Math.hypot(dx,dy)/Math.max(1,pinchStart.distance);
      if(ratio>1.25){setZoom(pinchStart.zoom+1,{x:(values[0].x+values[1].x)/2-container.getBoundingClientRect().left,y:(values[0].y+values[1].y)/2-container.getBoundingClientRect().top});pinchStart={distance:Math.hypot(dx,dy),zoom};}
      else if(ratio<.8){setZoom(pinchStart.zoom-1,{x:(values[0].x+values[1].x)/2-container.getBoundingClientRect().left,y:(values[0].y+values[1].y)/2-container.getBoundingClientRect().top});pinchStart={distance:Math.hypot(dx,dy),zoom};}
    }
  }
  function pointerUp(event){
    pointers.delete(event.pointerId);if(!pointers.size){panStart=null;pinchStart=null;}else if(pointers.size===1){const p=[...pointers.values()][0];panStart={x:p.x,y:p.y,center:latLonToWorld(center,zoom)};}
  }
  function wheel(event){event.preventDefault();const rect=container.getBoundingClientRect();setZoom(zoom+(event.deltaY<0?1:-1),{x:event.clientX-rect.left,y:event.clientY-rect.top});}

  container.addEventListener('pointerdown',pointerDown);
  container.addEventListener('pointermove',pointerMove);
  container.addEventListener('pointerup',pointerUp);
  container.addEventListener('pointercancel',pointerUp);
  container.addEventListener('wheel',wheel,{passive:false});
  container.addEventListener('dblclick',event=>{const rect=container.getBoundingClientRect();setZoom(zoom+1,{x:event.clientX-rect.left,y:event.clientY-rect.top});});
  const resize=()=>render();window.addEventListener('resize',resize);

  fitTrack();
  return{
    setPosition,setGuide,fitTrack,fitPoints,recenter,
    zoomIn(){setZoom(zoom+1);},zoomOut(){setZoom(zoom-1);},
    getZoom(){return zoom;},isFollowing(){return follow;},
    setFollow(value){follow=Boolean(value);onFollowChange?.(follow);},
    destroy(){
      destroyed=true;window.removeEventListener('resize',resize);container.removeEventListener('pointerdown',pointerDown);container.removeEventListener('pointermove',pointerMove);container.removeEventListener('pointerup',pointerUp);container.removeEventListener('pointercancel',pointerUp);container.removeEventListener('wheel',wheel);
      if(frame)cancelAnimationFrame(frame);for(const promise of bitmapCache.values())promise?.then?.(image=>image.close?.()).catch(()=>{});db.close();container.innerHTML='';
    }
  };
}
