'use client';
import { useEffect, useRef, useState } from 'react';
import { SETTINGS_KEY, DEFAULT_SETTINGS, readSettings, applySettings } from '../lib/app-settings';

const PREFIX = 'encumbrate:offline-route:';
export default function SettingsHub({ close }) {
  const dialog = useRef(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [downloads, setDownloads] = useState([]);
  const [message, setMessage] = useState('');
  const [permissions, setPermissions] = useState({});
  function refreshDownloads() {
    try {
      const found = [];
      for (let i=0; i<localStorage.length; i++) {
        const key=localStorage.key(i);
        if (!key?.startsWith(PREFIX) && key !== 'encumbrate:offline-route') continue;
        try {
          const raw=localStorage.getItem(key), item=JSON.parse(raw);
          if (item?.id && Array.isArray(item.points) && item.points.length>1) found.push({key,id:item.id,name:item.name||'Ruta guardada',bytes:new Blob([raw]).size});
        } catch { /* Ignore invalid entries without modifying them. */ }
      }
      setDownloads(found);
    } catch { setMessage('No se puede consultar el almacenamiento en este navegador.'); }
  }
  async function refreshPermissions() {
    const result={};
    for (const name of ['geolocation','camera','notifications']) {
      try { const status=await navigator.permissions.query({name}); result[name]=({granted:'Permitido',denied:'Bloqueado',prompt:'Pendiente de autorización'})[status.state] || 'No disponible'; }
      catch { result[name]='No consultable en este navegador'; }
    }
    setPermissions(result);
  }
  useEffect(() => {
    const element=dialog.current, previous=document.body.style.overflow;
    element.showModal(); document.body.style.overflow='hidden';
    setSettings(readSettings()); refreshDownloads(); refreshPermissions();
    window.addEventListener('encumbrate:route-offline', refreshDownloads);
    window.addEventListener('storage', refreshDownloads);
    return () => { element.close(); document.body.style.overflow=previous; window.removeEventListener('encumbrate:route-offline', refreshDownloads); window.removeEventListener('storage', refreshDownloads); };
  }, []);
  function change(patch) {
    const next={...settings,...patch};
    try { localStorage.setItem(SETTINGS_KEY,JSON.stringify(next)); setSettings(next); applySettings(next); window.dispatchEvent(new Event('encumbrate:settings')); setMessage('Preferencias guardadas en este dispositivo.'); }
    catch { setMessage('No se han podido guardar los ajustes. Comprueba el espacio disponible.'); }
  }
  function remove(item) {
    if (!window.confirm(`¿Eliminar el trazado descargado de «${item.name}»? Dejará de estar disponible sin conexión. No lo elimines si lo necesitas durante una salida.`)) return;
    try {
      // Remove all local copies of this track, including the legacy copy, to prevent its restoration.
      downloads.filter(entry=>entry.id===item.id).forEach(entry=>localStorage.removeItem(entry.key));
      refreshDownloads(); window.dispatchEvent(new Event('encumbrate:route-offline')); setMessage('Trazado descargado eliminado. El historial y el registro GPS se conservan.');
    } catch { setMessage('No se ha podido eliminar el trazado.'); }
  }
  const unique=downloads.filter((item,index)=>downloads.findIndex(other=>other.id===item.id)===index);
  return <dialog ref={dialog} className="settingsHub" aria-labelledby="settings-title" onCancel={event=>{event.preventDefault();close();}}>
    <header><button type="button" onClick={close} autoFocus>‹ Volver a Encúmbrate</button><h1 id="settings-title">Configuración</h1><p>A tu manera, en este dispositivo.</p></header>
    <div className="settingsContent">
      <p role="status" className="settingsMessage">{message}</p>
      <details open><summary>Preferencias de rutas</summary>
        <p>Se aplican a las rutas de Explorar. Puedes cambiar el nivel también desde su buscador.</p>
        <label>Nivel habitual<select value={settings.level} onChange={e=>change({level:e.target.value})}><option value="todas">Todos los niveles</option><option value="principiante">Principiante</option><option value="intermedio">Intermedio</option><option value="experto">Experto</option></select></label>
        <label>Distancia máxima de la ruta<select value={settings.maxDistance} onChange={e=>change({maxDistance:Number(e.target.value)})}>{[0,5,10,15,20,30].map(km=><option key={km} value={km}>{km ? `Hasta ${km} km` : 'Sin límite'}</option>)}</select></label>
        <p>La distancia filtra las rutas cargadas; puedes cargar más resultados desde Explorar.</p>
      </details>
      <details><summary>Accesibilidad</summary>
        <label className="settingsToggle"><input type="checkbox" checked={settings.largeText} onChange={e=>change({largeText:e.target.checked})}/> Texto de lectura más grande</label>
        <label className="settingsToggle"><input type="checkbox" checked={settings.reducedMotion} onChange={e=>change({reducedMotion:e.target.checked})}/> Reducir animaciones decorativas</label>
      </details>
      <details><summary>Descargas y almacenamiento</summary>
        <p>{unique.length} trazados · {(downloads.reduce((total,item)=>total+item.bytes,0)/1024).toLocaleString('es-ES',{maximumFractionDigits:1})} KB de datos guardados.</p>
        <p>Este listado corresponde a los trazados de la web, no a mapas completos ni a descargas nativas de Android.</p>
        {unique.length ? unique.map(item=><div className="settingsDownload" key={item.id}><strong>{item.name}</strong><button type="button" onClick={()=>remove(item)}>Eliminar descarga</button></div>) : <p>No hay trazados guardados en este navegador.</p>}
      </details>
      <details><summary>Permisos del dispositivo</summary>
        <dl>{[['geolocation','Ubicación'],['camera','Cámara'],['notifications','Notificaciones']].map(([key,label])=><div key={key}><dt>{label}</dt><dd>{permissions[key]||'Consultando…'}</dd></div>)}</dl>
        <p>Para cambiarlos, abre los permisos de este sitio desde el navegador o los ajustes de la aplicación en tu móvil. Mostrar un permiso no activa avisos ni notificaciones.</p>
        <button type="button" onClick={refreshPermissions}>Actualizar estado de permisos</button>
      </details>
    </div>
  </dialog>;
}
