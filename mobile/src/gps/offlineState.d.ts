import type {NativeRouteSession,PendingPoint} from './storage';
export const MAX_STORED_POINTS:number;
export function boundedMerge(current:PendingPoint[],points:PendingPoint[],limit?:number):PendingPoint[];
export function breadcrumbMerge(current:PendingPoint[],points:PendingPoint[],limit?:number):PendingPoint[];
export function canFinalize(session:NativeRouteSession|null,pendingCount:number):boolean;
export function createLocalSession(route:{id:string;name:string;level?:string;distanceKm?:number},userId:string,now?:number,random?:number):NativeRouteSession;
