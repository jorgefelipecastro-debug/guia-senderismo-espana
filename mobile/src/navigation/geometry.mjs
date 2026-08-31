const rad=value=>value*Math.PI/180;
export function distanceMetres(a,b){const dLat=rad(b.lat-a.lat),dLon=rad(b.lon-a.lon),x=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;return 6371000*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
export function nearestTrackPoint(position,points){let point=points[0],index=0,distance=Infinity;points.forEach((candidate,i)=>{const next=distanceMetres(position,candidate);if(next<distance){distance=next;point=candidate;index=i}});return{point,index,distance}}
