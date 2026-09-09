export function aemetNumber(v){if(Array.isArray(v))v=v[0];if(v===null||v===undefined||String(v).trim()==='')return null;const n=Number(v);return Number.isFinite(n)?n:null;}
const list=v=>Array.isArray(v)?v:[];
export function normalizeMunicipalities(rows){
 if(!Array.isArray(rows))throw new Error('AEMET municipalities unavailable');
 return rows.map(r=>({id:String(r.id||'').replace(/^id/,''),name:r.nombre,lat:aemetNumber(r.latitud_dec),lon:aemetNumber(r.longitud_dec),elevation:aemetNumber(r.altitud)})).filter(p=>/^\d{5}$/.test(p.id)&&typeof p.name==='string'&&p.lat!==null&&p.lon!==null);
}
export function municipalityDistance(a,b){const rad=n=>n*Math.PI/180,d=Math.sin(rad(b.lat-a.lat)/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(rad(b.lon-a.lon)/2)**2;return 6371*2*Math.asin(Math.sqrt(Math.min(1,d)));}
export function nearestMunicipality(places,point){let result=null,min=Infinity;for(const p of places){const d=municipalityDistance(p,point);if(d<min){min=d;result={...p,distanceKm:Math.round(d*10)/10};}}return min<=60?result:null;}
export function searchMunicipalities(places,query){const fold=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),q=fold(query);return places.filter(p=>fold(p.name).includes(q)).sort((a,b)=>Number(fold(b.name).startsWith(q))-Number(fold(a.name).startsWith(q))||a.name.localeCompare(b.name,'es')).slice(0,12);}
function sky(v){const n=aemetNumber(String(v??'').replace(/n$/,''));if(n===11)return 0;if([12,13,14,15,16,17].includes(n))return 3;if([33,34,35,36,71,72,73,74].includes(n))return 71;if([51,52,53,54,61,62,63,64].includes(n))return 95;if([23,24,25,26,43,44,45,46].includes(n))return 61;return null;}
function hourValue(items,hour,field='value'){return list(items).find(i=>String(i.periodo).padStart(2,'0')===hour)?.[field];}
function periodValue(items,hour){return list(items).find(i=>{const p=String(i.periodo||'');return p.length===4&&Number(hour)>=Number(p.slice(0,2))&&Number(hour)<Number(p.slice(2));});}
function maximum(items){const ns=list(items).map(i=>aemetNumber(i.value)).filter(n=>n!==null);return ns.length?Math.max(...ns):null;}
const directions={N:0,NE:45,E:90,SE:135,S:180,SO:225,O:270,NO:315};
export function normalizeAemetWeather(dailyRows,hourlyRows,place,fetchedAt=new Date().toISOString(),now=new Date()){
 const daily=Array.isArray(dailyRows)?dailyRows[0]:dailyRows,hourly=Array.isArray(hourlyRows)?hourlyRows[0]:hourlyRows;
 if(!list(daily?.prediccion?.dia).length)throw new Error('AEMET daily forecast unavailable');
 const timezone=/^(35|38)/.test(place.id)?'Atlantic/Canary':'Europe/Madrid';
 const hours=list(hourly?.prediccion?.dia).flatMap(day=>{
  const date=String(day.fecha).slice(0,10),periods=[...new Set(list(day.temperatura).map(i=>String(i.periodo).padStart(2,'0')))];
  return periods.filter(p=>/^\d{2}$/.test(p)&&Number(p)<24).map(hour=>{
   const block=periodValue(day.probPrecipitacion,hour),wind=list(day.vientoAndRachaMax).find(i=>String(i.periodo).padStart(2,'0')===hour&&i.velocidad!==undefined),gust=list(day.vientoAndRachaMax).find(i=>String(i.periodo).padStart(2,'0')===hour&&i.value!==undefined),direction=Array.isArray(wind?.direccion)?wind.direccion[0]:wind?.direccion;
   return {time:`${date}T${hour}:00`,temperature:aemetNumber(hourValue(day.temperatura,hour)),feels:aemetNumber(hourValue(day.sensTermica,hour)),code:sky(hourValue(day.estadoCielo,hour)),rainProbability:aemetNumber(block?.value),rainPeriod:block?.periodo||null,rain:aemetNumber(hourValue(day.precipitacion,hour)),snow:aemetNumber(hourValue(day.nieve,hour)),wind:aemetNumber(wind?.velocidad),gust:aemetNumber(gust?.value),windDirection:directions[direction]??null,visibility:null,cloud:null,uv:null};
  });
 }).sort((a,b)=>a.time.localeCompare(b.time));
 const days=list(daily.prediccion.dia).map(d=>{const date=String(d.fecha).slice(0,10),h=list(hourly?.prediccion?.dia).find(x=>String(x.fecha).startsWith(date)),c=list(d.estadoCielo);return {date,min:aemetNumber(d.temperatura?.minima),max:aemetNumber(d.temperatura?.maxima),code:sky((c.find(i=>!i.periodo||i.periodo==='00-24')||c[0])?.value),rainProbability:maximum(d.probPrecipitacion),uv:aemetNumber(d.uvMax),sunrise:h?.orto?`${date}T${h.orto}`:null,sunset:h?.ocaso?`${date}T${h.ocaso}`:null};});
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
 const localHour=`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:00`,current=hours.find(h=>h.time>=localHour)||{};
 return {provider:'AEMET',fetchedAt,issuedAt:daily.elaborado||null,timezone,elevation:place.elevation,municipality:place.name,distanceKm:place.distanceKm??0,hourlyAvailable:hours.length>0,current:{time:current.time,temperature:current.temperature??null,code:current.code??null,wind:current.wind??null},hours,days};
}
