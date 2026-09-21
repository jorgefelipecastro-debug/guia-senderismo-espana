export function formatMapSize(bytes:number):string;
export function downloadedMapState(status:{exists:boolean;complete:boolean;percentage:number}):{label:string;tone:'ready'|'warning'};
export function canModifyDownloadedMap(routeId:string,activeRouteId?:string):boolean;
export const MIN_FREE_STORAGE_BYTES:number;
export const MIN_FREE_STORAGE_RATIO:number;
export function storageSafety(input:{freeBytes:number;totalBytes:number;extraBytes?:number}):{safe:boolean;reserve:number;usable:number;free:number;total:number;extra:number};
