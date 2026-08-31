const rad=value=>value*Math.PI/180;
export function distanceMetres(a,b){const dLat=rad(b.lat-a.lat),dLon=rad(b.lon-a.lon),x=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;return 6371000*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
export function nearestTrackPoint(position,points){let point=points[0],index=0,distance=Infinity;points.forEach((candidate,i)=>{const next=distanceMetres(position,candidate);if(next<distance){distance=next;point=candidate;index=i}});return{point,index,distance}}
export function normalizeHeading(value){return ((Number(value)||0)%360+360)%360}
export function smoothHeading(previous,next,weight=.28){
 const from=normalizeHeading(previous),to=normalizeHeading(next);
 const delta=((to-from+540)%360)-180;
 return normalizeHeading(from+delta*Math.max(0,Math.min(1,weight)));
}
