import Mapbox,{offlineManager} from '@rnmapbox/maps';
import type {GeoPoint,OfflineRoute} from './routeStorage';

const publicToken=process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN||'';
if(publicToken)Mapbox.setAccessToken(publicToken);

function bounds(points:GeoPoint[],padding=.015){
 const lats=points.map(point=>point.lat),lons=points.map(point=>point.lon);
 return {ne:[Math.max(...lons)+padding,Math.max(...lats)+padding] as [number,number],sw:[Math.min(...lons)-padding,Math.min(...lats)-padding] as [number,number]};
}

export async function downloadOfflineCartography(route:OfflineRoute,onProgress?:(percentage:number)=>void){
 if(!publicToken)throw new Error('Falta configurar el token público de Mapbox.');
 const name=`encumbrate-${route.id}`,existing=await offlineManager.getPack(name);
 if(existing){onProgress?.(100);return name}
 const area=bounds(route.points);
 await new Promise<void>((resolve,reject)=>{
  let completed=false;
  offlineManager.createPack({name,styleURL:Mapbox.StyleURL.Outdoors,minZoom:10,maxZoom:17,bounds:[area.ne,area.sw]},(_pack,status)=>{onProgress?.(status.percentage);if(!completed&&status.percentage>=99.5){completed=true;resolve()}},(_pack,error)=>{if(!completed){completed=true;reject(new Error(error.message||'No se pudo descargar la cartografía.'))}}).catch(reject);
 });
 return name;
}

export async function removeOfflineCartography(routeId:string){await offlineManager.deletePack(`encumbrate-${routeId}`)}
