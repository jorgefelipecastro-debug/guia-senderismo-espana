import AsyncStorage from '@react-native-async-storage/async-storage';
import {downloadOfflineCartography} from './mapboxOffline';
export type GeoPoint={lat:number;lon:number};
export type OfflineRoute={id:string;name:string;points:GeoPoint[];savedAt:string;source?:string};
const key=(id:string)=>`encumbrate:native-route:${id}`;
export async function saveOfflineRoute(route:OfflineRoute){await AsyncStorage.setItem(key(route.id),JSON.stringify(route));return route}
export async function readOfflineRoute(id:string){const value=await AsyncStorage.getItem(key(id));return value?JSON.parse(value) as OfflineRoute:null}
export async function downloadRoute(webUrl:string,route:{id:string;name:string},onProgress?:(percentage:number)=>void){const response=await fetch(`${webUrl}/api/routes/track?id=${encodeURIComponent(route.id)}`),body=await response.json();if(!response.ok||!Array.isArray(body.points)||body.points.length<2)throw new Error(body.error||'Esta ruta no publica un trazado navegable.');const saved=await saveOfflineRoute({id:route.id,name:route.name,points:body.points,savedAt:new Date().toISOString(),source:body.source});await downloadOfflineCartography(saved,onProgress);return saved}
