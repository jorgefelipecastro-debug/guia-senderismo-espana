'use client';

import { useEffect, useRef, useState } from 'react';
import {gpsFixFresh,gpsFixUsable,navigationHeading,nearestPolylinePoint,plausibleGpsTransition,routeProximity} from '../lib/navigation-geometry';
import {downloadLiveOfflineMap,leafletBoundsFromMercator,liveMapRecordCovers,readLiveOfflineMap} from '../lib/live-offline-map';

const OSM_TILE_STALL_MS=3500;
const OSM_RECOVERY_MS=1200;

export default function LiveRouteGuide({route,track,onBack,onLost,onFinish}){
  const nodeRef=useRef(null),mapRef=useRef(null),userRef=useRef(null),followingRef=useRef(true),previousFixRef=useRef(null),lastGoodAtRef=useRef(null),probeBlockedRef=useRef(false),offlineUrlRef=useRef(null),offlineRecordRef=useRef(null),ensureOfflineCoverageRef=useRef(null),positionRef=useRef(null),[position,setPosition]=useState(null),[offRoute,setOffRoute]=useState(null),[gpsState,setGpsState]=useState('searching'),[tileError,setTileError]=useState(false),[offlineMapState,setOfflineMapState]=useState('checking'),[following,setFollowing]=useState(true);
  useEffect(()=>{followingRef.current=following},[following]);
  useEffect(()=>{
    let active=true,offlineLayer=null,preparing=false,tiles=null,forceOffline=false,tileCycleFailed=false,tileCycleSuccess=0,tileFailureTimer=null,healthyRecoveryTimer=null;
    const abort=new AbortController();
    async function mount(){
      const L=(await import('leaflet')).default;if(!active||!nodeRef.current)return;
      const points=track.points.map(p=>[p.lat,p.lon]),map=L.map(nodeRef.current,{zoomControl:false,attributionControl:true});mapRef.current=map;
      if(!map.getPane('offlineBasemap')){const pane=map.createPane('offlineBasemap');pane.style.zIndex='250';pane.style.pointerEvents='none'}

      const updateUserMarker=current=>{
        if(!active||!current)return;
        const icon=L.divIcon({className:'hikerArrowIcon',html:`<span style="transform:rotate(${current.heading}deg)">▲</span>`,iconSize:[44,44],iconAnchor:[22,22]});
        if(!userRef.current)userRef.current=L.marker([current.lat,current.lon],{icon,zIndexOffset:1000}).addTo(map);
        else userRef.current.setLatLng([current.lat,current.lon]).setIcon(icon);
        if(followingRef.current)map.setView([current.lat,current.lon],Math.max(map.getZoom(),16),{animate:true});
      };
      map._encumbrateSetUserPosition=updateUserMarker;
      if(positionRef.current)updateUserMarker(positionRef.current);

      const clearTileFailureTimer=()=>{if(tileFailureTimer){clearTimeout(tileFailureTimer);tileFailureTimer=null}};
      const clearHealthyRecoveryTimer=()=>{if(healthyRecoveryTimer){clearTimeout(healthyRecoveryTimer);healthyRecoveryTimer=null}};
      const applyNetworkLayerState=()=>{
        const useOffline=forceOffline||!navigator.onLine;
        tiles?.setOpacity(useOffline?0:1);
        offlineLayer?.setOpacity(useOffline?1:0);
      };

      async function activateOfflineFallback(){
        if(!active)return;
        forceOffline=true;setTileError(true);applyNetworkLayerState();
        await prepareOffline(positionRef.current||null);
        applyNetworkLayerState();
      }

      const armTileFailureWatchdog=()=>{
        if(tileFailureTimer||!active||!navigator.onLine)return;
        tileFailureTimer=setTimeout(()=>{
          tileFailureTimer=null;
          if(active&&navigator.onLine)activateOfflineFallback();
        },OSM_TILE_STALL_MS);
      };

      const scheduleHealthyRecovery=()=>{
        clearHealthyRecoveryTimer();
        if(!active||!navigator.onLine||tileCycleFailed||tileCycleSuccess<1)return;
        healthyRecoveryTimer=setTimeout(()=>{
          healthyRecoveryTimer=null;
          if(!active||!navigator.onLine||tileCycleFailed||tileCycleSuccess<1)return;
          forceOffline=false;setTileError(false);applyNetworkLayerState();
        },OSM_RECOVERY_MS);
      };

      const startTileCycle=()=>{
        tileCycleFailed=false;tileCycleSuccess=0;clearHealthyRecoveryTimer();armTileFailureWatchdog();
      };
      const markTileProgress=()=>{tileCycleSuccess+=1};
      const failTileCycle=()=>{
        tileCycleFailed=true;tileCycleSuccess=0;clearTileFailureTimer();clearHealthyRecoveryTimer();activateOfflineFallback();
      };
      const finishTileCycle=()=>{
        clearTileFailureTimer();
        if(!navigator.onLine)return;
        if(tileCycleFailed||tileCycleSuccess<1){activateOfflineFallback();return}
        scheduleHealthyRecovery();
      };

      tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'})
        .on('loading',startTileCycle)
        .on('tileloadstart',armTileFailureWatchdog)
        .on('tileload',markTileProgress)
        .on('tileerror',failTileCycle)
        .on('load',finishTileCycle)
        .addTo(map);
      L.polyline(points,{color:'#063d2c',weight:10,opacity:.72}).addTo(map);L.polyline(points,{color:'#78d443',weight:6,opacity:1}).addTo(map);map.fitBounds(L.latLngBounds(points),{padding:[30,30]});L.control.zoom({position:'bottomright'}).addTo(map);map.on('dragstart',()=>setFollowing(false));
      armTileFailureWatchdog();

      const installRecord=record=>{
        if(offlineLayer){map.removeLayer(offlineLayer);offlineLayer=null}
        if(offlineUrlRef.current){URL.revokeObjectURL(offlineUrlRef.current);offlineUrlRef.current=null}
        const url=URL.createObjectURL(record.blob);offlineUrlRef.current=url;offlineRecordRef.current=record;
        offlineLayer=L.imageOverlay(url,leafletBoundsFromMercator(record.bounds),{pane:'offlineBasemap',opacity:forceOffline||!navigator.onLine?1:0,interactive:false,attribution:'© Instituto Geográfico Nacional'}).addTo(map);
        applyNetworkLayerState();
      };

      async function prepareOffline(extraPoint=null,force=false){
        if(!active||preparing)return;preparing=true;setOfflineMapState('checking');
        try{
          let record=await readLiveOfflineMap(track);
          const needsCoverage=extraPoint && (!record || !liveMapRecordCovers(record,extraPoint));
          if((!record||needsCoverage||force)&&navigator.onLine){
            setOfflineMapState('preparing');
            record=await downloadLiveOfflineMap(track,{signal:abort.signal,extraPoints:extraPoint?[extraPoint]:[]});
          }
          if(!active||!record){setOfflineMapState('missing');return}
          installRecord(record);
          setOfflineMapState(extraPoint&&!liveMapRecordCovers(record,extraPoint)?'missing':'ready');
          try{await navigator.storage?.persist?.()}catch{}
        }catch{if(active)setOfflineMapState('missing')}
        finally{preparing=false}
      }

      ensureOfflineCoverageRef.current=async current=>{
        if(!active||!current)return;
        const record=offlineRecordRef.current||await readLiveOfflineMap(track);
        if(record&&liveMapRecordCovers(record,current)){if(!offlineRecordRef.current)installRecord(record);return}
        if(navigator.onLine)await prepareOffline(current,true);
      };

      const offline=()=>{clearTileFailureTimer();clearHealthyRecoveryTimer();forceOffline=true;setTileError(true);applyNetworkLayerState();prepareOffline(positionRef.current||null)};
      const online=()=>{forceOffline=true;setTileError(true);tileCycleFailed=false;tileCycleSuccess=0;clearHealthyRecoveryTimer();applyNetworkLayerState();prepareOffline(positionRef.current||null);tiles?.redraw();armTileFailureWatchdog()};
      window.addEventListener('offline',offline);window.addEventListener('online',online);map._encumbrateCleanup=()=>{window.removeEventListener('offline',offline);window.removeEventListener('online',online);clearTileFailureTimer();clearHealthyRecoveryTimer();tiles?.off();map._encumbrateSetUserPosition=null;ensureOfflineCoverageRef.current=null};
      await prepareOffline(positionRef.current||null);
      applyNetworkLayerState();
    }
    mount();
    return()=>{active=false;abort.abort();mapRef.current?._encumbrateCleanup?.();mapRef.current?.remove();mapRef.current=null;userRef.current=null;offlineRecordRef.current=null;positionRef.current=null;if(offlineUrlRef.current){URL.revokeObjectURL(offlineUrlRef.current);offlineUrlRef.current=null}}
  },[track.id]);
  useEffect(()=>{
    if(!navigator.geolocation){setGpsState('unsupported');return}
    previousFixRef.current=null;lastGoodAtRef.current=null;probeBlockedRef.current=false;
    let disposed=false,probeRunning=false;
    const toCandidate=({coords,timestamp})=>({lat:coords.latitude,lon:coords.longitude,accuracy:Number(coords.accuracy),heading:coords.heading,speed:coords.speed,at:Number(timestamp)||Date.now()});
    const markError=(error)=>{probeBlockedRef.current=true;setGpsState(error?.code===1?'denied':'paused')};
    const applyFix=(candidate,{probe=false}={})=>{
      if(disposed)return;
      if(!gpsFixFresh(candidate)){if(probe)markError({code:2});return}
      if(probe)probeBlockedRef.current=false;
      if(!gpsFixUsable(candidate)){setGpsState('weak');return}
      if(!probe&&probeBlockedRef.current)return;
      const previous=previousFixRef.current;
      if(!plausibleGpsTransition(previous,candidate)){setGpsState('weak');return}
      const current={...candidate,heading:navigationHeading(previous,candidate)};
      previousFixRef.current=current;lastGoodAtRef.current=Date.now();positionRef.current=current;setPosition(current);
      ensureOfflineCoverageRef.current?.(current);
      const near=nearestPolylinePoint(current,track.points),proximity=routeProximity(near?.distance??Infinity,current.accuracy);
      setOffRoute(near?.distance??null);setGpsState(proximity.status);
      mapRef.current?._encumbrateSetUserPosition?.(current);
    };
    const probe=()=>{
      if(disposed||probeRunning)return;
      probeRunning=true;
      navigator.geolocation.getCurrentPosition(position=>{probeRunning=false;applyFix(toCandidate(position),{probe:true})},error=>{probeRunning=false;markError(error)},{enableHighAccuracy:true,maximumAge:0,timeout:6000});
    };
    const watchdog=setInterval(()=>{const last=lastGoodAtRef.current;if(last&&Date.now()-last>12000){probeBlockedRef.current=true;setGpsState('paused')}},2000),probeTimer=setInterval(probe,7000),watch=navigator.geolocation.watchPosition(position=>applyFix(toCandidate(position)),markError,{enableHighAccuracy:true,maximumAge:1000,timeout:12000});
    const onVisibility=()=>{if(document.visibilityState==='visible')probe()};
    document.addEventListener('visibilitychange',onVisibility);
    probe();
    return()=>{disposed=true;clearInterval(watchdog);clearInterval(probeTimer);document.removeEventListener('visibilitychange',onVisibility);navigator.geolocation.clearWatch(watch)}
  },[track.id]);
  const statusTitle=gpsState==='searching'?'Buscando ubicación…':gpsState==='unsupported'?'Ubicación no disponible':gpsState==='denied'?'Permiso de ubicación bloqueado':gpsState==='paused'?'Señal de ubicación interrumpida':gpsState==='weak'?'Precisión de ubicación insuficiente':gpsState==='on-track'?'Vas por el sendero':gpsState==='near'?'Cerca del trazado':gpsState==='uncertain'?'Posición aproximada':offRoute!==null?`A ${Math.round(offRoute)} m del sendero`:'Buscando ubicación…',precisionLabel=position?(gpsState==='paused'||gpsState==='denied'||gpsState==='unsupported'?`Última precisión válida ±${Math.round(position.accuracy)} m`:`Precisión de ubicación ±${Math.round(position.accuracy)} m`):'Mantén la ubicación activada',offlineLabel=offlineMapState==='preparing'?'Preparando mapa offline…':offlineMapState==='ready'?'Mapa offline preparado':offlineMapState==='missing'?'Mapa offline no disponible':null,networkOffline=typeof navigator!=='undefined'&&!navigator.onLine;
  return <div className="liveGuide" role="dialog" aria-modal="true" aria-label={`Guía de ${route.name}`}><div ref={nodeRef} className="liveGuideMap"/><header><button onClick={onBack} aria-label="Volver">‹</button><div><small>NAVEGACIÓN ACTIVA</small><strong>{route.name}</strong></div></header><div className="liveGuideStatus"><span className={gpsState==='off-route'?'warning':'ok'}/><div><strong>{statusTitle}</strong><small>{precisionLabel}{offlineLabel?` · ${offlineLabel}`:''}</small></div></div>{tileError&&<div className="liveGuideOffline">{offlineMapState==='ready'?(networkOffline?'Sin conexión · cartografía offline activa':'Cartografía offline activa · mapa online no disponible'):'Sin conexión cartográfica · solo trazado disponible'}</div>}<button className="recenterGuide" onClick={()=>{setFollowing(true);if(position)mapRef.current?.setView([position.lat,position.lon],16)}}>⌖ Centrarme</button><div className="liveGuideActions"><button onClick={onLost}>⚠ Estoy perdido</button><button onClick={onFinish}>Finalizar ruta</button></div></div>
}
