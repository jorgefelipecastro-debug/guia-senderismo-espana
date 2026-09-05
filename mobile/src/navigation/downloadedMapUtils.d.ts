export function formatMapSize(bytes:number):string;
export function downloadedMapState(status:{exists:boolean;complete:boolean;percentage:number}):{label:string;tone:'ready'|'warning'};
export function canModifyDownloadedMap(routeId:string,activeRouteId?:string):boolean;
