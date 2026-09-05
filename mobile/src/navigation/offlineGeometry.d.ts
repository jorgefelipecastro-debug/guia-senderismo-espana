import type {GeoPoint} from './routeStorage';
export function offlineBounds(points:GeoPoint[],padding?:number):{ne:[number,number];sw:[number,number]};
export function isPackComplete(status:{percentage?:number;requiredResourceCount?:number}):boolean;
