import {NextResponse} from 'next/server';
import {aemetAlertAreaCode,extractAemetAlertLinks,parseAemetCap,alertsForRoute,sampleAlertRoute,publicAlert} from '../../../../lib/aemet-alerts';

export const maxDuration=60;
const RSS='https://www.aemet.es/documentos_d/eltiempo/prediccion/avisos/rss/CAP_AFAE_wah_RSS.xml';
const TRUSTED_HOST='www.aemet.es';
const TRUSTED_PREFIX='/documentos_d/eltiempo/prediccion/avisos/';

async function textFromAemet(url,revalidate=300){
  const parsed=new URL(url);
  if(parsed.protocol!=='https:'||parsed.hostname!==TRUSTED_HOST||(!parsed.pathname.startsWith(TRUSTED_PREFIX)&&parsed.toString()!==RSS))throw new Error('AEMET_ALERT_URL');
  const response=await fetch(parsed,{headers:{Accept:'application/xml,text/xml;q=0.9,*/*;q=0.1','User-Agent':'Encumbrate/1.0 (https://www.encumbrate.es)'},signal:AbortSignal.timeout(12000),redirect:'error',next:{revalidate}});
  if(!response.ok)throw new Error('AEMET_ALERT_UPSTREAM');
  const type=response.headers.get('content-type')||'';
  if(!/xml|text/i.test(type))throw new Error('AEMET_ALERT_FORMAT');
  const bytes=await response.arrayBuffer();
  let text;
  try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{text=new TextDecoder('iso-8859-1').decode(bytes);}
  if(!text.includes('<'))throw new Error('AEMET_ALERT_FORMAT');
  return text;
}
async function mapLimit(values,limit,worker){
  const out=new Array(values.length);let index=0;
  async function run(){while(index<values.length){const current=index++;try{out[current]=await worker(values[current]);}catch{out[current]=null;}}}
  await Promise.all(Array.from({length:Math.min(limit,values.length)},run));
  return out.filter(Boolean);
}
export async function POST(request){
  try{
    const body=await request.json();
    const community=String(body?.community||'').slice(0,80), points=sampleAlertRoute(body?.points,300);
    if(points.length<1)return NextResponse.json({error:'No hay trazado suficiente para comprobar avisos.'},{status:400});
    const areaCode=aemetAlertAreaCode(community);
    if(!areaCode)return NextResponse.json({error:'No se ha podido identificar la zona AEMET de esta ruta.'},{status:400});
    const rss=await textFromAemet(RSS,300), links=extractAemetAlertLinks(rss,areaCode);
    if(!links.length)return NextResponse.json({provider:'AEMET',checkedAt:new Date().toISOString(),alerts:[],coverage:'route'});
    const caps=await mapLimit(links,8,url=>textFromAemet(url,300));
    const alerts=alertsForRoute(caps.flatMap(xml=>parseAemetCap(xml)),points).map(publicAlert);
    return NextResponse.json({provider:'AEMET',checkedAt:new Date().toISOString(),alerts,coverage:'route',source:'CAP 1.2'},{headers:{'Cache-Control':'public, s-maxage=300, stale-while-revalidate=300'}});
  }catch(error){
    return NextResponse.json({code:'AEMET_ALERTS_UNAVAILABLE',error:'No se han podido comprobar ahora los avisos oficiales de AEMET.'},{status:503,headers:{'Cache-Control':'no-store'}});
  }
}
