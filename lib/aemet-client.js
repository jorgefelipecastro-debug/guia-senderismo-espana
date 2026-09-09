import {unstable_cache} from 'next/cache';
import {normalizeMunicipalities} from './aemet-weather.js';
export async function aemetData(path,revalidate=1800){
 const key=process.env.AEMET_API_KEY?.trim();if(!key)throw new Error('AEMET_CONFIGURATION');
 const response=await fetch(`https://opendata.aemet.es/opendata/api/${path}`,{headers:{api_key:key,Accept:'application/json'},signal:AbortSignal.timeout(12000),redirect:'error',next:{revalidate}});
 if(!response.ok)throw new Error(response.status===401?'AEMET_AUTH':'AEMET_UPSTREAM');
 const envelope=await response.json();if(envelope.estado!==200||typeof envelope.datos!=='string')throw new Error('AEMET_UPSTREAM');
 const url=new URL(envelope.datos);if(url.protocol!=='https:'||url.hostname!=='opendata.aemet.es'||url.port||url.username||url.password||!url.pathname.startsWith('/opendata/'))throw new Error('AEMET_DATA_URL');
 // Do not forward the API key to the returned download URL.
 const download=await fetch(url,{signal:AbortSignal.timeout(12000),redirect:'error',next:{revalidate}});if(!download.ok)throw new Error('AEMET_DOWNLOAD');
 const bytes=await download.arrayBuffer();let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{text=new TextDecoder('iso-8859-1').decode(bytes);}return JSON.parse(text);
}
export const aemetMunicipalities=unstable_cache(async()=>{const places=normalizeMunicipalities(await aemetData('maestro/municipios',86400));if(!places.length)throw new Error('AEMET_MUNICIPALITIES');return places;},['aemet-municipalities-v1'],{revalidate:86400});
