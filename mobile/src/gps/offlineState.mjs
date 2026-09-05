export const MAX_STORED_POINTS=20000;

export function boundedMerge(current,points,limit=MAX_STORED_POINTS){
 const merged=[...current,...points];
 if(merged.length>limit)throw new Error('Almacenamiento GPS lleno: conecta el dispositivo antes de continuar.');
 return merged;
}

export function breadcrumbMerge(current,points,limit=MAX_STORED_POINTS){
 return [...current,...points].slice(-limit);
}

export function canFinalize(session,pendingCount){
 return Boolean(session?.finishRequested&&session?.remoteId&&pendingCount===0);
}

export function createLocalSession(route,userId,now=Date.now(),random=Math.random()){
 return {id:`local-${now}-${random.toString(36).slice(2)}`,userId,routeId:route.id,routeName:route.name,sequence:0,startedAt:new Date(now).toISOString(),routeLevel:route.level,distanceKm:route.distanceKm};
}
