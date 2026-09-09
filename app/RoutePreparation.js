'use client';
import { useEffect, useState } from 'react';
import './route-preparation.css';

export default function RoutePreparation({ route, download, readSaved }) {
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const sync = () => setSaved(readSaved(route.id));
    sync();
    window.addEventListener('encumbrate:route-offline', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('encumbrate:route-offline', sync);
      window.removeEventListener('storage', sync);
    };
  }, [route.id, readSaved]);
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
      <small>Guardar el trazado no inicia el registro GPS ni descarga el mapa de fondo completo.</small>
    </div>
    <p>Revisa el acceso y los avisos de la ruta. Cuando estés listo, utiliza el botón habitual de iniciar ruta.</p>
  </section>;
}
