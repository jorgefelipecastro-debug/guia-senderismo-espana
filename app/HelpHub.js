'use client';
import { useEffect, useRef, useState } from 'react';
import { searchHelp } from '../lib/help-topics';
import './help-hub.css';

export default function HelpHub({ close, navigate }) {
  const dialog=useRef(null);
  const [query,setQuery]=useState('');
  const [description,setDescription]=useState('');
  const [message,setMessage]=useState('');
  const [version,setVersion]=useState('Sin consultar');
  const [checking,setChecking]=useState(false);
  useEffect(()=>{
    const element=dialog.current, previous=document.body.style.overflow;
    element.showModal();document.body.style.overflow='hidden';
    return()=>{element.close();document.body.style.overflow=previous;};
  },[]);
  async function checkVersion(){
    setChecking(true);
    try{
      const response=await fetch('/api/health',{cache:'no-store',signal:AbortSignal.timeout(10000)});
      const body=await response.json();
      if(!response.ok || typeof body.release!=='string')throw new Error();
      setVersion(body.release);
    }catch{setVersion('No disponible. Comprueba tu conexión.');}
    finally{setChecking(false);}
  }
  function downloadReport(event){
    event.preventDefault();
    if(description.trim().length<10){setMessage('Describe el problema con al menos 10 caracteres.');return;}
    const report=`ENCÚMBRATE · Informe de problema\n\nDescripción:\n${description.trim()}\n\nVersión del servidor consultada: ${version}\n\nEste informe no se ha enviado automáticamente.\n`;
    const url=URL.createObjectURL(new Blob([report],{type:'text/plain;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='encumbrate-problema.txt';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    setMessage('Descarga solicitada. El informe no se ha enviado a soporte.');
  }
  const topics=searchHelp(query);
  return <dialog ref={dialog} className="settingsHub helpHub" aria-labelledby="help-title" onCancel={event=>{event.preventDefault();close();}}>
    <header><button type="button" onClick={close} autoFocus>‹ Volver a Encúmbrate</button><h1 id="help-title">Ayuda</h1><p>Encuentra una respuesta y sigue tu camino.</p></header>
    <div className="settingsContent">
      <label className="helpSearch">¿En qué podemos ayudarte?<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Brújula, descargas, fotos…"/></label>
      <p role="status">{topics.length} respuestas{query ? ' encontradas' : ' disponibles'}</p>
      {!topics.length&&<p>Prueba con una palabra como «GPS» o «descarga», o prepara un informe más abajo.</p>}
      {topics.map(topic=><details key={`${query}:${topic.id}`}><summary>{topic.title}</summary><small>{topic.group}</small><p>{topic.text}</p>{topic.action&&<button type="button" onClick={()=>navigate(topic.action)}>{topic.label}</button>}</details>)}
      <details><summary>Versión y novedades</summary><p>Últimas incorporaciones: Música, Material, la ficha ampliada de rutas y Configuración.</p><p>Versión publicada en el servidor: {version}</p><button type="button" disabled={checking} onClick={checkVersion}>{checking?'Consultando…':'Consultar versión publicada'}</button><p>Esta consulta no confirma qué versión conserva una pestaña antigua. Actualiza la página cuando no estés registrando una ruta.</p></details>
      <details><summary>Preparar un informe de problema</summary><p>Describe qué estabas haciendo, qué esperabas y qué ocurrió. Podrás descargar el informe para compartirlo tú mismo. No hay envío a soporte desde este formulario.</p>
        <form onSubmit={downloadReport}><label>Descripción<textarea value={description} onChange={e=>setDescription(e.target.value)} minLength={10} maxLength={2000} required rows={5}/></label><p>El archivo incluirá solo tu descripción y la versión del servidor que hayas consultado. No añade ubicación, cuenta ni capturas automáticamente. Evita escribir contraseñas o datos personales.</p><button type="submit">Descargar informe</button><p role="status">{message}</p></form>
      </details>
      <aside className="helpEmergency"><strong>¿Es una emergencia?</strong><p>Ayuda no es un servicio de urgencias.</p><a href="tel:112">Llamar al 112</a></aside>
    </div>
  </dialog>;
}
