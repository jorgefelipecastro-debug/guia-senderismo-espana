export function offlineBounds(points,padding=.015){
 if(!Array.isArray(points)||points.length<2)throw new Error('El trazado necesita al menos dos puntos.');
 const valid=points.every(point=>Number.isFinite(point.lat)&&Math.abs(point.lat)<=90&&Number.isFinite(point.lon)&&Math.abs(point.lon)<=180);
 if(!valid)throw new Error('El trazado contiene coordenadas no válidas.');
 const lats=points.map(point=>point.lat),lons=points.map(point=>point.lon);
 return {ne:[Math.max(...lons)+padding,Math.max(...lats)+padding],sw:[Math.min(...lons)-padding,Math.min(...lats)-padding]};
}
export const isPackComplete=status=>Number(status?.percentage)>=99.5&&Number(status?.requiredResourceCount)>0;
