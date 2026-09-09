import {NextResponse} from 'next/server';
import {unstable_cache} from 'next/cache';
import {weatherCoordinates} from '../../../lib/weather';
import {aemetData,aemetMunicipalities} from '../../../lib/aemet-client';
import {nearestMunicipality,normalizeAemetWeather} from '../../../lib/aemet-weather';
export const maxDuration=60;
const forecast=unstable_cache(async(id)=>{
 const [daily,hourly]=await Promise.allSettled([aemetData(`prediccion/especifica/municipio/diaria/${id}`),aemetData(`prediccion/especifica/municipio/horaria/${id}`)]);
 if(daily.status!=='fulfilled')throw daily.reason;
 return {daily:daily.value,hourly:hourly.status==='fulfilled'?hourly.value:[],fetchedAt:new Date().toISOString()};
},['aemet-forecast-v1'],{revalidate:1800});
export async function GET(request){
 const point=weatherCoordinates(request.nextUrl.searchParams.get('lat'),request.nextUrl.searchParams.get('lon'));
 if(!point)return NextResponse.json({error:'Coordenadas no válidas.'},{status:400});
 try{
  const place=nearestMunicipality(await aemetMunicipalities(),point);
  if(!place)return NextResponse.json({error:'No hay un municipio de referencia próximo con previsión de AEMET.'},{status:404});
  const result=await forecast(place.id),data=normalizeAemetWeather(result.daily,result.hourly,place,result.fetchedAt);
  return NextResponse.json(data,{headers:{'Cache-Control':'public, s-maxage=600, stale-while-revalidate=120'}});
 }catch(error){
  const code=['AEMET_CONFIGURATION','AEMET_AUTH'].includes(error.message)?error.message:'AEMET_UNAVAILABLE';
  return NextResponse.json({code,error:code==='AEMET_CONFIGURATION'?'La conexión meteorológica todavía no está configurada.':code==='AEMET_AUTH'?'AEMET requiere renovar la credencial de acceso.':'AEMET no responde ahora. Inténtalo de nuevo en unos minutos.'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
