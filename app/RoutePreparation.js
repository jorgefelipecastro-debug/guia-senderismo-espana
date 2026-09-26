'use client';
import { useEffect, useState } from 'react';
import './route-preparation.css';
import {downloadRouteOfflinePack,getOfflinePack} from '../lib/offline-mosaic';
import {liveMapTrackKey} from '../lib/live-offline-map';
import {operationalFetch} from '../lib/operational-api';

const ACCESS_PROFILE='street-walking-v2';

export default function RoutePreparation({ route, download, readSaved }) {
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mapPack, setMapPack] = useState(null);
  const [mapBusy, setMapBusy] = useState(false);
  const [mapProgress, setMapProgress] = useState(0);
  const [accessBusy, setAccessBusy] = useState(false);
  const [accessReady, setAccessReady] = useState(false);
  const [accessError, setAccessError] = useState('');
  useEffect(() => {
    const sync = () => {
      const stored=readSaved(route.id);
      setSaved(stored);
      getOfflinePack(`route:${route.id}`).then(pack=>setMapPack(pack?.geometryKey===liveMapTrackKey(stored)?pack:null)).catch(()=>{});
      try {
        const access=JSON.parse(localStorage.getItem(`encumbrate:offline-access:${route.id}`)||'null');
        setAccessReady(Boolean(access?.points?.length>1&&access?.routingProfile===ACCESS_PROFILE));
      } catch { setAccessReady(false); }
    };
    sync();
    window.addEventListener('encumbrate:route-offline', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('encumbrate:route-offline', sync);
      window.removeEventListener('storage', sync);
    };
  }, [route.id, readSaved]);
  function currentPosition() {
    return new Promise((resolve,reject)=>{
      if(!navigator.geolocation)return reject(new Error('Este dispositivo no ofrece ubicación.'));
      navigator.geolocation.getCurrentPosition(
        ({coords,timestamp})=>resolve({
          lat:coords.latitude,
          lon:coords.longitude,
          accuracy:Number(coords.accuracy||999),
          at:Number(timestamp)||Date.now(),
        }),
        ()=>reject(new Error('No se ha podido obtener tu posición. Revisa el permiso de ubicación y prueba al aire libre.')),
        {enableHighAccuracy:true,maximumAge:0,timeout:15000},
      );
    });
  }
  async function prepareAccess() {
    setAccessBusy(true);setAccessError('');
    try {
      const track=saved||readSaved(route.id)||await download(route);
      setSaved(track);
      if(!Array.isArray(track?.points)||track.points.length<2)throw new Error('El trazado no tiene un inicio válido.');
      const from=await currentPosition(),to=track.points[0];
      if(from.accuracy>80)throw new Error('La precisión GPS es demasiado baja para preparar el acceso. Busca cielo abierto y vuelve a intentarlo.');
      const response=await operationalFetch('/api/navigation/return',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({from,to}),
      });
      const body=await response.json();
      if(!response.ok||!Array.isArray(body.points)||body.points.length<2)
        throw new Error(body.error||'No se ha podido calcular un acceso peatonal fiable.');
      const access={
        routeId:route.id,
        from,to,
        points:body.points,
        distanceM:Number(body.distanceM||0),
        provider:body.provider||'Mapbox Walking',
        routingProfile:body.routingProfile||ACCESS_PROFILE,
        warning:body.warning||'',
        savedAt:new Date().toISOString(),
      };
      localStorage.setItem(`encumbrate:offline-access:${route.id}`,JSON.stringify(access));
      setAccessReady(true);
    } catch(error) {
      setAccessReady(false);
      setAccessError(error.message||'No se ha podido preparar el acceso al inicio.');
    } finally { setAccessBusy(false); }
  }
  async function saveDetailedMap() {
    setMapBusy(true);setMapProgress(0);setError('');
    try {
      const track=await download(route);
      setSaved(track);
      const pack=await downloadRouteOfflinePack({...track,name:route.name},{onProgress:p=>setMapProgress(p.percentage)});
      setMapPack(pack);
    }
    catch (reason) { setError(reason?.message||'No se ha podido descargar el mapa detallado. Comprueba la conexión y el espacio disponible.'); }
    finally { setMapBusy(false); }
  }
  async function saveTrack() {
    setBusy(true);
    setError('');
    try { setSaved(await download(route)); }
    catch { setError('No se ha podido guardar el trazado. Comprueba la conexión y el espacio disponible e inténtalo de nuevo.'); }
    finally { setBusy(false); }
  }
  return <section className="routePreparation" aria-label="Preparar mi salida">
    <h2>Preparar mi salida</h2>
    <p>Deja listo lo necesario antes de empezar esta ruta.</p>
    <button className="routeMaterialButton" onClick={() => window.dispatchEvent(new CustomEvent('encumbrate:open-material', { detail: route }))}>🎒 Preparar material para esta ruta</button>
    <div className="routePreparationTrack">
      <strong>Trazado en este dispositivo</strong>
      <p role="status">{saved ? 'Trazado guardado para consultar sin conexión.' : 'Todavía no has guardado este trazado.'}</p>
      <button type="button" onClick={saveTrack} disabled={busy}>{busy ? 'Guardando trazado…' : saved ? 'Actualizar trazado' : 'Guardar trazado para la salida'}</button>
      {error && <p role="alert">{error}</p>}
      {saved && <p><a href={`/offline.html?route=${encodeURIComponent(route.id)}`} target="_blank" rel="noopener">Abrir comprobación offline ↗</a></p>}
      <button type="button" onClick={saveDetailedMap} disabled={mapBusy}>{mapPack?.status==='ready'?'Actualizar mapa detallado':mapBusy?`Descargando mapa… ${mapProgress}%`:'Descargar mapa detallado de esta ruta'}</button>
      {mapPack?.status==='ready' && <small>✓ Cartografía de toda la ruta disponible offline · hasta zoom {mapPack.maxZoom}.</small>}
      <button type="button" onClick={prepareAccess} disabled={accessBusy}>{accessBusy?'Calculando acceso peatonal…':accessReady?'Actualizar acceso offline al inicio':'Preparar acceso offline al inicio'}</button>
      {accessReady && <small>✓ Acceso peatonal guardado desde tu posición actual. Si sales desde otro lugar, vuelve a prepararlo.</small>}
      {accessError && <small role="alert">{accessError}</small>}
      <small>Mapa, trazado y acceso al inicio se guardan por separado. El acceso usa caminos peatonales cartografiados; no sustituye la valoración del terreno real.</small>
    </div>
    <p>Revisa el acceso y los avisos de la ruta. Cuando estés listo, utiliza el botón habitual de iniciar ruta.</p>
  </section>;
}
