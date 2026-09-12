const AREA_CODES = new Map([
  ['andalucia','61'],['aragon','62'],['principado de asturias','63'],['asturias','63'],['illes balears','64'],['islas baleares','64'],['canarias','65'],['cantabria','66'],['castilla y leon','67'],['castilla-la mancha','68'],['castilla la mancha','68'],['cataluna','69'],['comunidad valenciana','77'],['comunitat valenciana','77'],['extremadura','70'],['galicia','71'],['comunidad de madrid','72'],['madrid','72'],['region de murcia','73'],['murcia','73'],['comunidad foral de navarra','74'],['navarra','74'],['pais vasco','75'],['euskadi','75'],['la rioja','76'],['ceuta','78'],['melilla','79'],
]);
const SEVERITY = {
  Moderate:{level:'amarillo',rank:1},
  Severe:{level:'naranja',rank:2},
  Extreme:{level:'rojo',rank:3},
};
const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const tagPattern=name=>new RegExp(`<(?:[\\w.-]+:)?${name}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?${name}>`,'i');
const tagsPattern=name=>new RegExp(`<(?:[\\w.-]+:)?${name}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?${name}>`,'gi');
function decodeXml(value='') {
  return String(value).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
    .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(Number.parseInt(n,16)))
    .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&').trim();
}
function rawTag(block,name){return String(block||'').match(tagPattern(name))?.[1]||'';}
function rawTags(block,name){return [...String(block||'').matchAll(tagsPattern(name))].map(match=>match[1]);}
function textTag(block,name){return decodeXml(rawTag(block,name).replace(/<[^>]+>/g,''));}
function parameterMap(info){
  const result=new Map();
  for(const block of rawTags(info,'parameter')){
    const name=textTag(block,'valueName'), value=textTag(block,'value');
    if(name)result.set(name,value);
  }
  return result;
}
function eventCode(info){
  for(const block of rawTags(info,'eventCode')){
    if(fold(textTag(block,'valueName')).includes('meteoalerta fenomeno'))return textTag(block,'value');
  }
  return '';
}
function zoneCode(area){
  for(const block of rawTags(area,'geocode')){
    if(fold(textTag(block,'valueName')).includes('meteoalerta zona'))return textTag(block,'value');
  }
  return '';
}
function parsePolygon(value){
  const points=decodeXml(value).split(/\s+/).map(pair=>{
    const [lat,lon]=pair.split(',').map(Number);
    return {lat,lon};
  }).filter(point=>Number.isFinite(point.lat)&&Number.isFinite(point.lon)&&Math.abs(point.lat)<=90&&Math.abs(point.lon)<=180);
  return points.length>=4?points:[];
}
export function aemetAlertAreaCode(community){return AREA_CODES.get(fold(community))||null;}
export function extractAemetAlertLinks(xml,areaCode){
  const links=[];
  for(const item of rawTags(xml,'item')){
    const value=textTag(item,'link');
    if(!value)continue;
    try{
      const url=new URL(value);
      if(url.hostname!=='www.aemet.es')continue;
      if(url.protocol==='http:')url.protocol='https:';
      if(url.protocol!=='https:'||!url.pathname.startsWith('/documentos_d/eltiempo/prediccion/avisos/')||!url.pathname.toLowerCase().endsWith('.xml'))continue;
      if(areaCode&&!url.pathname.includes(`_AFAZ${areaCode}`))continue;
      const normalized=url.toString();
      if(!links.includes(normalized))links.push(normalized);
    }catch{}
  }
  return links.slice(0,240);
}
export function parseAemetCap(xml,now=Date.now()){
  const current=now instanceof Date?now.getTime():Number(now), result=[];
  for(const alert of rawTags(xml,'alert')){
    const status=textTag(alert,'status');
    if(/test|exercise/i.test(status))continue;
    const infos=rawTags(alert,'info'), info=infos.find(block=>fold(textTag(block,'language')).startsWith('es'))||infos[0];
    if(!info)continue;
    const severity=textTag(info,'severity'), meta=SEVERITY[severity];
    if(!meta)continue;
    const expires=textTag(info,'expires'), expiry=Date.parse(expires);
    if(Number.isFinite(current)&&Number.isFinite(expiry)&&expiry<=current)continue;
    const parameters=parameterMap(info), coded=eventCode(info), parts=coded.split(';'), event=textTag(info,'event');
    const phenomenon=parts[1]?.trim()||event.replace(/\s+(amarillo|naranja|rojo).*$/i,'').trim()||'Fenómeno adverso';
    const level=fold(parameters.get('AEMET-Meteoalerta nivel'))||meta.level;
    const common={identifier:textTag(alert,'identifier'),sent:textTag(alert,'sent'),msgType:textTag(alert,'msgType'),severity,level:['amarillo','naranja','rojo'].includes(level)?level:meta.level,rank:meta.rank,event,phenomenon,probability:parameters.get('AEMET-Meteoalerta probabilidad')||'',parameter:parameters.get('AEMET-Meteoalerta parametro')||'',effective:textTag(info,'effective'),onset:textTag(info,'onset'),expires,certainty:textTag(info,'certainty'),headline:textTag(info,'headline'),description:textTag(info,'description'),instruction:textTag(info,'instruction'),web:textTag(info,'web')};
    for(const area of rawTags(info,'area')){
      const polygons=rawTags(area,'polygon').map(parsePolygon).filter(points=>points.length>=4);
      if(!polygons.length)continue;
      result.push({...common,zone:textTag(area,'areaDesc'),zoneCode:zoneCode(area),polygons});
    }
  }
  return result;
}
function pointOnSegment(point,a,b,epsilon=1e-9){
  const cross=(point.lon-a.lon)*(b.lat-a.lat)-(point.lat-a.lat)*(b.lon-a.lon);
  if(Math.abs(cross)>epsilon)return false;
  return point.lon>=Math.min(a.lon,b.lon)-epsilon&&point.lon<=Math.max(a.lon,b.lon)+epsilon&&point.lat>=Math.min(a.lat,b.lat)-epsilon&&point.lat<=Math.max(a.lat,b.lat)+epsilon;
}
export function pointInPolygon(point,polygon){
  if(!point||polygon.length<3)return false;
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[j],b=polygon[i];
    if(pointOnSegment(point,a,b))return true;
    const intersects=((a.lat>point.lat)!==(b.lat>point.lat))&&(point.lon<(b.lon-a.lon)*(point.lat-a.lat)/(b.lat-a.lat)+a.lon);
    if(intersects)inside=!inside;
  }
  return inside;
}
function orientation(a,b,c){
  const value=(b.lon-a.lon)*(c.lat-a.lat)-(b.lat-a.lat)*(c.lon-a.lon);
  return Math.abs(value)<1e-10?0:value>0?1:-1;
}
function segmentsIntersect(a,b,c,d){
  const o1=orientation(a,b,c),o2=orientation(a,b,d),o3=orientation(c,d,a),o4=orientation(c,d,b);
  if(o1!==o2&&o3!==o4)return true;
  return (o1===0&&pointOnSegment(c,a,b))||(o2===0&&pointOnSegment(d,a,b))||(o3===0&&pointOnSegment(a,c,d))||(o4===0&&pointOnSegment(b,c,d));
}
function boxesOverlap(points,polygon){
  const box=list=>list.reduce((acc,p)=>({minLat:Math.min(acc.minLat,p.lat),maxLat:Math.max(acc.maxLat,p.lat),minLon:Math.min(acc.minLon,p.lon),maxLon:Math.max(acc.maxLon,p.lon)}),{minLat:Infinity,maxLat:-Infinity,minLon:Infinity,maxLon:-Infinity});
  const a=box(points),b=box(polygon);
  return a.minLat<=b.maxLat&&a.maxLat>=b.minLat&&a.minLon<=b.maxLon&&a.maxLon>=b.minLon;
}
export function routeIntersectsPolygon(points,polygon){
  if(points.length<1||polygon.length<3||!boxesOverlap(points,polygon))return false;
  if(points.some(point=>pointInPolygon(point,polygon)))return true;
  for(let i=1;i<points.length;i++)for(let j=0;j<polygon.length;j++)if(segmentsIntersect(points[i-1],points[i],polygon[j],polygon[(j+1)%polygon.length]))return true;
  return false;
}
export function alertsForRoute(alerts,points){
  const valid=(points||[]).map(point=>({lat:Number(point?.lat),lon:Number(point?.lon)})).filter(point=>Number.isFinite(point.lat)&&Number.isFinite(point.lon)&&point.lat>=27&&point.lat<=45&&point.lon>=-19&&point.lon<=5);
  if(!valid.length)return [];
  const matched=(alerts||[]).filter(alert=>alert.polygons?.some(polygon=>routeIntersectsPolygon(valid,polygon)));
  const unique=new Map();
  for(const alert of matched){const key=[alert.identifier,alert.zoneCode,alert.phenomenon,alert.onset,alert.expires].join('|');if(!unique.has(key))unique.set(key,alert);}
  return [...unique.values()].sort((a,b)=>b.rank-a.rank||Date.parse(a.onset||a.effective||0)-Date.parse(b.onset||b.effective||0));
}
export function sampleAlertRoute(points,max=300){
  const valid=(points||[]).map(point=>({lat:Number(point?.lat),lon:Number(point?.lon)})).filter(point=>Number.isFinite(point.lat)&&Number.isFinite(point.lon)&&point.lat>=27&&point.lat<=45&&point.lon>=-19&&point.lon<=5);
  if(valid.length<=max)return valid;
  const output=[],seen=new Set();
  for(let i=0;i<max;i++){const index=Math.round(i*(valid.length-1)/(max-1));if(!seen.has(index)){seen.add(index);output.push(valid[index]);}}
  return output;
}
export function publicAlert(alert){const {polygons,...safe}=alert;return safe;}
