const R=6371000;
const rad=value=>Number(value)*Math.PI/180;

export function distanceMetres(a,b){
  if(!a||!b)return Infinity;
  const dLat=rad(b.lat-a.lat),dLon=rad(b.lon-a.lon),lat1=rad(a.lat),lat2=rad(b.lat);
  const x=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(Math.max(0,1-x)));
}

export function bearingDegrees(a,b){
  const dLon=rad(b.lon-a.lon),lat1=rad(a.lat),lat2=rad(b.lat);
  return ((Math.atan2(Math.sin(dLon)*Math.cos(lat2),Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon))*180/Math.PI)+360)%360;
}

export function compass(degrees){
  return ['N','NE','E','SE','S','SO','O','NO'][Math.round((((Number(degrees)||0)%360)+360)%360)/45)%8];
}

export function nearestPolylinePoint(position,points){
  if(!position||!Array.isArray(points)||!points.length)return null;
  if(points.length===1)return{point:points[0],index:0,fraction:0,distance:distanceMetres(position,points[0])};
  const cos=Math.max(.01,Math.cos(rad(position.lat))),toXY=point=>({x:rad(point.lon-position.lon)*R*cos,y:rad(point.lat-position.lat)*R});
  let best=null;
  for(let index=0;index<points.length-1;index++){
    const a=toXY(points[index]),b=toXY(points[index+1]),dx=b.x-a.x,dy=b.y-a.y,length2=dx*dx+dy*dy;
    const fraction=length2?Math.max(0,Math.min(1,-((a.x*dx+a.y*dy)/length2))):0;
    const x=a.x+dx*fraction,y=a.y+dy*fraction,distance=Math.hypot(x,y);
    if(!best||distance<best.distance)best={
      point:{lat:points[index].lat+(points[index+1].lat-points[index].lat)*fraction,lon:points[index].lon+(points[index+1].lon-points[index].lon)*fraction},
      index,fraction,distance
    };
  }
  return best;
}

export function routeMetrics(position,points,accuracy=20){
  const nearest=nearestPolylinePoint(position,points);
  if(!nearest)return null;
  const segments=[],cumulative=[0];
  for(let i=0;i<points.length-1;i++){segments[i]=distanceMetres(points[i],points[i+1]);cumulative[i+1]=cumulative[i]+segments[i];}
  const travelled=cumulative[nearest.index]+segments[nearest.index]*nearest.fraction,total=cumulative.at(-1)||0;
  const safeAccuracy=Math.max(3,Math.min(80,Number(accuracy)||80)),onTrack=Math.max(25,Math.min(40,safeAccuracy*.9)),near=Math.max(50,Math.min(85,safeAccuracy*1.5));
  const status=nearest.distance<=onTrack?'on-track':nearest.distance<=near?'near':safeAccuracy>50?'uncertain':'off-route';
  return{...nearest,status,onTrackM:onTrack,nearM:near,progress:total?Math.max(0,Math.min(1,travelled/total)):0,travelledM:travelled,remainingM:Math.max(0,total-travelled),totalM:total};
}

export function breadcrumbReturn(position,breadcrumbs,track,arrivalThreshold=35){
  if(!position||!Array.isArray(breadcrumbs)||!breadcrumbs.length)return[];
  const result=[{lat:position.lat,lon:position.lon}];
  for(let i=breadcrumbs.length-1;i>=0;i--){
    const point=breadcrumbs[i];result.push({lat:point.lat,lon:point.lon});
    const nearest=nearestPolylinePoint(point,track);
    if(result.length>1&&nearest&&nearest.distance<=arrivalThreshold)break;
  }
  return result.length>1?result:[];
}

export function shouldSaveBreadcrumb(previous,next,minDistance=8){
  return !previous||distanceMetres(previous,next)>=Math.max(3,Number(minDistance)||8);
}

export function gpsErrorMessage(error){
  if(Number(error?.code)===1)return'Permiso de ubicación bloqueado. Activa Ubicación para Encúmbrate en los ajustes del navegador.';
  if(Number(error?.code)===2)return'El teléfono no entrega posición GPS todavía. El modo avión no apaga el GPS: comprueba que Ubicación esté activada y sal al exterior.';
  if(Number(error?.code)===3)return'Sin señal GPS todavía. Busca cielo abierto y espera unos segundos; la cartografía offline sigue disponible.';
  return'No se ha obtenido una posición GPS. Comprueba el permiso de ubicación y busca cielo abierto.';
}

export function formatDistance(metres){
  const value=Math.max(0,Number(metres)||0);
  return value<1000?`${Math.round(value)} m`:`${(value/1000).toLocaleString('es-ES',{maximumFractionDigits:1})} km`;
}
