import AsyncStorage from '@react-native-async-storage/async-storage';
import {downloadOfflineCartography} from './mapboxOffline';
export type GeoPoint={lat:number;lon:number};
export type OfflineRoute={id:string;name:string;points:GeoPoint[];savedAt:string;source?:string};
const key=(id:string)=>`encumbrate:native-route:${id}`;
export async function saveOfflineRoute(route:OfflineRoute){await AsyncStorage.setItem(key(route.id),JSON.stringify(route));return route}
export async function readOfflineRoute(id:string){
 const value=await AsyncStorage.getItem(key(id));
 if(!value)return null;
 try{
  const route=JSON.parse(value) as OfflineRoute;
  if(!route?.id||!Array.isArray(route.points)||route.points.length<2)return null;
  return route;
 }catch{return null}
}
export async function downloadRoute(webUrl:string,route:{id:string;name:string},onProgress?:(percentage:number)=>void){
 const response=await fetch(`${webUrl}/api/routes/track?id=${encodeURIComponent(route.id)}`),body=await response.json();
 if(!response.ok||!Array.isArray(body.points)||body.points.length<2)throw new Error(body.error||'Esta ruta no publica un trazado navegable.');
 const points=body.points.map((point:GeoPoint)=>({lat:Number(point?.lat),lon:Number(point?.lon)})).filter((point:GeoPoint)=>Number.isFinite(point.lat)&&Math.abs(point.lat)<=90&&Number.isFinite(point.lon)&&Math.abs(point.lon)<=180);
 if(points.length<2)throw new Error('El trazado recibido contiene coordenadas no válidas.');
 const saved:OfflineRoute={id:route.id,name:route.name,points,savedAt:new Date().toISOString(),source:body.source};
 // Solo se marca como disponible sin conexión cuando tanto el trazado como
 // la cartografía han terminado. Evita ofrecer una falsa garantía offline.
 await downloadOfflineCartography(saved,onProgress);
 return saveOfflineRoute(saved);
}
