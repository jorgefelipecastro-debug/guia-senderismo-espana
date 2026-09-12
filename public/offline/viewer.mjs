import {validTrack,trackKey,mapBounds,pixel,readMap,removeMap,downloadMap,project,SIZE} from './maps.mjs';
const $=id=>document.getElementById(id), tracks=[];
let track,record,bounds,imageURL,watch=null,controller=null,zoom=1,selection=0,lastFix=0;
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
function stopGPS(){if(watch!==null)navigator.geolocation.clearWatch(watch);watch=null;$('position').setAttribute('hidden','');$('gps').textContent='Mostrar mi posición';}
function render(){
  if(imageURL)URL.revokeObjectURL(imageURL);imageURL=null;
  if(record){bounds=record.bounds;imageURL=URL.createObjectURL(record.blob);$('background').setAttribute('href',imageURL);}
  else {$('background').removeAttribute('href');try {bounds=mapBounds(track);}catch {
    const ps=track.points.map(p=>({lat:p.lat,lon:p.lon}));
    // For very long routes the schematic remains available, without a fake basemap.
    const {min,max}=ps.reduce((a,p)=>({min:{lat:Math.min(a.min.lat,p.lat),lon:Math.min(a.min.lon,p.lon)},max:{lat:Math.max(a.max.lat,p.lat),lon:Math.max(a.max.lon,p.lon)}}),{min:ps[0],max:ps[0]});
    const lo=project(min),hi=project(max);bounds=[lo.x-1000,lo.y-1000,hi.x+1000,hi.y+1000];
  }}
  $('trail').setAttribute('d',track.points.map((p,i)=>{const q=pixel(p,bounds);return `${i?'L':'M'}${q.x.toFixed(2)} ${q.y.toFixed(2)}`;}).join(' '));
  $('mapStatus').textContent=record?`Mapa y trazado guardados · ${(record.blob.size/1048576).toFixed(1)} MB · ${new Date(record.savedAt).toLocaleDateString('es-ES')}`:'Solo trazado disponible. Descarga el mapa para ver el terreno sin conexión.';
  $('attribution').hidden=!record;$('remove').hidden=!record;zoom=1;setZoom();
}
async function select(){
  const version=++selection;controller?.abort();stopGPS();track=tracks.find(t=>t.id===$('routes').value);if(!track)return;
  $('details').hidden=false;$('name').textContent=track.name || 'Ruta guardada';$('downloadStatus').textContent='';record=null;
  try {const saved=await readMap(track.id);if(version!==selection)return;if(saved?.key===trackKey(track))record=saved;}catch {$('downloadStatus').textContent='No se pudo abrir el almacén de mapas.';}
  if(version===selection)render();
}
$('routes').addEventListener('change',select);select();
$('download').onclick=async()=>{
  if(controller || !track)return;const current=track,version=selection;controller=new AbortController();
  const active=controller,timer=setTimeout(()=>active.abort(),45000);$('cancel').hidden=false;connection();$('downloadStatus').textContent='Descargando y comprobando el mapa del IGN…';
  try {const saved=await downloadMap(current,{signal:active.signal});if(version!==selection)return;record=saved;render();$('downloadStatus').textContent='Descarga completa y guardada. Puedes comprobarla en modo avión.';try{await navigator.storage?.persist?.();}catch{}}
  catch(error){if(version===selection)$('downloadStatus').textContent=active.signal.aborted?'Descarga interrumpida. Puedes reintentar; el mapa anterior se conserva.':error.name==='QuotaExceededError'?'No hay espacio suficiente. Elimina un mapa que ya no necesites.':error.message;}
  finally{clearTimeout(timer);controller=null;$('cancel').hidden=true;connection();}
};
$('cancel').onclick=()=>controller?.abort();
$('remove').onclick=async()=>{const id=track.id,version=selection;try {await removeMap(id);if(version===selection){record=null;render();$('downloadStatus').textContent='Mapa eliminado. El trazado se conserva.';}}catch{$('downloadStatus').textContent='No se pudo eliminar el mapa.';}};
function setZoom(){$('map').style.width=`${zoom*100}%`;$('plus').disabled=zoom>=4;$('minus').disabled=zoom<=1;}
$('plus').onclick=()=>{zoom=Math.min(4,zoom+0.5);setZoom();};$('minus').onclick=()=>{zoom=Math.max(1,zoom-0.5);setZoom();};$('fit').onclick=()=>{zoom=1;setZoom();$('viewport').scrollTo(0,0);};
$('gps').onclick=()=>{
  if(watch!==null){stopGPS();$('gpsStatus').textContent='Posición desactivada.';return;}
  if(!navigator.geolocation){$('gpsStatus').textContent='Este navegador no ofrece GPS.';return;}
  $('gpsStatus').textContent='Esperando una posición GPS…';$('gps').textContent='Ocultar mi posición';
  watch=navigator.geolocation.watchPosition(({coords,timestamp})=>{
    lastFix=timestamp;if(!bounds)return;const p=pixel({lat:coords.latitude,lon:coords.longitude},bounds);
    const fresh=Date.now()-timestamp<30000,inside=p.x>=0&&p.x<=SIZE&&p.y>=0&&p.y<=SIZE;
    $('position').toggleAttribute('hidden',!inside || !fresh);$('position').setAttribute('cx',p.x);$('position').setAttribute('cy',p.y);
    $('gpsStatus').textContent=!fresh?'La posición GPS está desactualizada.':!inside?'Estás fuera de la zona mostrada.':`Precisión GPS aproximada: ±${Math.round(coords.accuracy)} m${coords.accuracy>50?' · señal imprecisa':''}.`;
  },()=>{$('position').setAttribute('hidden','');$('gpsStatus').textContent='No se ha obtenido una posición. Revisa el permiso GPS y busca cielo abierto.';},{enableHighAccuracy:true,maximumAge:0,timeout:20000});
};
const freshness=setInterval(()=>{if(watch!==null && lastFix && Date.now()-lastFix>30000){$('position').setAttribute('hidden','');$('gpsStatus').textContent='La posición GPS está desactualizada. Esperando una nueva señal…';}},5000);
window.addEventListener('pagehide',()=>{clearInterval(freshness);stopGPS();controller?.abort();if(imageURL)URL.revokeObjectURL(imageURL);});
(async()=>{
  try{
    if(navigator.onLine)await navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'});
    const cache=await caches.open('encumbrate-public-v15');
    const resources=await Promise.all(['/offline.html','/offline/viewer.mjs','/offline/maps.mjs'].map(path=>cache.match(path)));
    $('bootStatus').textContent=resources.every(Boolean)?'Pantalla offline guardada en este dispositivo.':'La pantalla offline aún se está preparando. Vuelve a abrirla con conexión antes de salir.';
  }catch{$('bootStatus').textContent='No se ha podido verificar el arranque offline en este navegador.';}
})();
