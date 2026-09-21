'use client';
import { useEffect, useState } from 'react';
import './route-preparation.css';
import {downloadRouteOfflinePack,getOfflinePack} from '../lib/offline-mosaic';

export default function RoutePreparation({ route, download, readSaved }) {
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mapPack, setMapPack] = useState(null);
  const [mapBusy, setMapBusy] = useState(false);
  const [mapProgress, setMapProgress] = useState(0);
  useEffect(() => {
    const sync = () => { setSaved(readSaved(route.id)); getOfflinePack(`route:${route.id}`).then(setMapPack).catch(()=>{}); };
    sync();
    window.addEventListener('encumbrate:route-offline', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('encumbrate:route-offline', sync);
      window.removeEventListener('storage', sync);
    };
  }, [route.id, readSaved]);
  async function saveDetailedMap() {
    const track=saved||readSaved(route.id)||await download(route);
    setSaved(track);setMapBusy(true);setMapProgress(0);setError('');
    try { const pack=await downloadRouteOfflinePack({...track,name:route.name},{onProgress:p=>setMapProgress(p.percentage)}); setMapPack(pack); }
    catch { setError('No se ha podido descargar el mapa detallado. Comprueba la conexión y el espacio disponible.'); }
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
      {mapPack?.status==='ready' && <small>✓ Cartografía de ruta disponible offline · zoom 10–15.</small>}
      <small>El trazado y el mapa son independientes: el trazado ocupa muy poco; la cartografía detallada solo se descarga para esta ruta.</small>
    </div>
    <p>Revisa el acceso y los avisos de la ruta. Cuando estés listo, utiliza el botón habitual de iniciar ruta.</p>
  </section>;
}
