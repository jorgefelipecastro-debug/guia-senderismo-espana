import {validTrack,trackKey,mapBounds,pixel,readMap,removeMap,downloadMap,project,squareBoundsForPoints,boundsContainPoint,SIZE} from './maps.mjs';
import {renderMosaicForBounds,downloadRouteDetail} from './mosaic.mjs';
import {bearingDegrees,breadcrumbReturn,compass,distanceMetres,formatDistance,gpsErrorMessage,routeMetrics,shouldSaveBreadcrumb} from './nav.mjs';
const $=id=>document.getElementById(id), tracks=[];
let track,record,mosaicRecord,navigationRecord,bounds,imageURL,watch=null,controller=null,zoom=1,selection=0,lastFix=0,position=null,navMode='idle',breadcrumbs=[],viewBusy=false,lastViewPoint=null;
try {
  for(let i=0;i<localStorage.length;i++) {
    const key=localStorage.key(i);
    if(!key.startsWith('encumbrate:offline-route:') && key!=='encumbrate:offline-route') continue;
    try {const item=JSON.parse(localStorage.getItem(key));if(validTrack(item)&&!tracks.some(t=>t.id===item.id))tracks.push(item);}catch{}
  }
}catch {$('empty').textContent='El almacenamiento no está disponible. Abre la aplicación fuera del modo privado.';}
for(const t of tracks){const option=document.createElement('option');option.value=t.id;option.textContent=t.name || 'Ruta guardada';$('routes').append(option);}
$('empty').hidden=tracks.length>0;$('routes').disabled=!tracks.length;
const wanted=new URLSearchParams(location.search).get('route');if(tracks.some(t=>t.id===wanted))$('routes').value=wanted;
function connection(){ $('connection').textContent=navigator.onLine?'Con conexión · prepara tus mapas antes de salir':'Sin conexión · consultando las descargas de este dispositivo';$('download').disabled=!navigator.onLine || !!controller;$('remove').disabled=!!controller; }
window.addEventListener('online',connection);window.addEventListener('offline',connection);connection();
function breadcrumbKey(){return track?'encumbrate:offline-breadcrumbs:'+track.id:'';}
function loadBreadcrumbs(){try{const value=JSON.parse(localStorage.getItem(breadcrumbKey())||'[]');return Array.isArray(value)?value.filter(p=>Number.isFinite(p?.lat)&&Number.isFinite(p?.lon)).slice(-1500):[]}catch{return[]}}
function saveBreadcrumb(point){if(!track||!point)return;const previous=breadcrumbs.at(-1);if(!shouldSaveBreadcrumb(previous,point,8))return;breadcrumbs=[...breadcrumbs,{lat:point.lat,lon:point.lon,at:Date.now()}].slice(-1500);try{localStorage.setItem(breadcrumbKey(),JSON.stringify(breadcrumbs))}catch{}}
function linePath(points){if(!bounds||!Array.isArray(points)||points.length<2)return'';return points.map((p,i)=>{const q=pixel(p,bounds);return (i?'L':'M')+q.x.toFixed(2)+' '+q.y.toFixed(2)}).join(' ')}
function setNavMode(mode,message=''){navMode=mode;const labels={idle:'Lista para empezar.',toStart:'Orientación al inicio',route:'Navegación activa',lost:'Volver al sendero'};$('navMode').textContent=labels[mode]||labels.idle;$('stopGuide').hidden=mode==='idle';$('toStart').disabled=mode==='toStart';$('startRoute').disabled=mode==='route';$('lost').disabled=mode==='lost';if(message)$('navMessage').textContent=message;updateNavigation(position)}
function returnGuidePoints(){
  if(!position||!track)return[];
  const back=breadcrumbReturn(position,breadcrumbs,track.points,35);
  const nearest=routeMetrics(position,track.points,position.accuracy);
  const reachesTrail=back.length>1&&back.some(point=>routeMetrics(point,track.points,30)?.distance<=35);
  if(reachesTrail)return back;
  return nearest?.point?[position,nearest.point]:[];
}
function drawNavigation(){
  $('guideLine').setAttribute('d','');$('returnLine').setAttribute('d','');
  if(!position||!track||!bounds)return;
  if(navMode==='toStart')$('guideLine').setAttribute('d',linePath([position,track.points[0]]));
  if(navMode==='lost')$('returnLine').setAttribute('d',linePath(returnGuidePoints()));
}
function updateNavigation(current){
  if(!track)return;
  const start=track.points[0];
  if(!current){$('navDistance').textContent='—';$('navBearing').textContent='—';$('navTrailDistance').textContent='—';$('navProgress').textContent='—';$('navProgressBar').style.width='0%';drawNavigation();return}
  const metrics=routeMetrics(current,track.points,current.accuracy),toStart=distanceMetres(current,start),bearing=bearingDegrees(current,start);
  const onRoute=metrics&&['on-track','near'].includes(metrics.status);
  $('navTrailDistance').textContent=metrics?formatDistance(metrics.distance):'—';
  $('navProgress').textContent=onRoute?Math.round(metrics.progress*100)+'%':'—';
  $('navProgressBar').style.width=onRoute?Math.round(metrics.progress*100)+'%':'0%';
  if(navMode==='toStart'){
    $('navDistance').textContent=formatDistance(toStart);$('navBearing').textContent=compass(bearing)+' · '+Math.round(bearing)+'°';
    $('navMessage').textContent=toStart<=40?'Has llegado al inicio. Pulsa «Iniciar ruta».':'Inicio a '+formatDistance(toStart)+'. La línea azul une tu posición con el inicio.';
  }else if(navMode==='route'){
    $('navDistance').textContent=onRoute?formatDistance(metrics.remainingM):formatDistance(metrics.distance);
    $('navBearing').textContent=onRoute?Math.round(metrics.progress*100)+'%':'Fuera';
    $('navMessage').textContent=metrics?.status==='off-route'?'Estás a '+formatDistance(metrics.distance)+' del sendero. Pulsa «Estoy perdido» para verlo en rojo.':metrics?.status==='uncertain'?'La precisión GPS es baja. Espera una señal mejor.':metrics?'En ruta · quedan aproximadamente '+formatDistance(metrics.remainingM)+'.':'Navegación activa.';
  }else if(navMode==='lost'){
    const path=returnGuidePoints(),usingBreadcrumbs=path.length>2;
    $('navDistance').textContent=metrics?formatDistance(metrics.distance):'—';
    $('navBearing').textContent=usingBreadcrumbs?(path.length-1)+' puntos GPS':'Directo';
    $('navMessage').textContent=onRoute?'Has recuperado el sendero. Pulsa «Iniciar ruta».':usingBreadcrumbs?'Sigue la línea roja por tus propios pasos hasta volver al trazado verde.':'La línea roja señala directamente el punto más cercano del sendero. No representa un camino transitable.';
  }else{
    $('navDistance').textContent=formatDistance(toStart);$('navBearing').textContent=compass(bearing)+' · '+Math.round(bearing)+'°';
    $('navMessage').textContent='GPS listo. Elige «Ir al inicio» o «Iniciar ruta».';
  }
  drawNavigation();
}

function stopGPS(){if(watch!==null)navigator.geolocation.clearWatch(watch);watch=null;$('position').setAttribute('hidden','');$('gps').textContent='Mostrar mi posición';}
function centerOnPoint(point){
  if(!point||!bounds)return;
  const p=pixel(point,bounds),viewport=$('viewport');
  const x=p.x/SIZE*$('map').scrollWidth,y=p.y/SIZE*$('map').scrollHeight;
  viewport.scrollTo({left:Math.max(0,x-viewport.clientWidth/2),top:Math.max(0,y-viewport.clientHeight/2),behavior:'smooth'});
}
function updatePositionMarker(){
  if(!position||!bounds)return;
  const p=pixel(position,bounds),fresh=Date.now()-position.at<45000,inside=p.x>=0&&p.x<=SIZE&&p.y>=0&&p.y<=SIZE;
  $('position').toggleAttribute('hidden',!inside||!fresh);
  $('position').setAttribute('cx',p.x);$('position').setAttribute('cy',p.y);
  $('gpsStatus').textContent=!fresh?'La posición GPS está desactualizada.':!inside?'Tu posición está fuera de esta vista. Reencuadrando el mapa…':'GPS activo · precisión aproximada ±'+Math.round(position.accuracy)+' m'+(position.accuracy>50?' · señal imprecisa':'');
}
async function ensureNavigationFrame(force=false){
  if(!position||!track||navMode==='idle'||viewBusy)return;
  const metrics=routeMetrics(position,track.points,position.accuracy);
  if(!metrics)return;
  if(!force&&bounds&&boundsContainPoint(bounds,position,.12)&&lastViewPoint&&distanceMetres(lastViewPoint,position)<250)return;
  let points=[];
  if(navMode==='toStart')points=[position,track.points[0]];
  else if(navMode==='lost'){
    const back=returnGuidePoints();
    points=back.length>1?back:[position,metrics.point];
  }else{
    const from=Math.max(0,metrics.index-18),to=Math.min(track.points.length,metrics.index+20);
    points=[position,...track.points.slice(from,to)];
    if(metrics.distance>250)points.push(metrics.point);
  }
  try{
    const target=squareBoundsForPoints(points,{paddingRatio:.22,minPadding:650,minSpan:2200,maxSpan:65000});
    viewBusy=true;
    const mosaic=await renderMosaicForBounds(target);
    if(mosaic?.blob?.size){
      navigationRecord=mosaic;lastViewPoint={lat:position.lat,lon:position.lon};
      render(false);updatePositionMarker();
      if(force||navMode!=='route')centerOnPoint(position);
    }
  }catch(error){console.warn('No se pudo reencuadrar el mapa offline',error);}
  finally{viewBusy=false;}
}
function render(resetZoom=true){
  if(imageURL)URL.revokeObjectURL(imageURL);imageURL=null;
  const source=navigationRecord||record||mosaicRecord;
  if(source){bounds=source.bounds;imageURL=URL.createObjectURL(source.blob);$('background').setAttribute('href',imageURL);}
  else {$('background').removeAttribute('href');try {bounds=mapBounds(track);}catch {
    const ps=track.points.map(p=>({lat:p.lat,lon:p.lon}));
    // For very long routes the schematic remains available, without a fake basemap.
    const {min,max}=ps.reduce((a,p)=>({min:{lat:Math.min(a.min.lat,p.lat),lon:Math.min(a.min.lon,p.lon)},max:{lat:Math.max(a.max.lat,p.lat),lon:Math.max(a.max.lon,p.lon)}}),{min:ps[0],max:ps[0]});
    const lo=project(min),hi=project(max);bounds=[lo.x-1000,lo.y-1000,hi.x+1000,hi.y+1000];
  }}
  $('trail').setAttribute('d',track.points.map((p,i)=>{const q=pixel(p,bounds);return `${i?'L':'M'}${q.x.toFixed(2)} ${q.y.toFixed(2)}`;}).join(' '));
  const start=pixel(track.points[0],bounds);$('startPoint').setAttribute('cx',start.x);$('startPoint').setAttribute('cy',start.y);
  if(navigationRecord){
    const names=navigationRecord.packNames?.length?navigationRecord.packNames.join(', '):'cartografía offline';
    $('mapStatus').textContent=`Mapa interactivo offline · ${names}`;
  }else if(record){
    $('mapStatus').textContent=`Mapa de ruta y trazado guardados · ${(record.blob.size/1048576).toFixed(1)} MB · ${new Date(record.savedAt).toLocaleDateString('es-ES')}`;
  }else if(mosaicRecord){
    const names=mosaicRecord.packNames?.length?mosaicRecord.packNames.join(', '):'cartografía territorial descargada';
    const coverage=Math.round((mosaicRecord.coverage||0)*100);
    $('mapStatus').textContent=`Mapa territorial offline disponible · ${names} · cobertura de esta vista ${coverage}%`;
  }else{
    $('mapStatus').textContent='Solo trazado disponible. Descarga el mapa para ver el terreno sin conexión.';
  }
  $('attribution').hidden=!source;$('remove').hidden=!record;if(resetZoom){zoom=1;setZoom();}drawNavigation();updatePositionMarker();
}
async function select(){
  const version=++selection;controller?.abort();stopGPS();position=null;setNavMode('idle','Activa el GPS o inicia una guía offline.');track=tracks.find(t=>t.id===$('routes').value);if(!track)return;
  $('details').hidden=false;$('name').textContent=track.name || 'Ruta guardada';$('downloadStatus').textContent='';record=null;mosaicRecord=null;navigationRecord=null;lastViewPoint=null;breadcrumbs=loadBreadcrumbs();
  try {
    const saved=await readMap(track.id);
    if(version!==selection)return;
    if(saved?.key===trackKey(track))record=saved;
  }catch {$('downloadStatus').textContent='No se pudo abrir el almacén de mapas por ruta.';}
  if(!record && version===selection){
    try{
      const targetBounds=mapBounds(track);
      const mosaic=await renderMosaicForBounds(targetBounds);
      if(version!==selection)return;
      if(mosaic?.blob?.size)mosaicRecord=mosaic;
    }catch(error){
      console.warn('No se pudo componer el mosaico offline',error);
    }
  }
  if(version===selection)render();
}
$('routes').addEventListener('change',select);select();
$('download').onclick=async()=>{
  if(controller||!track)return;const current=track,version=selection;controller=new AbortController();
  const active=controller,timer=setTimeout(()=>active.abort(),120000);$('cancel').hidden=false;connection();$('downloadStatus').textContent='Preparando detalle de ruta zoom 14–15…';
  try{
    const pack=await downloadRouteDetail(current,{signal:active.signal,onProgress:p=>{if(version===selection)$('downloadStatus').textContent='Descargando detalle de ruta… '+p.percentage+'%';}});
    if(version!==selection)return;
    record=null;navigationRecord=null;mosaicRecord=await renderMosaicForBounds(mapBounds(current));render();
    $('downloadStatus').textContent='Detalle de ruta descargado · zoom 14–15 · '+pack.totalTiles+' teselas.';
    try{await navigator.storage?.persist?.();}catch{}
  }catch(error){
    if(version===selection)$('downloadStatus').textContent=active.signal.aborted?'Descarga interrumpida. Puedes reintentar; lo ya guardado se conserva.':error.name==='QuotaExceededError'?'No hay espacio suficiente. Elimina un mapa que ya no necesites.':error.message;
  }finally{clearTimeout(timer);controller=null;$('cancel').hidden=true;connection();}
};
$('cancel').onclick=()=>controller?.abort();
$('remove').onclick=async()=>{const id=track.id,version=selection;try {await removeMap(id);if(version===selection){record=null;try{mosaicRecord=await renderMosaicForBounds(mapBounds(track));}catch{mosaicRecord=null;}render();$('downloadStatus').textContent=mosaicRecord?'Mapa de ruta eliminado. Se seguirá usando la cartografía territorial descargada.':'Mapa eliminado. El trazado se conserva.';}}catch{$('downloadStatus').textContent='No se pudo eliminar el mapa.';}};
function setZoom(){$('map').style.width=`${zoom*100}%`;$('plus').disabled=zoom>=5;$('minus').disabled=zoom<=1;}
$('plus').onclick=()=>{zoom=Math.min(5,zoom+0.5);setZoom();};$('minus').onclick=()=>{zoom=Math.max(1,zoom-0.5);setZoom();};$('fit').onclick=()=>{zoom=1;setZoom();$('viewport').scrollTo({left:0,top:0,behavior:'smooth'});};
$('centerGps').onclick=()=>{if(position)centerOnPoint(position);else ensureGPS();};
$('fullscreen').onclick=()=>{const viewport=$('viewport'),active=viewport.classList.toggle('fullscreenMap');$('fullscreen').textContent=active?'✕':'⛶';if(position)setTimeout(()=>centerOnPoint(position),50);};
function ensureGPS(){
  if(watch!==null)return;
  if(!navigator.geolocation){$('gpsStatus').textContent='Este navegador no ofrece GPS.';return;}
  $('gpsStatus').textContent='Esperando una posición GPS…';$('gps').textContent='Ocultar mi posición';
  watch=navigator.geolocation.watchPosition(({coords,timestamp})=>{
    lastFix=timestamp;position={lat:coords.latitude,lon:coords.longitude,accuracy:Number(coords.accuracy||999),heading:Number(coords.heading),speed:Number(coords.speed),at:timestamp};
    if((navMode==='route'||navMode==='lost')&&position.accuracy<=80)saveBreadcrumb(position);
    if(bounds)updatePositionMarker();
    updateNavigation(position);
    if(navMode!=='idle')void ensureNavigationFrame(false);
  },error=>{$('position').setAttribute('hidden','');const message=gpsErrorMessage(error);$('gpsStatus').textContent=message;$('navMessage').textContent=message;},{enableHighAccuracy:true,maximumAge:1000,timeout:30000});
}
$('gps').onclick=()=>{if(watch!==null){stopGPS();$('gpsStatus').textContent='Posición desactivada.';}else ensureGPS();};
$('toStart').onclick=()=>{ensureGPS();setNavMode('toStart','Buscando el inicio con GPS offline…');setTimeout(()=>void ensureNavigationFrame(true),100);};
$('startRoute').onclick=()=>{ensureGPS();navigationRecord=null;lastViewPoint=null;setNavMode('route','Navegación de ruta activa.');if(position){saveBreadcrumb(position);setTimeout(()=>void ensureNavigationFrame(true),100);}};
$('lost').onclick=()=>{ensureGPS();setNavMode('lost','Preparando retorno al sendero…');setTimeout(()=>void ensureNavigationFrame(true),100);};
$('stopGuide').onclick=()=>{navigationRecord=null;lastViewPoint=null;setNavMode('idle','Guía detenida. El mapa offline sigue disponible.');render();};
const freshness=setInterval(()=>{if(watch!==null && lastFix && Date.now()-lastFix>30000){$('position').setAttribute('hidden','');$('gpsStatus').textContent='La posición GPS está desactualizada. Esperando una nueva señal…';}},5000);
window.addEventListener('pagehide',()=>{clearInterval(freshness);stopGPS();controller?.abort();if(imageURL)URL.revokeObjectURL(imageURL);});
(async()=>{
  try{
    if(navigator.onLine)await navigator.serviceWorker.register('/sw.js?v=18',{updateViaCache:'none'});
    const cache=await caches.open('encumbrate-public-v18');
    const resources=await Promise.all(['/offline.html','/offline/viewer.mjs','/offline/maps.mjs','/offline/mosaic.mjs','/offline/nav.mjs'].map(path=>cache.match(path)));
    $('bootStatus').textContent=resources.every(Boolean)?'Navegación offline guardada en este dispositivo.':'La pantalla offline aún se está preparando. Vuelve a abrirla con conexión antes de salir.';
  }catch{$('bootStatus').textContent='No se ha podido verificar el arranque offline en este navegador.';}
})();
